import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

/** Bundle budget (quality.md): the main entry chunk must stay ≤ 250 KB gzipped. */
const BUDGET_BYTES = 250 * 1024;
const dist = new URL('../dist/', import.meta.url);

const html = await readFile(new URL('index.html', dist), 'utf8');
const entry = /<script type="module" crossorigin src="\/([^"]+\.js)"/.exec(html)?.[1];
if (!entry) {
  process.stderr.write('Entry chunk not found in dist/index.html\n');
  process.exit(1);
}
const size = gzipSync(await readFile(new URL(entry, dist))).length;
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;
if (size > BUDGET_BYTES) {
  process.stderr.write(
    `Main chunk ${entry} is ${kb(size)} gzipped — over the ${kb(BUDGET_BYTES)} budget\n`,
  );
  process.exit(1);
}
process.stdout.write(`Main chunk ${entry}: ${kb(size)} gzipped (budget ${kb(BUDGET_BYTES)})\n`);
