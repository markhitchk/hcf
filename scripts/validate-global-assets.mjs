import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeExtensions = new Set([".css", ".js", ".html"]);
const checkedExtensions = new Set([".css", ".js", ".html", ".mjs", ".json", ".md", ".yml", ".yaml"]);
const failures = [];
const checked = [];

const sharedLogoNames = ["HTG.svg", "htg-icon.png", "htg-neon.png"];
// Keep the original HCF artwork byte-for-byte. These limits are sanity caps,
// not optimization targets; replacing the artwork to satisfy smaller caps is prohibited.
const sharedLogoMaxBytes = new Map([
  ["HTG.svg", 4 * 1024 * 1024],
  ["htg-icon.png", 700 * 1024],
  ["htg-neon.png", 1100 * 1024],
]);
const canonicalLogoBase = "https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/";
const canonicalHcfMark = `${canonicalLogoBase}HTG.svg`;
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

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
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
  const isRuntimeFile = runtimeExtensions.has(extension);

  if (isRuntimeFile && /v1\.x\/assets\//i.test(source)) {
    fail(file, "hard-coded v1.x/assets reference; shared assets belong under repository-level assets/");
  }

  if (/raw\.githubusercontent\.com\/HarleyTG-O\/logo\/main/i.test(source)) {
    fail(file, "legacy HarleyTG-O logo URL; use the global HCF assets");
  }

  // The retired asset used an uppercase H and I: HTG-Icon.*.
  // The canonical replacement htg-icon.png is intentionally lowercase.
  if (isRuntimeFile && /HTG-Icon\.(?:svg|png)/.test(source)) {
    fail(file, "retired HTG-Icon asset reference");
  }

  if (isRuntimeFile && (/(?:^|[/'"(])Assets\/(?:Logo|Logos|logos)\//.test(source) || /(?:^|[/'"(])assets\/(?:Logo|Logos|logo)\//.test(source))) {
    fail(file, "non-canonical asset folder casing; use assets/logos/");
  }

  if (/raw\.githubusercontent\.com\/markhitchk\/hcf\/[^\s"')]+\/assets\/logos\/(?:HTG\.svg|htg-icon\.png|htg-neon\.png)/i.test(source)) {
    fail(file, "raw GitHub shared-logo URL; use the canonical jsDelivr global asset URL");
  }

  if (isRuntimeFile) checkRelativeAssetReferences(file, source);
  checkHcfCdnRefs(file, source);
}

for (const name of sharedLogoNames) {
  const file = resolve(repositoryRoot, "assets/logos", name);
  if (!existsSync(file)) {
    failures.push(`assets/logos/${name}: required global HTG asset is missing`);
    continue;
  }
  const maxBytes = sharedLogoMaxBytes.get(name);
  const size = statSync(file).size;
  if (maxBytes && size > maxBytes) {
    fail(file, `shared logo is ${size} bytes; maximum is ${maxBytes} bytes`);
  }
}

if (existsSync(resolve(repositoryRoot, "v1.x/assets"))) {
  failures.push("v1.x/assets: version-local asset directory must not exist; use repository-level assets/");
}

// The main forum loader, FoF/error loaders, and Discord feedback share the
// canonical HTG.svg mark. Alternative shared assets may remain available for
// designs that explicitly need them, but these core identity surfaces must not
// silently drift to an app icon, neon fallback, or external repository asset.
const loaderFile = resolve(repositoryRoot, "v1.x/add-ons/loading-screen.css");
const loaderSource = readFileSync(loaderFile, "utf8");
if (!loaderSource.includes(canonicalHcfMark)) {
  fail(loaderFile, "main Flarum loading screen must use the canonical assets/logos/HTG.svg mark");
}
if (/assets\/logos\/htg-neon\.png/i.test(loaderSource)) {
  fail(loaderFile, "stale neon logo remains in the main Flarum loading screen");
}

const footerFile = resolve(repositoryRoot, "v1.x/core/footer.html");
const footerSource = readFileSync(footerFile, "utf8");
const escapedCanonicalMark = canonicalHcfMark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const feedbackLogoPattern = new RegExp(
  `class=["']hc-feedback-logo["'][\\s\\S]{0,240}src=["']${escapedCanonicalMark}["']`,
  "i",
);
if (!feedbackLogoPattern.test(footerSource)) {
  fail(footerFile, "Discord feedback must use the canonical assets/logos/HTG.svg mark");
}

// Preserve Flarum 1.x's native affix architecture. The custom notice must
// remain in normal flow so Flarum's scroll listener can measure #app and own
// the absolute -> fixed transition without a second sticky/fixed offset layer.
const headerStackFile = resolve(repositoryRoot, "v1.x/add-ons/header-stack-fix.css");
const headerStackSource = stripCssComments(readFileSync(headerStackFile, "utf8"));
if (/html\s+body\s+#hc-header-stack\s*\{[^}]*\bposition\s*:\s*(?:sticky|fixed)\b/is.test(headerStackSource)) {
  fail(headerStackFile, "custom notice must stay in normal document flow; sticky/fixed positioning breaks Flarum affix geometry");
}
if (/\.(?:App-header|App-navigation|App-primaryControl|App-titleControl|App-backControl)[^{]*\{[^}]*\btop\s*:/is.test(headerStackSource)) {
  fail(headerStackFile, "do not apply HCF top offsets to Flarum-owned navigation controls");
}

if (failures.length) {
  console.error(`Global asset validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${checked.length} repo text files against the global HCF CDN, HTG identity, and native Flarum affix policy.`);
