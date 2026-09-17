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

if (errors.length) {
  console.error(`Optimization validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validated HCF optimization runtime contracts.");
