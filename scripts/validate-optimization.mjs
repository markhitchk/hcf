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
  ["high<start+(48*60*60*1000)", "birthday midnight search safety bound is missing"],
  ['id="hc-header-stack"', "header stack hook is missing"],
  ['id="forum-notice"', "forum notice hook is missing"],
  ['data-hc-slide="notice"', "notice slide hook is missing"],
  ['data-hc-slide="birthday"', "birthday slide hook is missing"],
  ['id="hc-birthday-header"', "birthday banner hook is missing"],
  ['id="hc-birthday-title"', "birthday title hook is missing"],
  ['id="hc-birthday-date"', "birthday date hook is missing"],
  ['id="hc-birthday-close"', "birthday close control hook is missing"],
  ['id="hc-birthday-header-particles"', "birthday particle hook is missing"],
], [
  ["setInterval(showToday,30000)", "legacy 30-second birthday polling remains"],
]);

check("v1.x/core/footer.html", [
  ["60000", "footer identity fallback must be 60 seconds"],
  ["identityObserver", "footer identity observer is missing"],
  ["if(!identityObserver){initIdentityObserver()}", "footer identity observer retry is missing"],
  ['window.addEventListener("hcf:core-fragment:loaded",queueIdentityRefresh)', "footer fragment-loaded identity refresh is missing"],
  ["setInterval(updateClock,1000)", "visible one-second footer clock must remain"],
  ['id="hc-simple-footer"', "footer root hook is missing"],
  ['id="hc-compatibility-notice"', "compatibility notice hook is missing"],
  ['id="hc-device-status"', "device status hook is missing"],
  ['id="hc-id"', "identity hook is missing"],
  ['id="hc-ip-spoiler"', "IP reveal control hook is missing"],
  ['id="hc-ip"', "IP value hook is missing"],
  ['id="hc-ip-status"', "IP status hook is missing"],
  ['id="hc-top-btn"', "return-to-top control hook is missing"],
  ['class="hc-feedback-float"', "feedback panel root hook is missing"],
  ["data-hc-footer-build", "footer build hook is missing"],
], [
  ["setInterval(refreshIdentity,15000)", "legacy 15-second identity polling remains"],
]);

if (errors.length) {
  console.error(`Optimization validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validated HCF optimization runtime and fragment contracts.");
