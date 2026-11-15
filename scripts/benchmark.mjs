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

function run(label, data, pivotConfig, limitMs) {
  buildPivot(data, pivotConfig);
  const runs = [];
  for (let run = 0; run < 3; run += 1) {
    const start = performance.now();
    const result = buildPivot(data, pivotConfig);
    runs.push(performance.now() - start);
    if (run === 0 && result.rows.length === 0) {
      throw new Error(`${label}: benchmark produced an empty pivot`);
    }
  }
  runs.sort((left, right) => left - right);
  const median = Math.round(runs[1]);
  return {
    label,
    rows: data.length,
    runsMs: runs.map((value) => Math.round(value)),
    medianMs: median,
    limitMs,
  };
}

const small = Array.from({ length: 10_000 }, (_value, index) => ({
  region: `R${index % 40}`,
  city: `C${index % 7}`,
  month: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
  amount: (index * 37) % 500,
}));

const large = Array.from({ length: 50_000 }, (_value, index) => ({
  region: `R${index % 20}`,
  city: `C${index % 10}`,
  month: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
  amount: (index * 37) % 1000,
}));

const limit10k = Number(process.env.BENCH_MAX_MS ?? 500);
const limit50k = Number(process.env.BENCH_MAX_50K_MS ?? 2500);

const report = [
  run('10k', small, config, limit10k),
  run('50k', large, config, limit50k),
];

console.log(JSON.stringify(report, null, 2));
await rm(path.join(root, '.bench'), { recursive: true, force: true });

const failed = report.filter((entry) => entry.medianMs > entry.limitMs);
if (failed.length > 0) {
  for (const entry of failed) {
    console.error(
      `${entry.label} exceeded limit: ${entry.medianMs}ms > ${entry.limitMs}ms`,
    );
  }
  process.exit(1);
}

