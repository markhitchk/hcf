import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkedExtensions = new Set([".css", ".js", ".html", ".mjs", ".json", ".md", ".yml", ".yaml"]);
const failures = [];
const checked = [];

const sharedLogoNames = ["HTG.svg", "htg-icon.png", "htg-neon.png"];
const canonicalLogoBase = "https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/";
const versionAssetsRoot = resolve(repositoryRoot, "v1.x/assets");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function fail(file, message) {
  failures.push(`${relative(repositoryRoot, file)}: ${message}`);
}

function isInside(path, parent) {
  const child = resolve(path);
  const root = resolve(parent);
  return child === root || child.startsWith(`${root}/`) || child.startsWith(`${root}\\`);
}

function stripQueryAndHash(value) {
  return value.split(/[?#]/, 1)[0];
}

function checkRelativeAssetReferences(file, source) {
  const pattern = /(?:\.\.\/|\.\/)+assets\/[A-Za-z0-9_.\-/%]+/g;
  for (const match of source.matchAll(pattern)) {
    const reference = stripQueryAndHash(match[0]);
    const resolved = resolve(dirname(file), reference);
    if (isInside(resolved, versionAssetsRoot)) {
      fail(file, `relative asset path resolves into removed v1.x/assets: ${match[0]}`);
    }
  }
}

function checkHcfCdnRefs(file, source) {
  const pattern = /https:\/\/cdn\.jsdelivr\.net\/gh\/markhitchk\/hcf@([^/\s"')]+)\/([^\s"')]+)/g;
  for (const match of source.matchAll(pattern)) {
    const ref = match[1];
    if (ref === "main") continue;
    fail(file, `non-main HCF jsDelivr ref @${ref}; use @main: ${match[0]}`);
  }
}

for (const file of walk(repositoryRoot)) {
  const extension = extname(file).toLowerCase();
  if (!checkedExtensions.has(extension)) continue;

  checked.push(file);
  const source = readFileSync(file, "utf8");

  if (/v1\.x\/assets\//i.test(source)) {
    fail(file, "hard-coded v1.x/assets reference; shared assets belong under repository-level assets/");
  }

  if (/raw\.githubusercontent\.com\/HarleyTG-O\/logo\/main/i.test(source)) {
    fail(file, "legacy HarleyTG-O logo URL; use the global HCF assets");
  }

  // The retired asset used an uppercase H and I: HTG-Icon.*.
  // The canonical replacement htg-icon.png is intentionally lowercase.
  if (/HTG-Icon\.(?:svg|png)/.test(source)) {
    fail(file, "retired HTG-Icon asset reference");
  }

  if (/(?:^|[/'"(])Assets\/(?:Logo|Logos|logos)\//.test(source) || /(?:^|[/'"(])assets\/(?:Logo|Logos|logo)\//.test(source)) {
    fail(file, "non-canonical asset folder casing; use assets/logos/");
  }

  if (/raw\.githubusercontent\.com\/markhitchk\/hcf\/[^\s"')]+\/assets\/logos\/(?:HTG\.svg|htg-icon\.png|htg-neon\.png)/i.test(source)) {
    fail(file, "raw GitHub shared-logo URL; use the canonical jsDelivr global asset URL");
  }

  checkRelativeAssetReferences(file, source);
  checkHcfCdnRefs(file, source);
}

for (const name of sharedLogoNames) {
  const file = resolve(repositoryRoot, "assets/logos", name);
  if (!existsSync(file)) failures.push(`assets/logos/${name}: required global HTG asset is missing`);
}

if (existsSync(resolve(repositoryRoot, "v1.x/assets"))) {
  failures.push("v1.x/assets: version-local asset directory must not exist; use repository-level assets/");
}

if (failures.length) {
  console.error(`Global asset validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${checked.length} repo text files against the global HCF CDN and HTG asset policy.`);
