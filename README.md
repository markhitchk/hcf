# HCF — Harley's Clan Forum

Custom forum styling, add-ons, shared assets, FoF Pages content, companion
extensions and branded error pages for Harley's Clan Forum.

## Flarum versions

| Folder | Flarum version | Status |
| --- | --- | --- |
| `v1.x/` | Flarum 1.x | **Production** |
| `v2.x/` | Flarum 2.x | **RC-ready compatibility preview** |

`v1.x/` remains the live production source until the forum itself is upgraded.
`v2.x/` is a complete copy of the HCF feature tree with a dedicated Flarum 2.x
compatibility layer and Flarum-2 version of the HCF Dynamic Pages extension.

The repository uses version folders on `main`; it does not use `1.x` or `2.x`
as Git branch names.

## Repository structure

```text
v1.x/
├── add-ons/
├── assets/
├── core/
├── extensions/
└── pages/

v2.x/
├── add-ons/
│   └── flarum-2-compat.css
├── assets/
├── core/
├── extensions/
└── pages/

scripts/
├── validate.mjs
└── validate-v2.mjs
```

## Flarum 1.x production CSS

The production entry point is:

```text
v1.x/core/htg.forum.css
```

Use a **commit-pinned** jsDelivr URL in Flarum's Appearance → Custom CSS field.
Do not use `@main` for a production release import.

The entry point separates phone and tablet/desktop rules at Flarum's native
`767.98px` phone breakpoint. Flarum owns the native phone header, drawer,
dropdown sheet, modal and composer geometry; HCF supplies branding and
extension-specific responsive fixes around those framework rules.

## Flarum 2.x compatibility CSS

The pre-release 2.x entry point is:

```text
v2.x/core/htg.forum.css
```

It carries the full HCF feature set forward and loads:

```text
v2.x/add-ons/flarum-2-compat.css
```

The compatibility layer is intentionally narrow. It bridges HCF's older CSS
variable aliases to Flarum 2.x, preserves the framework's responsive header
overflow behavior, and avoids fighting the 2.x multi-primary-control layout.

After a tested v2 release is merged, use a pinned import such as:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@<release-commit>/v2.x/core/htg.forum.css");
```

Do **not** use the v2 entry point on the current Flarum 1.x production forum.

See [`v2.x/README.md`](v2.x/README.md) for the compatibility notes and the
required live smoke-test checklist before production migration.

## HCF Dynamic Pages

Both version trees contain the companion `hcf-dynamic-pages` extension.

- `v1.x/extensions/hcf-dynamic-pages/` requires Flarum 1.x and defaults to
  `v1.x/pages/fof-pages`.
- `v2.x/extensions/hcf-dynamic-pages/` requires Flarum 2.x and defaults to
  `v2.x/pages/fof-pages`.

The local FriendsOfFlarum Pages HTML remains the fallback if a configured
remote source cannot be loaded.

## Core HTML

Use the matching version folder for the forum custom HTML:

- `core/header.html` — body-only custom header fragment
- `core/footer.html` — body-only custom footer fragment
- `core/admin.css` — administration styling

Never mix a v1 core entry point with a v2 compatibility deployment.

## Validation

Run the normal HCF validation:

```sh
node scripts/validate.mjs
```

For Flarum 2.x changes also run:

```sh
node scripts/validate-v2.mjs
```

The 2.x audit verifies that the complete v1 feature baseline exists in the v2
tree, all v2 entry-point imports resolve, the Flarum 2 compatibility layer is
present, the dynamic-pages package requires Flarum 2.x, its browser runtimes
default to the v2 FoF page tree, and the custom header/footer remain body-only
fragments.

Source validation is not a substitute for a live upgrade test. The v2 tree
must be smoke-tested on an actual Flarum 2.x HCF installation before it becomes
the production import.

---

**Author:** HarleyTG
