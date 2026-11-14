import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist', 'pivot-grid');
const errors = [];

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const rootPkg = readJson('package.json');
const libPkg = readJson(path.join('projects', 'pivot-grid', 'package.json'));

if (!existsSync(distDir)) {
  console.error('verify-package: dist/pivot-grid not found. Run `npm run build:lib` first.');
  process.exit(1);
}

const distPkg = JSON.parse(readFileSync(path.join(distDir, 'package.json'), 'utf8'));
const tag = (process.env.GITHUB_REF_NAME ?? process.argv[2] ?? '').replace(/^v/, '');

if (distPkg.name !== 'pivot-grid') {
  errors.push(`dist name must be "pivot-grid" (got "${distPkg.name}")`);
}
if (distPkg.version !== libPkg.version) {
  errors.push(`dist version ${distPkg.version} != lib version ${libPkg.version}`);
}
if (rootPkg.version && rootPkg.version !== libPkg.version) {
  errors.push(`root version ${rootPkg.version} != lib version ${libPkg.version}`);
}
if (tag && tag !== distPkg.version) {
  errors.push(`tag ${tag} != package version ${distPkg.version}`);
}
for (const file of ['LICENSE', 'README.md']) {
  if (!existsSync(path.join(distDir, file))) {
    errors.push(`missing ${file} in dist`);
  }
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packRaw = execFileSync(
  npm,
  ['pack', './dist/pivot-grid', '--dry-run', '--json', '--silent'],
  { encoding: 'utf8', shell: process.platform === 'win32' },
);
const pack = JSON.parse(packRaw)[0] ?? {};
if (pack.name !== 'pivot-grid') {
  errors.push(`npm pack name ${pack.name} != pivot-grid`);
}
if (pack.version !== distPkg.version) {
  errors.push(`npm pack version ${pack.version} != ${distPkg.version}`);
}
if (!(pack.files ?? []).some((file) => file.path === 'LICENSE')) {
  errors.push('npm pack does not include LICENSE');
}

if (errors.length > 0) {
  console.error('verify-package failed:');
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log(
  `verify-package OK: ${distPkg.name}@${distPkg.version} (${(pack.files ?? []).length} files)`,
);
