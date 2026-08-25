import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const approvedMainCdnPrefix = "https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/";

function fail(file, message) {
  errors.push(`${relative(repositoryRoot, file)}: ${message}`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function checkBalancedCss(file, source) {
  const pairs = { "{": "}", "(": ")", "[": "]" };
  const closing = new Set(Object.values(pairs));
  const stack = [];
  let quote = null;
  let escaped = false;
  let inComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (pairs[char]) stack.push(pairs[char]);
    else if (closing.has(char) && stack.pop() !== char) {
      fail(file, `unbalanced CSS near character ${index + 1}`);
      return;
    }
  }

  if (inComment || quote || stack.length) fail(file, "unclosed CSS token");
}

function checkRelativeImports(file, source) {
  const importPattern = /@import\s+url\(\s*["']?([^"')]+)["']?\s*\)/g;
  for (const match of source.matchAll(importPattern)) {
    const target = match[1];
    if (!target.startsWith(".")) continue;
    const path = resolve(dirname(file), target.split(/[?#]/, 1)[0]);
    if (!existsSync(path)) fail(file, `relative import does not exist: ${target}`);
  }
}

function checkFlarumPositioning(file, source) {
  const leafRule = /([^{}]+)\{([^{}]*)\}/g;
  const hostAtEnd = /(?:^|[\s>+~])\.(?:App-content|App-header|App-drawer|App-primaryControl|App-titleControl|App-backControl|Dropdown-menu)(?:\.[\w-]+)*\s*$/;

  for (const match of stripCssComments(source).matchAll(leafRule)) {
    const selectors = match[1].split(",").map((selector) => selector.trim());
    if (!selectors.some((selector) => hostAtEnd.test(selector))) continue;
    if (/(?:^|;)\s*(?:transform|filter)\s*:/m.test(match[2])) {
      fail(file, `transform/filter overrides a Flarum positioning host: ${selectors.join(", ")}`);
    }
  }
}

const files = walk(repositoryRoot);
for (const file of files) {
  if (statSync(file).size === 0) fail(file, "empty tracked file");

  const repositoryPath = relative(repositoryRoot, file);
  if (repositoryPath.startsWith("legacy/")) continue;

  const extension = extname(file);
  if (![".css", ".html", ".js", ".mjs", ".json", ".md", ".yml", ".yaml"].includes(extension)) continue;
  const source = readFileSync(file, "utf8");

  // HCF intentionally serves its own live runtime and shared assets from
  // @main. Continue rejecting mutable @main URLs from other repositories.
  const sourceWithoutApprovedMain = source.split(approvedMainCdnPrefix).join("");
  if (/https?:\/\/[^\s"')]+@main\//i.test(sourceWithoutApprovedMain)) {
    fail(file, "mutable external @main CDN URL");
  }

  if (/raw\.githubusercontent\.com\/HarleyTG-O\/logo\/main/i.test(source)) fail(file, "legacy external logo URL");
  if (/HTG-Icon\.(?:svg|png)/.test(source)) fail(file, "reference to retired empty logo asset");
  if (repositoryPath.startsWith("v1.x/") && /(?:v1\.x\/assets\/logos\/|(?:\.\.\/)+assets\/logos\/)(?:HTG\.svg|HTG\.png)/i.test(source)) {
    fail(file, "version-local HTG logo reference; use global assets/logos");
  }
  if (/body\s+when\s*\(/.test(source)) fail(file, "Less-only conditional in a CSS file");
  if (repositoryPath.startsWith("v1.x/") && /\b(?:console\.log|debugger)\b/.test(source)) {
    fail(file, "debug statement");
  }

  if (extension === ".css") {
    checkBalancedCss(file, source);
    checkRelativeImports(file, source);
    checkFlarumPositioning(file, source);
  }

  if (extension === ".html") {
    for (const match of source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (!match[1].trim()) continue;
      try {
        Function(match[1]);
      } catch (error) {
        fail(file, `invalid inline JavaScript: ${error.message}`);
      }
    }
    if (/<button(?![^>]*\btype=)[^>]*>/i.test(source)) {
      fail(file, "button without an explicit type attribute");
    }
  }

  if (extension === ".json") {
    try {
      JSON.parse(source);
    } catch (error) {
      fail(file, `invalid JSON: ${error.message}`);
    }
  }
}

for (const name of ["header.html", "footer.html"]) {
  const file = resolve(repositoryRoot, "v1.x/core", name);
  const source = readFileSync(file, "utf8");
  if (/<!doctype|<\/?(?:html|head|body)\b/i.test(source)) {
    fail(file, "must remain a body-only Flarum custom HTML fragment");
  }
}

// Shared branding belongs only at repository level. Version folders must
// reference these canonical files instead of maintaining duplicate copies.
for (const name of ["HTG.svg", "htg-icon.png", "htg-neon.png"]) {
  const file = resolve(repositoryRoot, "assets/logos", name);
  if (!existsSync(file)) fail(file, "required global logo asset is missing");
}
if (existsSync(resolve(repositoryRoot, "v1.x/assets/logos"))) {
  errors.push("v1.x/assets/logos: duplicate version-local logo directory must not exist");
}

const entryFile = resolve(repositoryRoot, "v1.x/core/htg.forum.css");
const entry = readFileSync(entryFile, "utf8");
for (const required of [
  '../add-ons/cookie-consent.css")',
  '../add-ons/motion.css") screen and (max-width: 767.98px)',
  '../add-ons/header-panels.css") screen and (max-width: 767.98px)',
  '../add-ons/direct-messages.css") screen and (max-width: 767.98px)',
  '../add-ons/loading-screen.css") screen and (max-width: 767.98px)',
  '../add-ons/mobile.css") screen and (max-width: 767.98px)',
  '../add-ons/mobile-auth-tooltip.css") screen and (max-width: 767.98px)',
  './htg.desktop.css") screen and (min-width: 768px)',
  '../add-ons/desktop-header-alerts.css") screen and (min-width: 768px)',
  '../add-ons/compact-laptop.css") screen and (min-width: 768px) and (max-width: 1366px) and (max-height: 760px)',
  '../add-ons/day-night-compat.css")',
]) {
  if (!entry.includes(required)) fail(entryFile, `missing Flarum breakpoint import: ${required}`);
}

const mobileFile = resolve(repositoryRoot, "v1.x/add-ons/mobile.css");
const mobile = readFileSync(mobileFile, "utf8");
for (const required of [
  ".AlertManager-alert",
  ".AlertManager .Alert",
  ".Settings-notifications > ul > li > .Alert",
  ".Alert-controls .Button--link",
  ".Alert-dismiss",
  "bottom: calc(76px + var(--hc-mobile-safe-bottom)) !important",
  ".Composer-controls > .App-backControl",
  ".Composer.normal:not(.minimized)",
  ".ComposerBody-header > li:first-child",
  "> .item-submit.App-primaryControl",
  ".ComposerPageContainer h2.App-titleControl",
  ".App:has(.ComposerPageContainer) .App-navigation",
  "height: var(--header-height-phone, 46px) !important",
  ".ComposerPage",
  ".TextEditor-controls .item-submit",
  "position: fixed !important",
  "top: var(--hc-banner-height, 0px) !important",
  ".NotificationList-header .App-primaryControl",
  "position: static !important",
  "min-height: 52px !important",
  "padding-left: 60px !important",
  "padding-right: 50px !important",
  ".DraftsPage",
]) {
  if (!mobile.includes(required)) fail(mobileFile, `missing mobile compatibility rule: ${required}`);
}
if (/html body \.App \.Dropdown-menu\s*,\s*html body \.App \.Search-results/.test(mobile)) {
  fail(mobileFile, "global phone dropdown width override replaces Flarum sheet geometry");
}

const panelFile = resolve(repositoryRoot, "v1.x/add-ons/header-panels.css");
const panels = readFileSync(panelFile, "utf8");
if (!panels.includes(".DraftsDropdown")) {
  fail(panelFile, "FoF Drafts is missing from shared header panels");
}
if (!/App-drawer[\s\S]{0,800}NotificationsDropdown[\s\S]{0,800}display:\s*none\s*!important/.test(panels)) {
  fail(panelFile, "transient mobile dropdown is not hidden before route navigation");
}

const headerFile = resolve(repositoryRoot, "v1.x/core/header.html");
const header = readFileSync(headerFile, "utf8");
if (header.includes("hcfMobileHeaderPanels")) {
  fail(headerFile, "mobile header override disables Flarum's native route navigation");
}

const motionFile = resolve(repositoryRoot, "v1.x/add-ons/motion.css");
if (/@import\b/.test(readFileSync(motionFile, "utf8"))) {
  fail(motionFile, "motion layer must not import an external animation bundle");
}

const loaderFile = resolve(repositoryRoot, "v1.x/add-ons/loading-screen.css");
const loader = readFileSync(loaderFile, "utf8");
if (!/@keyframes\s+hc-loader-progress/.test(loader) || !/100%\s*\{\s*background-size:\s*96%/s.test(loader)) {
  fail(loaderFile, "staged loading progress animation is missing");
}

// P3: optional live fragment importer must preserve the canonical body-only sources.
const fragmentImporterFile = resolve(repositoryRoot, "v1.x/core/fragment-importer.js");
const fragmentImporter = readFileSync(fragmentImporterFile, "utf8");
for (const required of [
  "data-hcf-fragment",
  "https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/",
  "kind + '.html'",
  "template.content.cloneNode(true)",
  "scripts.reduce",
  "console.warn",
]) {
  if (!fragmentImporter.includes(required)) fail(fragmentImporterFile, `missing guarded fragment importer behavior: ${required}`);
}
const fragmentImporterSyntax = spawnSync(process.execPath, ["--check", fragmentImporterFile], { encoding: "utf8" });
if (fragmentImporterSyntax.status !== 0) {
  fail(fragmentImporterFile, fragmentImporterSyntax.stderr.trim() || "JavaScript syntax check failed");
}

// P3: error shells share one stylesheet; loader JS must not carry a duplicate CSS bundle.
const errorCssFile = resolve(repositoryRoot, "v1.x/pages/errors/error.css");
const errorCss = readFileSync(errorCssFile, "utf8");
if (!errorCss.includes("--hc: #00b8f0")) fail(errorCssFile, "primary HCF cyan token is missing");
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(errorCss) || !/animation:\s*none\s*!important/.test(errorCss)) {
  fail(errorCssFile, "reduced-motion error-page fallback is missing");
}
for (const name of ["403.html", "404.html", "500.html", "503.html", "error.html"]) {
  const file = resolve(repositoryRoot, "v1.x/pages/errors", name);
  const source = readFileSync(file, "utf8");
  if (!source.includes("v1.x/pages/errors/error.css")) fail(file, "shared error.css is not loaded");
  if (/<style\b/i.test(source)) fail(file, "duplicate inline error-page CSS remains");
}
const errorLoaderFile = resolve(repositoryRoot, "v1.x/pages/errors/error-loader.js");
const errorLoader = readFileSync(errorLoaderFile, "utf8");
if (/hcf-error-style|createElement\(['\"]style['\"]\)/.test(errorLoader)) {
  fail(errorLoaderFile, "error loader still injects the extracted stylesheet");
}

// P3: preserve reduced-motion behavior in both Flarum phone motion and FoF runtime motion.
const motionSource = readFileSync(motionFile, "utf8");
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(motionSource) || !/transition-duration:\s*1ms\s*!important/.test(motionSource)) {
  fail(motionFile, "reduced-motion Flarum transition safeguard is missing");
}
if (!/Button:not\(\.Dropdown-toggle\):not\(:disabled\):active[\s\S]{0,120}transform:\s*none\s*!important/.test(motionSource)) {
  fail(motionFile, "reduced-motion touch transform reset is missing");
}
const fofRuntimeMotionFile = resolve(repositoryRoot, "v1.x/pages/fof-pages/hcf-page-runtime.css");
const fofRuntimeMotion = readFileSync(fofRuntimeMotionFile, "utf8");
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(fofRuntimeMotion) || !/transition:\s*none\s*!important/.test(fofRuntimeMotion)) {
  fail(fofRuntimeMotionFile, "FoF runtime reduced-motion coverage is missing");
}

const holidayFile = resolve(repositoryRoot, "v1.x/add-ons/seasonal/holidays.js");
const syntax = spawnSync(process.execPath, ["--check", holidayFile], { encoding: "utf8" });
if (syntax.status !== 0) fail(holidayFile, syntax.stderr.trim() || "JavaScript syntax check failed");

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${files.length} files for HCF and Flarum 1.x compatibility.`);
