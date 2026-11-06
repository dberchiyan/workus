import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ERROR_CODES } from '../src/common/exception/error-code';

const I18N_ROOT = join(__dirname, '..', 'src', 'i18n');
const FALLBACK_LOCALE = 'en';

const flatten = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
};

const readKeys = async (locale: string): Promise<Set<string>> => {
  const files = (await readdir(join(I18N_ROOT, locale))).filter((file) => file.endsWith('.json'));
  const keys = await Promise.all(
    files.map(async (file) => {
      const content: unknown = JSON.parse(await readFile(join(I18N_ROOT, locale, file), 'utf8'));
      return flatten(content, file.replace(/\.json$/, '')).filter((key) => !key.endsWith('.'));
    }),
  );
  return new Set(keys.flat());
};

/** Fails on locale key mismatch or an ErrorCode without a message. */
const check = async (): Promise<void> => {
  const locales = (await readdir(I18N_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const reference = await readKeys(FALLBACK_LOCALE);
  const problems: string[] = ERROR_CODES.filter((code) => !reference.has(`errors.${code}`)).map(
    (code) => `${FALLBACK_LOCALE}: missing message for ErrorCode ${code}`,
  );
  for (const locale of locales.filter((name) => name !== FALLBACK_LOCALE)) {
    const keys = await readKeys(locale);
    problems.push(
      ...[...reference].filter((key) => !keys.has(key)).map((key) => `${locale}: missing ${key}`),
      ...[...keys]
        .filter((key) => !reference.has(key))
        .map((key) => `${locale}: unexpected ${key}`),
    );
  }
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`i18n check passed (${locales.join(', ')}, ${reference.size} keys)\n`);
};

void check();
