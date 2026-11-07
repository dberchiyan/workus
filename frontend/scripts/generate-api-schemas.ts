/**
 * Generates runtime response schemas (Zod) from backend/openapi.json — the same contract the
 * TypeScript types come from — and a table of which schema each endpoint answers with. The API
 * client checks every JSON response against it (src/shared/api/responseContract.ts).
 *
 * Shapes and types only: patterns, lengths and ranges are the server's input rules, not checked
 * here. Objects strip unknown keys (a server may add a field without breaking the client).
 *
 * Usage: node scripts/generate-api-schemas.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Schema = {
  $ref?: string;
  type?: string | string[];
  nullable?: boolean;
  enum?: (string | number | boolean | null)[];
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
};

type Operation = {
  responses?: Record<string, { content?: Record<string, { schema?: Schema }> }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(resolve(root, '../backend/openapi.json'), 'utf8')) as {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema> };
};
const OUTPUT = resolve(root, 'src/shared/api/schemas.generated.ts');

const identifier = (name: string): string => name.replace(/\W/g, '_');
const refName = (ref: string): string => identifier(ref.replace('#/components/schemas/', ''));
const PURE = '/* @__PURE__ */ ';

/** Component schemas a schema refers to (for ordering). */
const refsOf = (schema: Schema | undefined, into: Set<string>): Set<string> => {
  if (!schema || typeof schema !== 'object') {
    return into;
  }
  if (schema.$ref) {
    into.add(refName(schema.$ref));
  }
  for (const part of [
    schema.items,
    ...(schema.allOf ?? []),
    ...(schema.oneOf ?? []),
    ...(schema.anyOf ?? []),
  ]) {
    refsOf(part, into);
  }
  for (const value of Object.values(schema.properties ?? {})) {
    refsOf(value, into);
  }
  if (typeof schema.additionalProperties === 'object') {
    refsOf(schema.additionalProperties, into);
  }
  return into;
};

const literal = (value: string | number | boolean | null): string => JSON.stringify(value);

const union = (members: string[]): string =>
  members.length === 1 ? (members[0] ?? 'z.never()') : `z.union([${members.join(', ')}])`;

/** Zod source for one schema. `lazyRefs`: references that must be deferred (cycles). */
const zodOf = (schema: Schema, lazyRefs: ReadonlySet<string>): string => {
  if (schema.$ref) {
    const name = refName(schema.$ref);
    return lazyRefs.has(name) ? `z.lazy(() => ${name})` : name;
  }
  const nullable = schema.nullable === true;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const withNull = nullable || types.includes('null');
  const wrap = (source: string): string => (withNull ? `${source}.nullable()` : source);

  if (schema.allOf?.length) {
    const parts = schema.allOf.map((part) => zodOf(part, lazyRefs));
    const [first, ...rest] = parts;
    return wrap(
      rest.reduce((acc, part) => `z.intersection(${acc}, ${part})`, first ?? 'z.unknown()'),
    );
  }
  const alternatives = schema.oneOf ?? schema.anyOf;
  if (alternatives?.length) {
    return wrap(union(alternatives.map((part) => zodOf(part, lazyRefs))));
  }
  if (schema.enum) {
    const values = schema.enum.filter((value) => value !== null);
    const strings = values.every((value) => typeof value === 'string');
    const source =
      strings && values.length > 0
        ? `z.enum([${values.map(literal).join(', ')}])`
        : union(values.map((value) => `z.literal(${literal(value)})`));
    return wrap(source);
  }

  const concrete = types.filter((type) => type !== 'null');
  const one = (type: string | undefined): string => {
    switch (type) {
      case 'string':
        return 'z.string()';
      case 'integer':
        return 'z.number().int()';
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'array':
        return `z.array(${schema.items ? zodOf(schema.items, lazyRefs) : 'z.unknown()'})`;
      case 'object':
      case undefined: {
        if (schema.properties) {
          const required = new Set(schema.required ?? []);
          const fields = Object.entries(schema.properties).map(([key, value]) => {
            const field = zodOf(value, lazyRefs);
            return `${JSON.stringify(key)}: ${required.has(key) ? field : `${field}.optional()`}`;
          });
          return `z.object({ ${fields.join(', ')} })`;
        }
        if (typeof schema.additionalProperties === 'object') {
          return `z.record(z.string(), ${zodOf(schema.additionalProperties, lazyRefs)})`;
        }
        return type === 'object' ? 'z.record(z.string(), z.unknown())' : 'z.unknown()';
      }
      default:
        return 'z.unknown()';
    }
  };
  return wrap(concrete.length > 1 ? union(concrete.map(one)) : one(concrete[0]));
};

// Response schemas of every operation (JSON 2xx), and the component schemas they need.
const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).flatMap(([method, operation]) => {
    const success = Object.entries(operation.responses ?? {}).find(([status]) =>
      /^2\d\d$/.test(status),
    );
    const schema = success?.[1].content?.['application/json']?.schema;
    return schema ? [{ method, path, schema }] : [];
  }),
);

const needed = new Set<string>();
const visit = (name: string): void => {
  if (needed.has(name)) {
    return;
  }
  needed.add(name);
  const component =
    spec.components.schemas[
      Object.keys(spec.components.schemas).find((key) => identifier(key) === name) ?? ''
    ];
  for (const ref of refsOf(component, new Set())) {
    visit(ref);
  }
};
for (const { schema } of operations) {
  for (const ref of refsOf(schema, new Set())) {
    visit(ref);
  }
}

// Dependency order; a reference back to a schema not yet declared is deferred with z.lazy.
const byName = new Map(
  Object.entries(spec.components.schemas)
    .filter(([key]) => needed.has(identifier(key)))
    .map(([key, schema]) => [identifier(key), schema]),
);
const ordered: string[] = [];
const state = new Map<string, 'visiting' | 'done'>();
const lazy = new Set<string>();
const order = (name: string): void => {
  if (state.get(name) === 'done') {
    return;
  }
  if (state.get(name) === 'visiting') {
    lazy.add(name);
    return;
  }
  state.set(name, 'visiting');
  for (const ref of refsOf(byName.get(name), new Set())) {
    order(ref);
  }
  state.set(name, 'done');
  ordered.push(name);
};
for (const name of [...byName.keys()].sort()) {
  order(name);
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
/** Per segment: 1 for a fixed name, 0 for a parameter — sorts the more specific path first. */
const specificity = (path: string): string =>
  path
    .split('/')
    .map((segment) => (segment.startsWith('{') ? '0' : '1'))
    .join('');

const pathPattern = (path: string): string =>
  `^${path
    .split(/\{[^}]+\}/)
    .map(escapeRegex)
    .join('[^/]+')}$`;

const lines = [
  '// Generated by scripts/generate-api-schemas.ts from backend/openapi.json — do not edit.',
  '// Run `npm run generate:api` after the API changes.',
  "import { z } from 'zod';",
  '',
  // Recursive schemas need an explicit type (TypeScript cannot infer a self-reference).
  ...ordered.map(
    (name) =>
      `export const ${name}${lazy.has(name) ? ': z.ZodType' : ''} = ${PURE}${zodOf(byName.get(name) ?? {}, lazy)};`,
  ),
  '',
  '/** The schema each endpoint answers with (JSON success responses). */',
  'export const RESPONSE_SCHEMAS: readonly { method: string; pattern: RegExp; schema: z.ZodType }[] = [',
  ...operations
    // A fixed segment wins over a parameter (`/employees/summary` before `/employees/{id}`):
    // the client takes the first match.
    .sort(
      (a, b) =>
        specificity(b.path).localeCompare(specificity(a.path)) ||
        a.path.localeCompare(b.path) ||
        a.method.localeCompare(b.method),
    )
    .map(
      ({ method, path, schema }) =>
        `  { method: '${method}', pattern: /${pathPattern(path)}/, schema: ${zodOf(schema, lazy)} },`,
    ),
  '];',
  '',
];
// Self-check: a call to each endpoint must find its own entry first — no other path may shadow it.
const sorted = [...operations].sort(
  (a, b) =>
    specificity(b.path).localeCompare(specificity(a.path)) ||
    a.path.localeCompare(b.path) ||
    a.method.localeCompare(b.method),
);
for (const operation of sorted) {
  const sample = operation.path.replace(/\{[^}]+\}/g, 'sample-id');
  const first = sorted.find(
    (entry) =>
      entry.method === operation.method && new RegExp(pathPattern(entry.path)).test(sample),
  );
  if (first !== operation) {
    throw new Error(
      `${operation.method.toUpperCase()} ${operation.path} is shadowed by ${first?.path ?? 'nothing'}`,
    );
  }
}

writeFileSync(OUTPUT, lines.join('\n'));
process.stdout.write(
  `api schemas: ${String(ordered.length)} schemas, ${String(operations.length)} endpoints → ${OUTPUT}\n`,
);
