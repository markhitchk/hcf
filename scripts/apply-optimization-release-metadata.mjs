import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function patch(path, replacements) {
  const file = resolve(repositoryRoot, path);
  let source = readFileSync(file, "utf8");

  for (const [before, after, label] of replacements) {
    if (source.includes(after)) continue;
    const count = source.split(before).length - 1;
    if (count !== 1) throw new Error(`${path}: expected one ${label} target, found ${count}`);
    source = source.replace(before, after);
  }

  writeFileSync(file, source);
}

patch("v1.x/pages/fof-pages/hcf-page.js", [
  ["Runtime Version: 1.4.1", "Runtime Version: 1.4.2", "runtime version comment"],
  ["Updated: 2026-08-25", "Updated: 2026-09-16", "updated date"],
  ['version:"1.4.1"', 'version:"1.4.2"', "public runtime version"],
]);

patch("v1.x/add-ons/mobile-auth-tip.js", [
  ["Version: 1.0", "Version: 1.1", "mobile auth version"],
  ["Updated: 2026-08-11", "Updated: 2026-09-16", "updated date"],
]);

patch("v1.x/pages/fof-pages/hcf-fof-loader.js", [
  ["Build: 1.1.1", "Build: 1.1.2", "loader build comment"],
  ["Updated: 2026-08-25", "Updated: 2026-09-16", "updated date"],
  ["var BUILD = '1.1.1';", "var BUILD = '1.1.2';", "loader build constant"],
  ["hcf-page.js?v=1.4.1", "hcf-page.js?v=1.4.2", "shared runtime URL"],
]);

patch("v1.x/core/fragment-importer.js", [
  ["Version: 1.0", "Version: 1.1", "fragment importer version"],
  ["Updated: 2026-08-25", "Updated: 2026-09-16", "updated date"],
]);

patch("v1.x/core/footer.html", [
  ["HARLEY'S CLAN FORUM FOOTER v4.4.8", "HARLEY'S CLAN FORUM FOOTER v4.4.9", "footer version"],
  ["Updated: 2026-08-30", "Updated: 2026-09-16", "footer updated date"],
  ['data-hc-footer-build="4.4.8"', 'data-hc-footer-build="4.4.9"', "footer build attribute"],
]);

patch("README.md", [
  [
`scripts/
├── validate.mjs
└── validate-global-assets.mjs`,
`scripts/
├── audit-css.mjs
├── validate-global-assets.mjs
├── validate-optimization.mjs
└── validate.mjs`,
    "script tree"
  ],
  [
`The importer resolves relative assets against the source fragment, inserts markup and embedded styles before executing scripts, then runs scripts sequentially. If a later embedded script fails, the already-inserted header or footer remains in place.

## Seasonal content and error pages`,
`The importer resolves relative assets against the source fragment, inserts markup and embedded styles before executing scripts, then runs scripts sequentially. If a later embedded script fails, the already-inserted header or footer remains in place.

### Runtime cache behavior

HCF production remote content uses cache revalidation. Add \`hcfNoCache=1\` to the current page URL only when diagnosing CDN/cache behavior; this forces HCF-managed remote fetches to bypass cache for that page load. Do not use the bypass for normal browsing.

## Seasonal content and error pages`,
    "runtime cache documentation"
  ],
  [
`\`\`\`sh
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
\`\`\``,
`\`\`\`sh
node scripts/audit-css.mjs
node scripts/validate-global-assets.mjs
node scripts/validate.mjs
node scripts/validate-optimization.mjs
\`\`\``,
    "validation commands"
  ],
]);

patch("docs/superpowers/specs/2026-09-16-hcf-css-js-html-optimization-design.md", [
  ["**Status:** Approved design, implementation not started", "**Status:** Implemented on optimization branch; pending review and merge", "design status"],
]);
