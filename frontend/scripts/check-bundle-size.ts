import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

/**
 * Bundle budgets, gzipped: the entry chunk (quality.md: ≤ 250 KB) and everything the first page
 * load fetches — the entry plus the chunks index.html preloads, which is what a visitor waits for.
 */
const ENTRY_BUDGET = 250 * 1024;
const INITIAL_BUDGET = 330 * 1024;
const dist = new URL('../dist/', import.meta.url);

const html = await readFile(new URL('index.html', dist), 'utf8');
const entry = /<script type="module" crossorigin src="\/([^"]+\.js)"/.exec(html)?.[1];
if (!entry) {
  process.stderr.write('Entry chunk not found in dist/index.html\n');
  process.exit(1);
}
const preloaded = [...html.matchAll(/<link rel="modulepreload" crossorigin href="\/([^"]+\.js)"/g)]
  .map((match) => match[1])
  .filter((file): file is string => file !== undefined);

const gzipped = async (file: string): Promise<number> =>
  gzipSync(await readFile(new URL(file, dist))).length;
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

const entrySize = await gzipped(entry);
const initialSize = (await Promise.all([entry, ...preloaded].map(gzipped))).reduce(
  (sum, size) => sum + size,
  0,
);

const failures = [
  entrySize > ENTRY_BUDGET && `entry ${kb(entrySize)} > ${kb(ENTRY_BUDGET)}`,
  initialSize > INITIAL_BUDGET && `first load ${kb(initialSize)} > ${kb(INITIAL_BUDGET)}`,
].filter(Boolean);
if (failures.length > 0) {
  process.stderr.write(`Bundle over budget (gzipped): ${failures.join('; ')}\n`);
  process.exit(1);
}
process.stdout.write(
  `Entry ${kb(entrySize)} (budget ${kb(ENTRY_BUDGET)}) · first load ${kb(initialSize)} in ${preloaded.length + 1} files (budget ${kb(INITIAL_BUDGET)}) — gzipped\n`,
);
