import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function check(path, required = [], rejected = []) {
  const file = resolve(repositoryRoot, path);
  const source = readFileSync(file, "utf8");
  for (const [text, message] of required) {
    if (!source.includes(text)) errors.push(`${path}: ${message}`);
  }
  for (const [text, message] of rejected) {
    if (source.includes(text)) errors.push(`${path}: ${message}`);
  }
}

check("v1.x/pages/fof-pages/hcf-page.js", [
  ["300000", "FoF runtime safety interval must be 5 minutes"],
], [
  ["},30000);", "legacy 30-second FoF runtime interval remains"],
]);

check("v1.x/add-ons/mobile-auth-tip.js", [
  ['matchMedia("(max-width: 767.98px)")', "mobile auth observer is not breakpoint-scoped"],
  [".disconnect()", "mobile auth observer does not disconnect on desktop"],
]);

check("v1.x/pages/fof-pages/hcf-fof-loader.js", [
  ["hcfNoCache", "FoF loader cache bypass flag is missing"],
  ["cache: noCache ? 'no-store' : 'no-cache'", "FoF loader production revalidation mode is missing"],
  ["var CACHE_TTL = 60000", "FoF page cache TTL must be 60 seconds"],
  ["var MISSING_TTL = 30000", "FoF missing-page TTL must be 30 seconds"],
  ["var DIRECTORY_TTL = 300000", "FoF directory cache TTL must be 5 minutes"],
]);

check("v1.x/core/fragment-importer.js", [
  ["hcfNoCache", "fragment importer cache bypass flag is missing"],
  ["cache: noCache ? 'no-store' : 'no-cache'", "fragment importer cache policy is missing"],
]);

check("v1.x/core/header.html", [
  ["900000", "birthday fallback must be 15 minutes"],
  ["scheduleMidnightRefresh", "birthday midnight scheduler is missing"],
], [
  ["setInterval(showToday,30000)", "legacy 30-second birthday polling remains"],
]);

check("v1.x/core/footer.html", [
  ["60000", "footer identity fallback must be 60 seconds"],
  ["identityObserver", "footer identity observer is missing"],
  ["setInterval(updateClock,1000)", "visible one-second footer clock must remain"],
], [
  ["setInterval(refreshIdentity,15000)", "legacy 15-second identity polling remains"],
]);

if (errors.length) {
  console.error(`Optimization validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validated HCF optimization runtime contracts.");
