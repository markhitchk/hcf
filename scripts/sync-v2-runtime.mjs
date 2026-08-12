import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v2 = resolve(root, 'v2.x');
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.less', '.md', '.php']);
const changed = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(v2)) {
  if (!statSync(file).isFile()) continue;

  const rel = relative(v2, file).replaceAll('\\', '/');

  // The root compatibility README intentionally compares v1.x and v2.x.
  if (rel === 'README.md') continue;
  if (!textExtensions.has(extname(file).toLowerCase())) continue;

  const source = readFileSync(file, 'utf8');
  let next = source
    .replaceAll('v1.x/', 'v2.x/')
    .replaceAll('Flarum 1.x', 'Flarum 2.x');

  if (next !== source) {
    writeFileSync(file, next, 'utf8');
    changed.push(rel);
  }
}

if (changed.length) {
  console.log(`Updated ${changed.length} v2.x file(s) to use self-contained v2.x runtime paths:`);
  for (const file of changed) console.log(`- ${file}`);
} else {
  console.log('v2.x runtime paths are already self-contained.');
}
