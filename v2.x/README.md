# HCF — Flarum 2.x Compatibility Build

This folder is the Harley's Clan Forum compatibility tree for **Flarum 2.x**.
It is based on the current `v1.x/` feature set, then patched against the
upstream `flarum/framework` **2.x** branch and FriendsOfFlarum Pages **2.x**.

## Status

- **Target:** Flarum 2.x release-candidate/stable API
- **HCF status:** source-audited compatibility preview
- **Production:** keep using `v1.x/` until the forum itself is upgraded
- **Live validation:** pending an HCF Flarum 2.x installation/stable release

Flarum's 2.x API is in the release-candidate phase, so this tree is intended
to be ready before the final stable deployment. It must still receive a live
smoke test on the actual forum before replacing `v1.x/` in production.

## What is included

The complete HCF feature tree is carried forward:

```text
v2.x/
├── add-ons/
│   ├── direct-messages.css
│   ├── flarum-2-compat.css
│   ├── header-panels.css
│   ├── loading-screen.css
│   ├── mobile-auth-tip.js
│   ├── mobile-auth-tooltip.css
│   ├── mobile.css
│   ├── motion.css
│   └── seasonal/
├── assets/
│   └── logos/HTG.svg
├── core/
│   ├── admin.css
│   ├── footer.html
│   ├── header.html
│   ├── htg.desktop.css
│   └── htg.forum.css
├── extensions/
│   └── hcf-dynamic-pages/
└── pages/
    ├── errors/
    └── fof-pages/
```

## Flarum 2.x changes

The compatibility build deliberately keeps Flarum in charge of its native
layout and patches only HCF-owned behavior.

- Keeps Flarum's native **767.98px** phone boundary.
- Bridges older HCF variable names to Flarum 2.x CSS variables such as
  `--text-color`.
- Preserves Flarum 2.x's native mobile drawer, page controls, composer, modal,
  and dropdown positioning.
- Accounts for Flarum 2.x's responsive header overflow menu.
- Does not re-anchor children when Flarum 2.x groups multiple
  `.App-primaryControl` items into its right-side flex row.
- Keeps HCF mobile composer/banner fixes only where the current 2.x core still
  exposes the same component structure.
- Updates HCF Dynamic Pages to require Flarum 2.x and to load page sources from
  `v2.x/pages/fof-pages` by default.

## Main CSS entry point

After this compatibility tree is merged into a release commit, use a pinned
commit URL rather than `@main`:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@<release-commit>/v2.x/core/htg.forum.css");
```

Do not switch the live Flarum 1.x forum to this entry point before the forum is
actually upgraded to Flarum 2.x.

## Core HTML

When testing Flarum 2.x:

- use `v2.x/core/header.html` as the custom header fragment;
- use `v2.x/core/footer.html` as the custom footer fragment;
- use `v2.x/core/admin.css` for the admin panel;
- use `v2.x/core/htg.forum.css` as the only HCF forum CSS entry point.

## HCF Dynamic Pages

The Flarum 2.x package is under:

```text
v2.x/extensions/hcf-dynamic-pages/
```

It targets `flarum/core ^2.0` and the FoF Pages 2.x component structure. Auto
source mode uses:

```text
v2.x/pages/fof-pages
```

The local FoF page content remains the fallback if a remote HCF page cannot be
loaded.

## Pre-release validation

Run the repository checks plus the dedicated 2.x source audit:

```sh
node scripts/validate.mjs
node scripts/validate-v2.mjs
```

The 2.x audit checks that the full compatibility tree exists, its CSS imports
resolve, the dynamic-pages Composer requirement is for Flarum 2.x, the runtime
defaults point at `v2.x`, and the dedicated compatibility layer is present.

## Required live smoke test before production

Once an HCF test install can run Flarum 2.x, verify at minimum:

1. Desktop/tablet header overflow, session menu, flags, notifications and drafts.
2. Phone drawer, dropdown sheets, route pages and custom notice/header spacing.
3. Login, signup, forgot-password and FoF Terms content.
4. Discussion/reply/edit composer plus `/compose` if Composer Page is enabled.
5. Direct Messages / Conversations on phone and desktop.
6. FoF Pages static and dynamic HTML, including script/style loading and fallback.
7. Admin CSS, custom header/footer, error pages and seasonal content.
8. Light, dark and high-contrast theme readability.

A source audit cannot prove extension-to-extension runtime behavior, so this
smoke test is the final gate before changing the production import from
`v1.x/` to `v2.x/`.

---

**Author:** HarleyTG
**Compatibility baseline:** August 11, 2026
