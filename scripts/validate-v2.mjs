import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v1 = resolve(root, 'v1.x');
const v2 = resolve(root, 'v2.x');
const errors = [];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.less', '.md', '.php']);

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function repoPath(path) {
  return relative(root, path).replaceAll('\\', '/');
}

function checkRelativeImports(file) {
  const source = read(file);
  const pattern = /@import\s+url\(\s*["']?([^"')]+)["']?\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    if (!match[1].startsWith('.')) continue;
    const target = resolve(dirname(file), match[1].split(/[?#]/, 1)[0]);
    if (!existsSync(target)) fail(`${repoPath(file)}: missing import ${match[1]}`);
  }
}

if (!existsSync(v1)) fail('v1.x baseline is missing');
if (!existsSync(v2)) fail('v2.x compatibility tree is missing');

/* Every 1.x feature/file must have a 2.x counterpart. */
if (!errors.length) {
  const baseline = walk(v1);
  for (const source of baseline) {
    const rel = relative(v1, source);
    const target = resolve(v2, rel);
    if (!existsSync(target)) fail(`v2.x is missing baseline file: ${rel}`);
    else if (statSync(target).size === 0) fail(`v2.x contains empty file: ${rel}`);
  }
}

/* Operational v2 files must be self-contained. The root v2 README is the only
   intentional place where v1.x paths are discussed for migration/comparison. */
if (existsSync(v2)) {
  for (const file of walk(v2)) {
    if (!statSync(file).isFile()) continue;
    const rel = relative(v2, file).replaceAll('\\', '/');
    if (rel === 'README.md') continue;
    if (!textExtensions.has(extname(file).toLowerCase())) continue;

    const source = read(file);
    if (/\bv1\.x\//i.test(source)) {
      fail(`v2.x/${rel}: operational v2 file still references v1.x runtime content`);
    }

    if (['.html', '.js'].includes(extname(file).toLowerCase()) && /Flarum\s+1\.x/i.test(source)) {
      fail(`v2.x/${rel}: still identifies runtime output as Flarum 1.x`);
    }
  }
}

const entry = resolve(v2, 'core/htg.forum.css');
if (!existsSync(entry)) fail('v2.x/core/htg.forum.css is missing');
else {
  checkRelativeImports(entry);
  const css = read(entry);
  for (const required of [
    '../add-ons/motion.css',
    '../add-ons/header-panels.css',
    '../add-ons/direct-messages.css',
    '../add-ons/loading-screen.css',
    '../add-ons/mobile.css',
    '../add-ons/mobile-auth-tooltip.css',
    './htg.desktop.css',
    '../add-ons/flarum-2-compat.css',
  ]) {
    if (!css.includes(required)) fail(`v2 entry point is missing ${required}`);
  }
}

const compat = resolve(v2, 'add-ons/flarum-2-compat.css');
if (!existsSync(compat)) fail('v2.x/add-ons/flarum-2-compat.css is missing');
else {
  const css = read(compat);
  for (const required of [
    '--body-color: var(--text-color',
    '.OverflowingList-dropdown',
    '.App-primaryControl ~ .App-primaryControl',
    'max-width: 767.98px',
    'min-width: 768px',
  ]) {
    if (!css.includes(required)) fail(`Flarum 2 compatibility layer is missing: ${required}`);
  }
}

const packageFile = resolve(v2, 'extensions/hcf-dynamic-pages/composer.json');
if (!existsSync(packageFile)) fail('Flarum 2 dynamic-pages composer.json is missing');
else {
  try {
    const pkg = JSON.parse(read(packageFile));
    if (!pkg.require || !/^\^2(?:\.0)?/.test(String(pkg.require['flarum/core'] || ''))) {
      fail('HCF Dynamic Pages must require flarum/core ^2.x');
    }
    if (!pkg.require || !pkg.require['fof/pages']) fail('HCF Dynamic Pages must require fof/pages');
  } catch (error) {
    fail(`v2 dynamic-pages composer.json is invalid JSON: ${error.message}`);
  }
}

for (const rel of [
  'extensions/hcf-dynamic-pages/js/dist/forum.js',
  'extensions/hcf-dynamic-pages/js/dist/admin.js',
]) {
  const file = resolve(v2, rel);
  if (!existsSync(file)) {
    fail(`missing ${rel}`);
    continue;
  }
  const source = read(file);
  if (!source.includes('v2.x/pages/fof-pages')) fail(`${rel} does not default to the v2.x page tree`);
  if (/Flarum\s+1\.x/i.test(source)) fail(`${rel} still identifies itself as a Flarum 1.x runtime`);
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(`${rel} JavaScript syntax error: ${syntax.stderr.trim()}`);
}

/* The v2 FoF loader chain must point entirely at v2 assets/runtime files. */
for (const rel of [
  'pages/fof-pages/hcf-fof-loader.js',
  'pages/fof-pages/hcf-page-bootstrap.js',
  'pages/fof-pages/hcf-page-entry.js',
  'pages/fof-pages/hcf-page.js',
  'pages/fof-pages/install-dynamic-loader.html',
]) {
  const file = resolve(v2, rel);
  if (!existsSync(file)) {
    fail(`missing ${rel}`);
    continue;
  }
  const source = read(file);
  if (/\bv1\.x\//i.test(source)) fail(`${rel} still loads v1.x runtime content`);
  if (!source.includes('v2.x/') && rel !== 'pages/fof-pages/hcf-page.js') {
    fail(`${rel} does not contain a v2.x runtime target`);
  }
}

for (const name of ['header.html', 'footer.html']) {
  const file = resolve(v2, 'core', name);
  if (!existsSync(file)) {
    fail(`v2.x/core/${name} is missing`);
    continue;
  }
  const source = read(file);
  if (/<!doctype|<\/?(?:html|head|body)\b/i.test(source)) {
    fail(`v2.x/core/${name} must remain a body-only Flarum custom HTML fragment`);
  }
  if (/\bv1\.x\//i.test(source)) fail(`v2.x/core/${name} still loads v1.x assets`);
}

for (const file of walk(resolve(v2, 'pages/errors'))) {
  const source = read(file);
  if (/\bv1\.x\//i.test(source)) fail(`${repoPath(file)} still loads a v1.x asset`);
  if (/Flarum\s+1\.x/i.test(source)) fail(`${repoPath(file)} still labels itself Flarum 1.x`);
}

if (errors.length) {
  console.error(`Flarum 2.x validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Validated one-for-one HCF v1.x -> v2.x feature parity and self-contained Flarum 2.x runtime paths. Live Flarum 2.x smoke testing is still required before production.');
