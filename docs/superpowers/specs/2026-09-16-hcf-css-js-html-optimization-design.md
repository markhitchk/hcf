# HCF CSS, JavaScript, and HTML Optimization Design

**Date:** 2026-09-16  
**Repository:** `markhitchk/hcf`  
**Production scope:** `v1.x/`  
**Status:** Approved design, implementation not started

## Goal

Optimize Harley's Clan Forum CSS, JavaScript, and HTML for lower runtime work, lower repeat network cost, and easier maintenance without breaking Flarum 1.x behavior, FriendsOfFlarum integrations, HCF mobile behavior, existing public selectors, or current fallback paths.

The optimization is intentionally staged. Pass A preserves current behavior exactly while removing safe duplication and unnecessary source overhead. Pass B allows invisible runtime changes such as less polling, narrower observers, and better caching, provided visible behavior and compatibility stay the same.

## Core Principle

HCF is not being rewritten. The current `v1.x/` architecture remains the production architecture. Existing public files, selectors, globals, events, breakpoints, and fragment contracts are treated as compatibility interfaces.

The implementation must optimize behind those interfaces rather than replacing them.

## Production Contracts That Must Not Break

### CSS contracts

- `v1.x/core/htg.forum.css` remains the canonical Flarum-facing stylesheet entry point.
- Flarum's native phone breakpoint remains `max-width: 767.98px`; desktop/tablet-up remains `min-width: 768px`.
- The existing import order remains authoritative because later files intentionally override earlier files.
- Flarum retains ownership of native phone header, navigation, drawer, backdrop, composer, and affix positioning.
- Existing high-specificity selectors and `!important` declarations are not simplified unless computed behavior is proven identical.
- Existing FoF Cookie Consent, Direct Messages, Drafts, Upload, Night Mode, PWA, notification, flag, composer, and page-specific rules remain supported.
- Reduced-motion behavior remains supported.
- Day/night compatibility remains loaded last where it currently acts as the final synchronization layer.
- The current September 16, 2026 mobile FoF Upload preview fix must remain intact.

### JavaScript contracts

The following globals remain available where they exist today:

- `window.HCFPageRuntime`
- `window.HCFDomainRouter`
- `window.HCFFoFPagesLoader`
- `window.HCBirthday`
- `window.HCFCoreFragmentImports`

The following behavior contracts remain intact:

- Flarum SPA navigation support
- FoF page dynamic replacement
- sequential script execution after remote HTML injection
- external script deduplication
- network-failure fallback to existing FoF database HTML
- fragment-load failure fallback
- mobile auth tooltip CSS fallback when JavaScript is unavailable
- sessionStorage behavior for mobile auth tooltip dismissal
- existing custom events, including `hcf:fof-page:loaded`, `hcf:core-fragment:loaded`, and `hc-banners-changed`
- public `.refresh()` methods that existing callers may invoke

### HTML fragment contracts

- `v1.x/core/header.html` remains a body-only fragment.
- `v1.x/core/footer.html` remains a body-only fragment.
- Neither fragment may contain `<!doctype>`, `<html>`, `<head>`, or `<body>`.
- Existing IDs, classes, data attributes, ARIA attributes, and button semantics remain stable unless a reference audit proves an element is private and unused.
- Critical startup styling must remain available early enough to avoid visible layout flashes or header/footer jumps.
- The fragment importer continues to resolve relative assets and execute extracted scripts sequentially.

## Scope

### In scope

- CSS source cleanup and safe deduplication
- CSS variable consolidation where resolved values remain identical
- removal of overwritten duplicate declarations where cascade behavior is unchanged
- preservation and documentation of compatibility-critical selectors
- JavaScript polling reduction
- JavaScript observer scoping and work deduplication
- event-driven refresh where equivalent events already exist
- cache behavior improvements for HCF fragments and FoF remote pages
- inline HTML/CSS/JS cleanup in `header.html` and `footer.html`
- reduction of repeated DOM queries and repeated state synchronization
- validation coverage for the contracts above
- reversible, staged changes with small commits

### Out of scope

- Flarum 2.x work
- React, Vue, Svelte, or other framework migrations
- redesigning HCF visuals
- changing forum navigation behavior
- renaming public HCF files
- replacing Flarum markup or extension markup
- removing compatibility selectors merely because they appear verbose
- changing canonical global artwork
- bundling all CSS or all JavaScript into one monolithic production file
- changing the one-second visible footer clock cadence if the UI displays seconds

## Design: CSS Optimization

### Approach

Keep the current modular stylesheet architecture and optimize readable source rather than minifying production source files in place.

`htg.forum.css` continues to select viewport-specific layers. `mobile.css` continues to own HCF phone overrides only. `htg.desktop.css` continues to own desktop/tablet-up presentation. Shared extension and compatibility layers remain separate when their load order or ownership matters.

### Safe transformations

The implementation may:

- combine identical selector blocks when they occur in the same cascade position and specificity context
- combine repeated property groups across selectors when the resulting selector list has identical behavior
- remove duplicate properties when an earlier declaration in the same block is always overwritten by a later declaration
- consolidate repeated custom-property definitions when fallback behavior remains identical
- merge repeated media-query blocks only if rule order inside the merged query remains equivalent
- normalize whitespace and comments while preserving useful compatibility documentation

### Forbidden transformations

The implementation must not:

- reorder imports for cosmetic reasons
- change selector specificity without proof of equivalence
- drop `!important` from compatibility rules without live behavior verification
- collapse mobile and desktop files into one stylesheet
- change the `767.98px`/`768px` split
- remove Flarum or FoF selectors because static search does not find locally-owned markup
- auto-minify the editable source files

### Optional generated minified assets

Generated `.min.css` files may be added later only if they are produced from readable source and do not replace the canonical source until validated. They are not required for the first optimization pass.

## Design: JavaScript and Runtime Optimization

### Shared scheduling rule

Repeated callbacks caused by the same render burst should be coalesced where safe. A component may use a local queued flag plus `requestAnimationFrame`, a microtask, or the existing debounce strategy to ensure multiple synchronous mutations trigger one refresh instead of several.

This does not mean introducing one global observer for the entire application. Component ownership remains local.

### FoF page runtime

Current behavior includes startup refresh, resize refresh, `hcf:fof-page:loaded`, visibility return, and a 30-second fallback interval.

Design:

- retain startup refresh
- retain resize debounce
- retain `hcf:fof-page:loaded`
- retain visibility-return refresh
- make event-driven refresh the primary path
- slow the 30-second interval to a low-frequency safety fallback rather than removing it outright
- keep `HCFPageRuntime.refresh()` public and synchronous from the caller's perspective

The safety interval exists only to recover from missed extension/session changes, not as the primary state engine.

### Mobile auth tooltip

Current behavior scans added DOM nodes through a `MutationObserver` and uses CSS as a no-JavaScript fallback.

Design:

- preserve node-added scanning because Flarum modals are dynamic
- avoid a full-document rescan per mutation
- activate the observer only while the viewport is in the phone range when practical
- disconnect it when the viewport is clearly desktop
- reconnect and scan once when entering the phone breakpoint
- retain sessionStorage semantics and the CSS-only fallback

### FoF loader

The loader already has page cache, missing-page cache, directory cache, request aborting, loaded-script deduplication, and SPA refresh behavior. These stay.

Design:

- preserve direct `{id}-{slug}.html` lookup as the fast path
- preserve directory discovery as fallback
- preserve existing remote HTML fallback behavior
- stop forcing timestamp cache-busting for every successful production fetch
- use normal browser/CDN caching for stable production fetches
- keep an explicit cache-busting/debug mode for development and forced refresh scenarios
- continue aborting stale requests when navigation moves to another FoF page
- keep script execution order unchanged

### Header birthday and seasonal logic

Birthday state changes at calendar boundaries, not every 30 seconds.

Design:

- calculate state on startup
- recalculate when the tab becomes visible
- schedule a refresh for the next local HCF date boundary
- retain a low-frequency fallback to recover from timer throttling or long-running tabs
- preserve birthday dismissal behavior, JSON fallback records, holiday integration, banner events, and visual effects

### Footer identity and clock

Design:

- keep the visible clock's one-second timer if seconds are displayed
- replace identity polling as the primary mechanism with event-driven refresh from available SPA/session/header changes
- retain a slower identity fallback interval for compatibility
- avoid identity DOM queries while the document is hidden when no visible update is needed

## Design: HTML, Header, and Footer Optimization

### Source structure

`header.html` and `footer.html` remain the canonical fragments. The goal is to reduce repeated source and runtime work while preserving body-only insertion and current DOM contracts.

### Markup cleanup

Safe cleanup may include:

- removing wrappers only after repository-wide reference checks confirm no selector or script targets them
- consolidating duplicate attributes only when resulting DOM state is identical
- removing obsolete development comments while keeping compatibility comments
- preserving explicit button `type` attributes
- preserving ARIA labels, live regions, and keyboard-accessible controls

### Inline CSS

Critical startup CSS stays inline when moving it would create flash-of-unstyled-content or layout movement.

Stable, non-critical visual rules may move into existing HCF stylesheets when all of the following are true:

1. the stylesheet is guaranteed to load for the fragment's viewport;
2. selector order is preserved;
3. the fragment remains usable when loaded through the guarded importer;
4. no temporary unstyled state becomes visible.

No new large global stylesheet is introduced solely to empty the fragments.

### Inline JavaScript

Related fragment logic may be consolidated internally to reduce duplicate DOM queries, observers, and timers. Public globals and custom events remain unchanged.

The implementation should prefer one local synchronization pass per component state change rather than several independent functions querying the same nodes in one frame.

### Fragment importer caching

The importer currently fetches canonical fragments and preserves relative assets plus sequential scripts.

Design:

- preserve insertion order and script order
- preserve failure logging and partially inserted markup behavior
- preserve body-only validation
- allow normal browser/CDN caching in production instead of unconditional `cache: "no-store"`
- support explicit versioning or cache-busting when a release requires an immediate fragment refresh
- preserve the existing `data-hcf-fragment` interface

## Validation and Regression Strategy

### Existing automated validation

The repository already runs:

```sh
node scripts/validate-global-assets.mjs
node scripts/validate.mjs
```

GitHub Actions runs both under Node.js 22 on pushes to `main` and pull requests.

Implementation must keep these passing at every commit.

### Validator extensions

`node scripts/validate.mjs` should be extended as needed to lock the approved optimization contracts, including:

- required CSS import order and breakpoints
- body-only header/footer requirement
- retained public JS global names
- retained key custom event names
- absence of accidental debug statements
- syntax checks for modified standalone JavaScript files
- preservation of mobile compatibility selectors that have historically regressed
- preservation of FoF Upload phone image-preview rules
- preservation of reduced-motion safeguards
- preservation of fragment importer sequential execution behavior

### Manual regression matrix

Every runtime optimization must be checked across these scenarios before release:

| Area | Phone | Tablet/Desktop | Dark/Light | SPA Navigation | Network Failure |
| --- | --- | --- | --- | --- | --- |
| Forum home/discussion list | Yes | Yes | Yes | Yes | N/A |
| Discussion view | Yes | Yes | Yes | Yes | N/A |
| Composer overlay | Yes | Yes | Yes | Yes | N/A |
| `/compose` route | Yes | Yes | Yes | Yes | N/A |
| Login modal | Yes | Yes | Yes | Yes | N/A |
| Signup modal | Yes | Yes | Yes | Yes | N/A |
| Notifications/flags/drafts | Yes | Yes | Yes | Yes | N/A |
| Direct Messages | Yes | Yes | Yes | Yes | N/A |
| FoF Pages | Yes | Yes | Yes | Yes | Yes |
| FoF Upload images | Yes | Yes | Yes | Yes | N/A |
| Cookie Consent | Yes | Yes | Yes | Yes | N/A |
| Header notice | Yes | Yes | Yes | Yes | N/A |
| Birthday/holiday banner | Yes | Yes | Yes | Yes | JSON fallback |
| Footer feedback panel | Yes | Yes | Yes | Yes | N/A |
| Fragment importer | Yes | Yes | Yes | Yes | Yes |

### Performance checks

The implementation should compare before/after behavior using browser developer tools or equivalent instrumentation and verify:

- fewer periodic calls to FoF runtime refresh during an idle visible page
- fewer identity refreshes during an idle session
- no repeated remote FoF HTML requests when revisiting the same page within the cache window
- no repeated header/footer fragment network transfer when the browser cache is valid
- no increase in layout shift during header/footer startup
- no increase in long tasks from mutation handling

Absolute performance targets are not required because device/network conditions vary. The required result is lower repeated work with equivalent visible behavior.

## Implementation Order

Implementation should proceed in independent, reviewable phases:

1. strengthen validation for the contracts that will be touched;
2. perform safe CSS deduplication without runtime behavior changes;
3. optimize FoF/runtime polling and observer scheduling;
4. optimize fragment/FoF caching with explicit debug bypass support;
5. optimize header/footer internal timers and repeated DOM work;
6. perform safe HTML/inline-style cleanup;
7. run the full automated and manual regression matrix;
8. update version headers only after behavior is validated.

Each phase should be separately revertible. A later phase must not be required to make an earlier phase safe.

## Rollback Strategy

Every optimization commit must be small enough to revert independently.

If a regression appears:

- revert the smallest commit responsible for the behavior;
- keep unaffected optimizations in place;
- do not patch over an uncertain regression with additional specificity, observers, or timers until the original cause is identified;
- restore the previous polling/caching behavior first if a runtime freshness regression is suspected.

No database migration or persistent data format change is part of this project, so rollback remains source-only.

## Success Criteria

The optimization is complete only when all of the following are true:

- `node scripts/validate-global-assets.mjs` passes;
- `node scripts/validate.mjs` passes;
- GitHub Actions validation passes;
- no approved public selector, global, event, or fragment contract is removed;
- Flarum phone navigation behavior remains native;
- desktop/tablet behavior remains visually equivalent;
- light/dark behavior remains equivalent;
- reduced-motion behavior remains equivalent;
- FoF Pages still work through SPA navigation and network-failure fallback;
- mobile auth tooltip still works with and without JavaScript;
- header notice, seasonal banners, footer feedback, and identity UI remain functional;
- idle runtime polling and repeat network requests are measurably reduced;
- source remains readable and maintainable.

## Non-Goal Confirmation

This project optimizes HCF v1.x. It does not redesign HCF, port HCF to another framework, alter Flarum's core navigation model, or migrate production to `v2.x/`.
