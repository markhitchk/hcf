import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

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

  if (/https?:\/\/[^\s"')]+@main\//i.test(source)) fail(file, "mutable @main CDN URL");
  if (/raw\.githubusercontent\.com\/HarleyTG-O\/logo\/main/i.test(source)) fail(file, "legacy external logo URL");
  if (/HTG-Icon\.(?:svg|png)/i.test(source)) fail(file, "reference to retired empty logo asset");
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

const entryFile = resolve(repositoryRoot, "v1.x/core/htg.forum.css");
const entry = readFileSync(entryFile, "utf8");
for (const required of [
  '../add-ons/motion.css") screen and (max-width: 767.98px)',
  '../add-ons/header-panels.css") screen and (max-width: 767.98px)',
  '../add-ons/direct-messages.css") screen and (max-width: 767.98px)',
  '../add-ons/loading-screen.css") screen and (max-width: 767.98px)',
  '../add-ons/mobile.css") screen and (max-width: 767.98px)',
  './htg.desktop.css") screen and (min-width: 768px)',
]) {
  if (!entry.includes(required)) fail(entryFile, `missing Flarum breakpoint import: ${required}`);
}

const mobileFile = resolve(repositoryRoot, "v1.x/add-ons/mobile.css");
const mobile = readFileSync(mobileFile, "utf8");
for (const required of [
  ".Composer:not(.minimized) .App-backControl",
  ".Composer:not(.minimized) .App-titleControl",
  ".Composer:not(.minimized) .App-primaryControl",
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
if (/App-drawer[\s\S]{0,800}NotificationsDropdown[\s\S]{0,800}display:\s*none\s*!important/.test(panels)) {
  fail(panelFile, "mobile notification/flag sheets are forcibly hidden");
}

const headerFile = resolve(repositoryRoot, "v1.x/core/header.html");
const header = readFileSync(headerFile, "utf8");
for (const required of [
  "hcfMobileHeaderPanels",
  'compat["components/NotificationsDropdown"]',
  'override(prototype,"onclick"',
  "state.load();",
]) {
  if (!header.includes(required)) fail(headerFile, `missing mobile panel override: ${required}`);
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

const holidayFile = resolve(repositoryRoot, "v1.x/add-ons/seasonal/holidays.js");
const syntax = spawnSync(process.execPath, ["--check", holidayFile], { encoding: "utf8" });
if (syntax.status !== 0) fail(holidayFile, syntax.stderr.trim() || "JavaScript syntax check failed");

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${files.length} files for HCF and Flarum 1.x compatibility.`);
