import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outfile = path.join(root, '.bench', 'core.mjs');
await mkdir(path.dirname(outfile), { recursive: true });

await build({
  entryPoints: [path.join(root, 'projects/pivot-grid/src/lib/core/public-api.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  logLevel: 'silent',
});

const { buildPivot } = await import(pathToFileURL(outfile).href);

const rows = Number(process.env.BENCH_ROWS ?? 10_000);
const maxMs = Number(process.env.BENCH_MAX_MS ?? 500);

const data = [];
for (let index = 0; index < rows; index += 1) {
  data.push({
    region: `R${index % 40}`,
    city: `C${index % 7}`,
    month: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
    amount: (index * 37) % 500,
  });
}

const config = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'Cidade' },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'Total' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 'all',
  locale: 'pt-BR',
};

buildPivot(data, config);

const runs = [];
for (let run = 0; run < 3; run += 1) {
  const start = performance.now();
  const result = buildPivot(data, config);
  runs.push(performance.now() - start);
  if (run === 0 && result.rows.length === 0) {
    throw new Error('benchmark produced an empty pivot');
  }
}

runs.sort((left, right) => left - right);
const median = Math.round(runs[1]);
const report = {
  rows,
  columns: 12,
  runsMs: runs.map((value) => Math.round(value)),
  medianMs: median,
  limitMs: maxMs,
};

console.log(JSON.stringify(report, null, 2));
await rm(path.join(root, '.bench'), { recursive: true, force: true });

if (median > maxMs) {
  console.error(`benchmark exceeded limit: ${median}ms > ${maxMs}ms`);
  process.exit(1);
}
