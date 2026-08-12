# HCF — Flarum 2.x Compatibility Build

This folder is the Harley's Clan Forum compatibility tree for **Flarum 2.x**.
It carries forward the complete `v1.x/` HCF feature set and then applies the
Flarum 2.x-specific compatibility work needed by the current upstream
`flarum/framework` 2.x and FriendsOfFlarum Pages 2.x code.

## Compatibility goal

`v2.x/` is intended to be the one-for-one Flarum 2.x counterpart of `v1.x/`.
Every tracked file under `v1.x/` must have a matching path under `v2.x/`.
Operational files inside `v2.x/` must use the v2 assets, loaders, pages and
runtime paths rather than silently reaching back into `v1.x/`.

That parity is enforced by `scripts/validate-v2.mjs` in CI.

## Status

- **Target:** Flarum 2.x release-candidate/stable API
- **HCF status:** complete source-level v1.x → v2.x parity build
- **Production:** keep using `v1.x/` until the forum itself is upgraded
- **Live validation:** still required on an actual HCF Flarum 2.x installation

Source-level compatibility and path independence do not replace a live browser
smoke test. Third-party extensions also need their own Flarum 2.x-compatible
releases before those extension-backed features can be considered deployable.

## Included v2.x feature tree

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
│   └── logos/
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

## Flarum 2.x entry point

Use:

```text
v2.x/core/htg.forum.css
```

For an actual release, use a commit-pinned import:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@<release-commit>/v2.x/core/htg.forum.css");
```

Do not switch the live Flarum 1.x forum to this entry point before the forum is
actually upgraded to Flarum 2.x.

The entry point loads the complete HCF styling stack and then the dedicated
`flarum-2-compat.css` layer. The native Flarum phone boundary remains
767.98px / 768px.

## Self-contained v2 runtime

The v2 tree has its own operational copies of HCF resources. In particular:

- custom header/footer logo and seasonal URLs resolve through `v2.x/`
- FoF page CSS, JS, bootstrap, entry and loader files resolve through `v2.x/`
- FoF Dynamic Pages defaults to `v2.x/pages/fof-pages`
- error pages use the v2 logo path and Flarum 2.x labels
- seasonal install snippets use the v2 seasonal script
- Direct Messages and motion metadata identify their v2 paths

The root `v2.x/README.md` may mention `v1.x/` for migration documentation, but
operational v2 files are rejected by CI if they reference a v1 runtime path.

## HCF Dynamic Pages for Flarum 2.x

The package under:

```text
v2.x/extensions/hcf-dynamic-pages/
```

requires Flarum 2.x and FriendsOfFlarum Pages. Its forum and admin runtimes use
the 2.x page tree by default while retaining the local FoF page HTML as a
fallback when a remote page source cannot be loaded.

## Core HTML

When testing Flarum 2.x:

- use `v2.x/core/header.html` as the body-only custom header
- use `v2.x/core/footer.html` as the body-only custom footer
- use `v2.x/core/admin.css` for the admin theme
- use `v2.x/core/htg.forum.css` for forum styling

Do not mix v1 and v2 core runtime files in one deployment.

## Validation

Run both checks from the repository root:

```sh
node scripts/validate.mjs
node scripts/validate-v2.mjs
```

The v2 validation checks, among other things:

1. Every file in `v1.x/` has a non-empty counterpart under `v2.x/`.
2. Operational v2 text files do not reference `v1.x/` runtime resources.
3. The full v2 CSS entry stack exists and uses the Flarum 2 compatibility layer.
4. The HCF Dynamic Pages package requires Flarum 2.x and FoF Pages.
5. Dynamic Pages forum/admin bundles default to the v2 page tree.
6. The FoF loader chain does not fall back to v1 HCF runtime files.
7. Header/footer remain valid body-only Flarum fragments.
8. Error pages use v2 assets and Flarum 2.x labels.

## Required live smoke test before production

Once an HCF Flarum 2.x installation is available, verify at minimum:

1. Forum index, discussion list, discussion pages and user profiles.
2. Header overflow, session menu, notifications, flags and drafts.
3. Desktop and phone composer, including the standalone `/compose` route.
4. Login, signup, forgot-password and Terms/legal UI.
5. Direct Messages dropdown and `/conversations` page with the compatible
   messaging extension installed.
6. FriendsOfFlarum Pages, HCF Dynamic Pages and all page-loader failure modes.
7. Admin CSS, custom header/footer, error pages and seasonal content.
8. Light, dark and high-contrast theme readability.
9. Touch/mobile behavior at Flarum's phone boundary and current tablets.
10. Every third-party extension used by HCF has a Flarum 2.x-compatible release.

A source audit cannot prove extension-to-extension runtime behavior, so this
smoke test remains the final gate before changing production from `v1.x/` to
`v2.x/`.

---

**Author:** HarleyTG  
**Compatibility baseline:** August 11, 2026
