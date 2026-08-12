import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v1 = resolve(root, 'v1.x');
const v2 = resolve(root, 'v2.x');
const errors = [];

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

function checkRelativeImports(file) {
  const source = read(file);
  const pattern = /@import\s+url\(\s*["']?([^"')]+)["']?\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    if (!match[1].startsWith('.')) continue;
    const target = resolve(dirname(file), match[1].split(/[?#]/, 1)[0]);
    if (!existsSync(target)) fail(`${relative(root, file)}: missing import ${match[1]}`);
  }
}

if (!existsSync(v1)) fail('v1.x baseline is missing');
if (!existsSync(v2)) fail('v2.x compatibility tree is missing');

if (!errors.length) {
  const baseline = walk(v1);
  for (const source of baseline) {
    const rel = relative(v1, source);
    const target = resolve(v2, rel);
    if (!existsSync(target)) fail(`v2.x is missing baseline file: ${rel}`);
    else if (statSync(target).size === 0) fail(`v2.x contains empty file: ${rel}`);
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

for (const name of ['header.html', 'footer.html']) {
  const file = resolve(v2, 'core', name);
  if (!existsSync(file)) {
    fail(`v2.x/core/${name} is missing`);
    continue;
  }
  if (/<!doctype|<\/?(?:html|head|body)\b/i.test(read(file))) {
    fail(`v2.x/core/${name} must remain a body-only Flarum custom HTML fragment`);
  }
}

if (errors.length) {
  console.error(`Flarum 2.x validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Validated the complete HCF v2.x compatibility tree. Live Flarum 2.x smoke testing is still required before production.');
