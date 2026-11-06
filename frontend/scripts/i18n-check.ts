import { readdir, readFile } from 'node:fs/promises';

/** Fails on locale key mismatch or an ErrorCode without a message (ux.md → i18n). */
const LOCALES_DIR = new URL('../src/locales/', import.meta.url);
const REFERENCE_LOCALE = 'en';

const flatten = (value: unknown, prefix: string): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => flatten(child, `${prefix}.${key}`))
    : [prefix];

const readKeys = async (locale: string): Promise<Set<string>> => {
  const dir = new URL(`${locale}/`, LOCALES_DIR);
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
  const keys = await Promise.all(
    files.map(async (file) => {
      const content: unknown = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
      const namespace = file.replace(/\.json$/, '');
      return flatten(content, namespace).map((key) => key.replace('.', ':'));
    }),
  );
  return new Set(keys.flat());
};

const readErrorCodes = async (): Promise<string[]> => {
  const spec: unknown = JSON.parse(
    await readFile(new URL('../../backend/openapi.json', import.meta.url), 'utf8'),
  );
  const codes = (spec as { components?: { schemas?: { ErrorCode?: { enum?: unknown } } } })
    .components?.schemas?.ErrorCode?.enum;
  return Array.isArray(codes)
    ? codes.filter((code): code is string => typeof code === 'string')
    : [];
};

const locales = (await readdir(LOCALES_DIR, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const reference = await readKeys(REFERENCE_LOCALE);
const problems = (await readErrorCodes())
  .filter((code) => !reference.has(`errors:${code}`))
  .map((code) => `${REFERENCE_LOCALE}: missing errors:${code}`);
for (const locale of locales.filter((name) => name !== REFERENCE_LOCALE)) {
  const keys = await readKeys(locale);
  problems.push(
    ...[...reference].filter((key) => !keys.has(key)).map((key) => `${locale}: missing ${key}`),
    ...[...keys].filter((key) => !reference.has(key)).map((key) => `${locale}: unexpected ${key}`),
  );
}
if (problems.length > 0) {
  process.stderr.write(`${problems.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`i18n check passed (${locales.join(', ')}, ${reference.size} keys)\n`);
