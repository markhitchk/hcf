# HCF CSS, JavaScript, and HTML Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce HCF v1.x idle runtime work, repeated network body transfers, and safe CSS/HTML source overhead without changing visible behavior or breaking Flarum 1.x/FoF compatibility.

**Architecture:** Keep the existing `v1.x/` public entry points, selectors, globals, events, body-only fragments, and Flarum-owned navigation model. Apply optimization in independently revertible layers: strengthen validators first, make only provably safe CSS cleanup, then reduce timer/observer work, then enable cache revalidation with an explicit `hcfNoCache=1` bypass, and finally clean fragment internals without changing their public DOM contracts.

**Tech Stack:** Flarum 1.x custom CSS/HTML, browser JavaScript (ES2017-compatible syntax already used by the repo), FriendsOfFlarum Pages/Upload/Drafts/Cookie Consent/Night Mode integrations, jsDelivr, Node.js 22 dependency-free validation scripts, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-16-hcf-css-js-html-optimization-design.md`

## Global Constraints

- Production scope is `v1.x/`; do not migrate production to `v2.x/`.
- `v1.x/core/htg.forum.css` remains the canonical Flarum-facing stylesheet entry point.
- Phone breakpoint remains `max-width: 767.98px`; desktop/tablet-up remains `min-width: 768px`.
- Existing CSS import order is authoritative.
- Do not simplify compatibility specificity or remove `!important` without proven computed-style equivalence.
- Flarum retains ownership of native phone header, navigation, drawer, backdrop, composer, and affix positioning.
- Preserve the September 16, 2026 FoF Upload phone image-preview fix.
- Preserve `window.HCFPageRuntime`, `window.HCFDomainRouter`, `window.HCFFoFPagesLoader`, `window.HCBirthday`, and `window.HCFCoreFragmentImports`.
- Preserve `hcf:fof-page:loaded`, `hcf:core-fragment:loaded`, and `hc-banners-changed`.
- `header.html` and `footer.html` must remain body-only fragments.
- Keep the visible footer clock at one-second cadence if it displays seconds.
- FoF runtime safety fallback becomes 300000 ms (5 minutes) while visible.
- Footer identity fallback becomes 60000 ms (60 seconds) while visible.
- Birthday fallback becomes 900000 ms (15 minutes) while visible, plus startup, visibility-return, and next-America/Los_Angeles-midnight refresh.
- Production HCF remote fetches use `cache: "no-cache"`; `hcfNoCache=1` switches them to `cache: "no-store"` and timestamp cache busting.
- FoF page cache TTL becomes 60000 ms; missing-page TTL becomes 30000 ms; directory-discovery TTL becomes 300000 ms.
- Run `node scripts/validate-global-assets.mjs` and `node scripts/validate.mjs` before every commit.
- Keep each implementation commit independently revertible.

---

### Task 1: Lock the compatibility contracts in the validator

**Files:**
- Modify: `scripts/validate.mjs`
- Test: `scripts/validate.mjs` itself, run with Node.js 22

**Interfaces:**
- Consumes: current HCF production paths and public runtime names.
- Produces: validator assertions that later tasks must satisfy; no runtime behavior changes.

- [ ] **Step 1: Add current-contract assertions that pass before runtime optimization**

Add a small reusable helper near the existing file-specific assertions:

```js
function requireText(file, source, text, message) {
  if (!source.includes(text)) fail(file, message);
}

function rejectText(file, source, text, message) {
  if (source.includes(text)) fail(file, message);
}
```

Then lock the existing public globals/events without yet asserting the new intervals/cache policy:

```js
const fofPageRuntimeFile = resolve(repositoryRoot, "v1.x/pages/fof-pages/hcf-page.js");
const fofPageRuntime = readFileSync(fofPageRuntimeFile, "utf8");
requireText(fofPageRuntimeFile, fofPageRuntime, "window.HCFPageRuntime", "HCFPageRuntime public global is missing");
requireText(fofPageRuntimeFile, fofPageRuntime, '"hcf:fof-page:loaded"', "FoF page-loaded event listener is missing");

const fofLoaderFile = resolve(repositoryRoot, "v1.x/pages/fof-pages/hcf-fof-loader.js");
const fofLoader = readFileSync(fofLoaderFile, "utf8");
requireText(fofLoaderFile, fofLoader, "window.HCFFoFPagesLoader", "HCFFoFPagesLoader public global is missing");
requireText(fofLoaderFile, fofLoader, "hcf:fof-page:loaded", "FoF loader event contract is missing");

const domainRouterFile = resolve(repositoryRoot, "v1.x/pages/fof-pages/hcf-domain-router.js");
const domainRouter = readFileSync(domainRouterFile, "utf8");
requireText(domainRouterFile, domainRouter, "window.HCFDomainRouter", "HCFDomainRouter public global is missing");

requireText(headerFile, header, "window.HCBirthday", "HCBirthday public global is missing");
requireText(headerFile, header, "hc-banners-changed", "header banner-change event is missing");
requireText(fragmentImporterFile, fragmentImporter, "window.HCFCoreFragmentImports", "fragment import registry is missing");
requireText(fragmentImporterFile, fragmentImporter, "hcf:core-fragment:loaded", "fragment-loaded event is missing");
```

- [ ] **Step 2: Run validator to verify the new compatibility assertions pass**

Run:

```sh
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: both commands exit `0`.

- [ ] **Step 3: Add syntax checks for standalone runtime files touched by this project**

Extend the existing `spawnSync(process.execPath, ["--check", file])` pattern to:

```js
for (const file of [
  fofPageRuntimeFile,
  fofLoaderFile,
  domainRouterFile,
  resolve(repositoryRoot, "v1.x/add-ons/mobile-auth-tip.js"),
  fragmentImporterFile,
]) {
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) fail(file, check.stderr.trim() || "JavaScript syntax check failed");
}
```

Do not attempt `node --check` on `header.html` or `footer.html`; the existing inline-script parser already validates those.

- [ ] **Step 4: Re-run both validators**

Expected: exit `0` with no new output other than the repository's normal success output.

- [ ] **Step 5: Commit**

```sh
git add scripts/validate.mjs
git commit -m "test: lock HCF optimization compatibility contracts"
```

---

### Task 2: Add deterministic CSS duplicate auditing and perform only exact-safe cleanup

**Files:**
- Create: `scripts/audit-css.mjs`
- Modify only when reported as exact-safe: `v1.x/core/htg.forum.css`, `v1.x/core/htg.desktop.css`, `v1.x/add-ons/mobile.css`, and other `v1.x/**/*.css` files reported by the audit
- Modify: `scripts/validate.mjs`
- Test: `scripts/audit-css.mjs`, `scripts/validate.mjs`

**Interfaces:**
- Consumes: readable CSS source and existing cascade order.
- Produces: a deterministic report of exact repeated `property:value` declarations inside the same leaf rule; it must not classify fallback pairs such as `overflow-x:hidden` followed by `overflow-x:clip` as duplicates.

- [ ] **Step 1: Create the CSS audit script**

Implement `scripts/audit-css.mjs` with no dependencies. It must:

1. recursively scan `v1.x/**/*.css`;
2. strip comments only for parsing;
3. inspect leaf rules that contain no nested `{}`;
4. split declarations on semicolons outside parentheses/quotes;
5. normalize whitespace around property/value boundaries;
6. report only an identical repeated normalized `property:value` within the same rule;
7. ignore custom-property definitions only when their full `--name:value` pair is not repeated;
8. never call two different values of the same property a duplicate.

The report format must be stable:

```text
v1.x/add-ons/example.css :: .selector :: property:value
```

Exit `0` when there are no exact repeats, exit `1` when exact repeats are found.

- [ ] **Step 2: Run the audit before changing CSS**

Run:

```sh
node scripts/audit-css.mjs
```

Expected: either exit `0`, or exit `1` with only exact repeated declaration reports. Manually verify that intentional fallback pairs with different values are absent from the report.

- [ ] **Step 3: Remove only exact repeats reported by the script**

For every report, delete only the later identical declaration inside that same leaf rule. Do **not**:

- merge selectors across separate rule positions;
- reorder rules;
- change selector specificity;
- remove `!important`;
- collapse `overflow-x:hidden` + `overflow-x:clip` or any other different-value fallback pair;
- touch the FoF Upload phone rules unless the audit identifies a byte-for-byte repeated declaration inside the same rule.

If the audit reports no exact repeats, make no CSS source edit in this task; the audit itself becomes the guard against unsafe speculative cleanup.

- [ ] **Step 4: Lock the audit into validation**

At the end of `scripts/validate.mjs`, invoke:

```js
const cssAudit = spawnSync(process.execPath, [resolve(repositoryRoot, "scripts/audit-css.mjs")], { encoding: "utf8" });
if (cssAudit.status !== 0) {
  errors.push(cssAudit.stdout.trim() || cssAudit.stderr.trim() || "CSS exact-duplicate audit failed");
}
```

- [ ] **Step 5: Run validation**

```sh
node scripts/audit-css.mjs
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: all exit `0`.

- [ ] **Step 6: Commit**

```sh
git add scripts/audit-css.mjs scripts/validate.mjs v1.x
git commit -m "perf: add safe CSS duplicate audit"
```

---

### Task 3: Reduce FoF runtime polling and scope the mobile-auth observer to phones

**Files:**
- Modify: `v1.x/pages/fof-pages/hcf-page.js`
- Modify: `v1.x/add-ons/mobile-auth-tip.js`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: `HCFPageRuntime.refresh()`, `hcf:fof-page:loaded`, Flarum dynamic login/signup modals.
- Produces: same public runtime API, 5-minute visible-tab FoF safety fallback, phone-only mobile-auth MutationObserver lifecycle.

- [ ] **Step 1: Add failing validator assertions for the new runtime cadence**

Add:

```js
requireText(fofPageRuntimeFile, fofPageRuntime, "300000", "FoF runtime safety interval must be 5 minutes");
rejectText(fofPageRuntimeFile, fofPageRuntime, "},30000);", "legacy 30-second FoF runtime interval remains");

const mobileAuthFile = resolve(repositoryRoot, "v1.x/add-ons/mobile-auth-tip.js");
const mobileAuth = readFileSync(mobileAuthFile, "utf8");
requireText(mobileAuthFile, mobileAuth, 'matchMedia("(max-width: 767.98px)")', "mobile auth observer is not breakpoint-scoped");
requireText(mobileAuthFile, mobileAuth, ".disconnect()", "mobile auth observer does not disconnect on desktop");
```

Run `node scripts/validate.mjs`.

Expected: FAIL because production code has not been changed yet.

- [ ] **Step 2: Change FoF fallback interval from 30 seconds to 5 minutes**

In `hcf-page.js`, replace the literal interval with a named constant near `resizeTimer`:

```js
var SAFETY_REFRESH_MS = 300000;
```

Then:

```js
window.setInterval(function(){
  if(!document.hidden)refresh();
},SAFETY_REFRESH_MS);
```

Do not change startup, resize, visibility-return, or `hcf:fof-page:loaded` behavior.

- [ ] **Step 3: Refactor mobile-auth observer lifecycle around `matchMedia`**

Keep `scan`, `enhanceHeader`, sessionStorage behavior, and fallback CSS unchanged. Replace the always-on observer startup with:

```js
var phoneQuery = window.matchMedia("(max-width: 767.98px)");
var observer = null;

function connectObserver() {
  if (observer || !phoneQuery.matches) return;
  scan(document.documentElement);
  observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        scan(node);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function disconnectObserver() {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

function syncObserver() {
  if (phoneQuery.matches) connectObserver();
  else disconnectObserver();
}
```

In `start()`, call `installStyles(); syncObserver();` and register breakpoint changes with modern and legacy APIs:

```js
if (phoneQuery.addEventListener) phoneQuery.addEventListener("change", syncObserver);
else if (phoneQuery.addListener) phoneQuery.addListener(syncObserver);
```

- [ ] **Step 4: Run syntax and repository validation**

```sh
node --check v1.x/pages/fof-pages/hcf-page.js
node --check v1.x/add-ons/mobile-auth-tip.js
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: all pass.

- [ ] **Step 5: Manual smoke test this task**

Verify:

1. phone viewport: login and signup modals receive the `?`/`×` control;
2. resize to desktop: observer disconnects and no new mobile toggle is injected;
3. resize back to phone: existing/new auth modal headers are scanned once and work;
4. FoF pages still refresh immediately after `hcf:fof-page:loaded`;
5. no visible behavior waits for the five-minute safety interval.

- [ ] **Step 6: Commit**

```sh
git add v1.x/pages/fof-pages/hcf-page.js v1.x/add-ons/mobile-auth-tip.js scripts/validate.mjs
git commit -m "perf: reduce HCF idle runtime polling"
```

---

### Task 4: Enable cache revalidation with `hcfNoCache=1` diagnostic bypass

**Files:**
- Modify: `v1.x/pages/fof-pages/hcf-fof-loader.js`
- Modify: `v1.x/core/fragment-importer.js`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: current jsDelivr/GitHub URLs, `data-hcf-fragment`, FoF direct lookup and directory fallback.
- Produces: production `cache: "no-cache"`; explicit `hcfNoCache=1` `no-store` + timestamp behavior; unchanged public loader/fragment events.

- [ ] **Step 1: Add failing cache-policy assertions**

Add validator checks:

```js
requireText(fofLoaderFile, fofLoader, "hcfNoCache", "FoF loader cache bypass flag is missing");
requireText(fofLoaderFile, fofLoader, "cache: 'no-cache'", "FoF loader production revalidation mode is missing");
requireText(fragmentImporterFile, fragmentImporter, "hcfNoCache", "fragment importer cache bypass flag is missing");
requireText(fragmentImporterFile, fragmentImporter, "cache: noCache ? 'no-store' : 'no-cache'", "fragment importer cache policy is missing");
```

Also assert the new TTL literals in the loader:

```js
requireText(fofLoaderFile, fofLoader, "var CACHE_TTL = 60000", "FoF page cache TTL must be 60 seconds");
requireText(fofLoaderFile, fofLoader, "var MISSING_TTL = 30000", "FoF missing-page TTL must be 30 seconds");
requireText(fofLoaderFile, fofLoader, "var DIRECTORY_TTL = 300000", "FoF directory TTL must be 5 minutes");
```

Run validator; expect FAIL.

- [ ] **Step 2: Add one cache-bypass helper to the FoF loader**

Near `now()` add:

```js
function noCacheRequested() {
  try {
    return new URLSearchParams(location.search).get('hcfNoCache') === '1';
  } catch (error) {
    return false;
  }
}

function requestUrl(url) {
  if (!noCacheRequested()) return url;
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + now();
}
```

Change constants exactly to:

```js
var CACHE_TTL = 60000;
var MISSING_TTL = 30000;
var DIRECTORY_TTL = 300000;
```

- [ ] **Step 3: Apply the policy to FoF HTML and directory fetches**

Change `makeFetchOptions(controller)` to:

```js
function makeFetchOptions(controller) {
  var options = {
    method: 'GET',
    cache: noCacheRequested() ? 'no-store' : 'no-cache',
    credentials: 'omit',
    headers: {
      'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.1'
    }
  };
  if (controller) options.signal = controller.signal;
  return options;
}
```

In `fetchHtml`, fetch `requestUrl(url)` instead of unconditionally appending `hcf=<timestamp>`.

In `fetchDirectory`, fetch `requestUrl(DIRECTORY_API)` with:

```js
cache: noCacheRequested() ? 'no-store' : 'no-cache'
```

Keep 403/429 backoff, direct `{id}-{slug}.html` fast path, in-memory caches, request aborting, and script execution unchanged.

- [ ] **Step 4: Apply the same policy to the fragment importer**

After `fragmentUrl` is created:

```js
var noCache = false;
try {
  noCache = new URLSearchParams(location.search).get('hcfNoCache') === '1';
} catch (error) {}

var requestFragmentUrl = fragmentUrl;
if (noCache) {
  requestFragmentUrl += (requestFragmentUrl.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + Date.now();
}
```

Fetch `requestFragmentUrl`, but keep `fragmentUrl` as the canonical base for relative asset rewriting and event detail:

```js
fetch(requestFragmentUrl, {
  method: 'GET',
  cache: noCache ? 'no-store' : 'no-cache',
  credentials: 'omit',
  headers: { 'Accept': 'text/html,*/*;q=0.8' }
})
```

Do not alter `scripts.reduce`, relative URL rewriting, body-only validation, or `hcf:core-fragment:loaded` detail URL.

- [ ] **Step 5: Run validation**

```sh
node --check v1.x/pages/fof-pages/hcf-fof-loader.js
node --check v1.x/core/fragment-importer.js
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: all pass.

- [ ] **Step 6: Manual network test**

In browser DevTools Network:

1. load a FoF page normally twice; second request may revalidate but must not force a timestamp URL;
2. revisit within 60 seconds and confirm the in-memory page cache prevents unnecessary body replacement/network work;
3. load with `?hcfNoCache=1`; confirm HCF fetch URLs gain `hcf=<timestamp>` and request cache mode is no-store;
4. test header/footer fragment importer in normal mode and bypass mode;
5. simulate fragment/FoF request failure and verify existing local/database HTML remains usable.

- [ ] **Step 7: Commit**

```sh
git add v1.x/pages/fof-pages/hcf-fof-loader.js v1.x/core/fragment-importer.js scripts/validate.mjs
git commit -m "perf: revalidate HCF CDN content instead of bypassing cache"
```

---

### Task 5: Replace birthday 30-second polling with midnight scheduling plus 15-minute fallback

**Files:**
- Modify: `v1.x/core/header.html`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: existing `birthdaySystem`, `dateNow()`, `showToday()`, `window.HCBirthday`, JSON fallback records.
- Produces: startup + visibility-return + America/Los_Angeles date-boundary refresh, visible-tab 15-minute safety fallback, unchanged banner API/events/effects.

- [ ] **Step 1: Add failing validator assertions**

Add:

```js
requireText(headerFile, header, "900000", "birthday fallback must be 15 minutes");
requireText(headerFile, header, "scheduleMidnightRefresh", "birthday midnight scheduler is missing");
rejectText(headerFile, header, "setInterval(showToday,30000)", "legacy 30-second birthday polling remains");
```

Run validator; expect FAIL.

- [ ] **Step 2: Generalize the existing LA date helper to accept a timestamp**

Inside `birthdaySystem`, change `dateNow()` to:

```js
function dateAt(value){
  var parts=new Intl.DateTimeFormat("en-US",{
    timeZone:TIME_ZONE,
    year:"numeric",
    month:"numeric",
    day:"numeric"
  }).formatToParts(new Date(value));
  var date={year:0,month:0,day:0};
  parts.forEach(function(part){
    if(part.type==="year"||part.type==="month"||part.type==="day"){
      date[part.type]=Number(part.value);
    }
  });
  return date;
}

function dateNow(){return dateAt(Date.now())}
function dateKey(value){
  var date=dateAt(value);
  return date.year+"-"+date.month+"-"+date.day;
}
```

This preserves `showToday()` behavior while allowing a timezone-safe boundary search.

- [ ] **Step 3: Add a DST-safe next-midnight one-shot scheduler**

Add variables:

```js
var midnightTimer=0;
var fallbackTimer=0;
var BIRTHDAY_FALLBACK_MS=900000;
```

Add:

```js
function scheduleMidnightRefresh(){
  window.clearTimeout(midnightTimer);
  var start=Date.now();
  var current=dateKey(start);
  var low=start;
  var high=start+(27*60*60*1000);

  while(dateKey(high)===current&&high<start+(48*60*60*1000)){
    high+=6*60*60*1000;
  }

  while(high-low>1000){
    var middle=low+Math.floor((high-low)/2);
    if(dateKey(middle)===current)low=middle;
    else high=middle;
  }

  midnightTimer=window.setTimeout(function(){
    showToday();
    scheduleMidnightRefresh();
  },Math.max(1000,high-Date.now()+1000));
}
```

The binary search finds the first instant where the Los Angeles calendar date changes, so DST transitions do not rely on assuming a 24-hour day.

- [ ] **Step 4: Replace the 30-second interval**

After startup/fetch setup:

```js
function startBirthdayFallback(){
  if(fallbackTimer)return;
  fallbackTimer=window.setInterval(function(){
    if(!document.hidden)showToday();
  },BIRTHDAY_FALLBACK_MS);
}

document.addEventListener("visibilitychange",function(){
  if(!document.hidden){
    showToday();
    scheduleMidnightRefresh();
  }
});

scheduleMidnightRefresh();
startBirthdayFallback();
```

Remove only `window.setInterval(showToday,30000);`.

- [ ] **Step 5: Validate inline JavaScript and repository rules**

```sh
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: both pass; the existing inline-script parser confirms header JavaScript syntax.

- [ ] **Step 6: Manual birthday regression test**

Using the existing localhost/`hcDebug=1` test allowance, verify banner display, dismissal, particles, holiday integration, and `window.HCBirthday.refresh()` remain unchanged. Temporarily instrument `showToday()` in DevTools only—not source—to confirm idle checks are no longer every 30 seconds.

- [ ] **Step 7: Commit**

```sh
git add v1.x/core/header.html scripts/validate.mjs
git commit -m "perf: schedule HCF birthday checks by date boundary"
```

---

### Task 6: Make footer identity refresh event-driven with a 60-second fallback

**Files:**
- Modify: `v1.x/core/footer.html`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: existing `refreshIdentity()` and visible footer identity UI.
- Produces: immediate initial/visibility/header-mutation refresh, visible-tab 60-second fallback, unchanged one-second clock.

- [ ] **Step 1: Add failing validator assertions**

Add:

```js
const footerFile = resolve(repositoryRoot, "v1.x/core/footer.html");
const footer = readFileSync(footerFile, "utf8");
requireText(footerFile, footer, "60000", "footer identity fallback must be 60 seconds");
requireText(footerFile, footer, "identityObserver", "footer identity observer is missing");
rejectText(footerFile, footer, "setInterval(refreshIdentity,15000)", "legacy 15-second identity polling remains");
requireText(footerFile, footer, "setInterval(updateClock,1000)", "visible one-second footer clock must remain");
```

Run validator; expect FAIL on the new identity requirements while the clock assertion passes.

- [ ] **Step 2: Preserve the clock and change only identity cadence**

Keep the existing clock timer exactly at 1000 ms.

Replace the 15-second identity timer with:

```js
if(!identityTimer){
    identityTimer=window.setInterval(function(){
        if(!document.hidden){refreshIdentity()}
    },60000);
}
```

- [ ] **Step 3: Add a queued observer scoped to the Flarum header identity host**

In the same footer runtime closure, add:

```js
var identityObserver=null;
var identityRefreshQueued=false;

function queueIdentityRefresh(){
    if(identityRefreshQueued)return;
    identityRefreshQueued=true;
    var run=function(){
        identityRefreshQueued=false;
        refreshIdentity();
    };
    if("requestAnimationFrame" in window)window.requestAnimationFrame(run);
    else window.setTimeout(run,0);
}

function startIdentityObserver(){
    if(identityObserver||!("MutationObserver" in window))return;
    var host=document.querySelector(".App-header,.Header-secondary");
    if(!host)return;
    identityObserver=new MutationObserver(queueIdentityRefresh);
    identityObserver.observe(host,{childList:true,subtree:true,characterData:true});
}
```

Call `startIdentityObserver()` after the existing initial `refreshIdentity()` call.

- [ ] **Step 4: Refresh on visibility return and HCF dynamic page events**

Add:

```js
document.addEventListener("visibilitychange",function(){
    if(!document.hidden){
        refreshIdentity();
        startIdentityObserver();
    }
});
window.addEventListener("hcf:fof-page:loaded",queueIdentityRefresh);
window.addEventListener("hcf:core-fragment:loaded",queueIdentityRefresh);
```

Do not introduce a document-wide mutation observer.

- [ ] **Step 5: Validate**

```sh
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: pass.

- [ ] **Step 6: Manual identity/clock test**

Verify guest state, logged-in state, login/logout transition, SPA navigation, hidden→visible tab transition, and FoF page injection. Confirm the footer clock still advances every second and identity changes do not wait for the 60-second fallback when the header changes.

- [ ] **Step 7: Commit**

```sh
git add v1.x/core/footer.html scripts/validate.mjs
git commit -m "perf: make HCF footer identity refresh event driven"
```

---

### Task 7: Perform conservative fragment source cleanup without changing DOM contracts

**Files:**
- Modify: `v1.x/core/header.html`
- Modify: `v1.x/core/footer.html`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: all existing header/footer IDs, classes, ARIA attributes, inline critical CSS, and public runtime globals/events.
- Produces: smaller/readable fragments with identical required DOM hooks and no FOUC-inducing stylesheet extraction.

- [ ] **Step 1: Build a reference list before deleting any markup**

Use repository search for every candidate wrapper ID/class before removal. A wrapper may be removed only when all three are true:

1. no CSS selector in `v1.x/` targets it;
2. no JavaScript selector/property lookup in `v1.x/` targets it;
3. it has no semantic/ARIA/layout role that changes rendering or accessibility.

Do not remove any element that fails one of these checks.

- [ ] **Step 2: Remove only source-only comments and exact redundant attributes**

Safe removals are limited to:

- obsolete development comments that do not document compatibility behavior;
- duplicate identical attributes on the same element, if any;
- whitespace-only lines that do not occur inside `<pre>`, `<script>`, `<style>`, or text nodes where whitespace is significant.

Keep comments that explain Flarum ownership, fallback behavior, mobile breakpoints, theme synchronization, birthday/holiday behavior, or extension compatibility.

- [ ] **Step 3: Do not externalize critical inline CSS in this pass**

Leave startup-critical header/footer CSS inline. This task must not create a new fragment stylesheet and must not move rules that could cause FOUC/layout jump. Any future CSS extraction requires its own measured change.

- [ ] **Step 4: Coalesce only duplicate synchronization calls inside the same script burst**

Where a single event handler invokes the same synchronization function more than once synchronously, keep one call. Do not merge independent public event handlers or change execution order across separate `<script>` blocks unless the resulting order is demonstrably identical.

- [ ] **Step 5: Add validator guards for required fragment hooks**

Lock at minimum the existing IDs/data hooks used by the header/footer systems. Use the actual current identifiers discovered during implementation and add `requireText(...)` checks for them before committing. Keep the existing body-only and explicit-button-type checks.

- [ ] **Step 6: Validate**

```sh
node scripts/validate.mjs
node scripts/validate-global-assets.mjs
```

Expected: pass.

Compare byte counts:

```sh
wc -c v1.x/core/header.html v1.x/core/footer.html
```

Record before/after counts in the commit message body or implementation notes. A size reduction is desirable but must never take priority over compatibility.

- [ ] **Step 7: Manual fragment regression test**

Test both installation modes:

1. direct body-only fragment content;
2. guarded `fragment-importer.js` loading.

Verify notice/banner, birthday/holiday controls, footer feedback panel, theme sync, identity UI, cookie-consent clearance, and failure behavior.

- [ ] **Step 8: Commit**

```sh
git add v1.x/core/header.html v1.x/core/footer.html scripts/validate.mjs
git commit -m "refactor: trim HCF fragment source without changing hooks"
```

---

### Task 8: Final regression, performance verification, and version/documentation update

**Files:**
- Modify: version headers in only the files changed by Tasks 2–7
- Modify if behavior documentation changed: `README.md`
- Modify: `docs/superpowers/specs/2026-09-16-hcf-css-js-html-optimization-design.md` status line only if desired by project convention
- Test: full repository validators and manual regression matrix

**Interfaces:**
- Consumes: all prior tasks.
- Produces: validated release-ready optimization with accurate version metadata.

- [ ] **Step 1: Run the complete automated suite**

```sh
node scripts/audit-css.mjs
node scripts/validate-global-assets.mjs
node scripts/validate.mjs
```

Expected: all exit `0`.

- [ ] **Step 2: Run standalone syntax checks explicitly**

```sh
node --check v1.x/core/fragment-importer.js
node --check v1.x/add-ons/mobile-auth-tip.js
node --check v1.x/pages/fof-pages/hcf-page.js
node --check v1.x/pages/fof-pages/hcf-fof-loader.js
node --check v1.x/pages/fof-pages/hcf-domain-router.js
```

Expected: all exit `0`.

- [ ] **Step 3: Execute the manual regression matrix**

Test at minimum:

- forum home/discussion list;
- discussion view;
- composer overlay;
- `/compose` route;
- login/signup modals;
- notifications/flags/FoF Drafts;
- Direct Messages;
- FoF Pages through SPA navigation;
- FoF Upload images on phone and desktop;
- Cookie Consent;
- header notice;
- birthday/holiday banner and fallback JSON behavior;
- footer feedback panel;
- fragment importer success and network failure;
- dark/light mode;
- reduced motion.

Phone tests must include `<=767.98px`; desktop/tablet tests must include `>=768px`.

- [ ] **Step 4: Verify the performance contracts in DevTools**

Confirm:

- FoF runtime idle fallback is no more frequent than 5 minutes;
- footer identity fallback is no more frequent than 60 seconds;
- birthday fallback is no more frequent than 15 minutes outside startup/visibility/midnight events;
- normal remote HCF requests do not carry forced timestamp parameters;
- `hcfNoCache=1` does carry a timestamp and bypass cache;
- fragment/FoF repeat navigation can revalidate cached bodies instead of unconditional body transfer;
- no new layout shift is visible at header/footer startup;
- no mutation callback produces obvious repeated long tasks.

- [ ] **Step 5: Update version headers only after verification**

Increment only the version comments in files whose behavior/source changed. Keep the existing naming/versioning style of each file; do not invent a new global version scheme. Update `Updated:` dates to `2026-09-16` where the file was changed during this optimization.

- [ ] **Step 6: Update README runtime/cache notes if needed**

If README currently documents no-store behavior or the old timer cadence, update it to state:

```text
HCF production remote content uses cache revalidation. Add hcfNoCache=1 to the current page URL only when diagnosing CDN/cache behavior; this forces HCF-managed remote fetches to bypass cache for that page load.
```

Do not tell users to use the bypass for normal browsing.

- [ ] **Step 7: Re-run validators after metadata/docs edits**

```sh
node scripts/audit-css.mjs
node scripts/validate-global-assets.mjs
node scripts/validate.mjs
```

Expected: all pass.

- [ ] **Step 8: Commit**

```sh
git add v1.x README.md docs/superpowers/specs scripts
git commit -m "chore: finalize HCF performance optimization release"
```

- [ ] **Step 9: Verify CI on the final commit**

Confirm GitHub Actions `Validate HCF` passes both Node.js 22 checks before merging/deploying any optimization branch to production.
