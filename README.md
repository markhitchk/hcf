# HCF — Harley's Clan Forum

Custom forum styling, add-ons, shared assets, and branded error pages for Harley's Clan Forum.

## Flarum versions

| Folder | Flarum version | Status |
| --- | --- | --- |
| `v1.x/` | Flarum 1.x | Production |
| `v2.x/` | Flarum 2.x | Not in use |

All production files are stored under `v1.x/`. The repository uses folders on the `main` branch; it does not use version branches.

## Repository structure

```text
v1.x/
├── add-ons/
│   ├── direct-messages.css
│   ├── header-panels.css
│   ├── loading-screen.css
│   ├── mobile.css
│   ├── motion.css
│   └── seasonal/
│       ├── birthdays.json
│       ├── holidays.js
│       ├── holidays.json
│       ├── install-snippet.html
│       └── README.md
├── assets/
│   └── logos/
│       └── HTG.svg
├── core/
│   ├── admin.css
│   ├── footer.html
│   ├── header.html
│   ├── htg.desktop.css
│   └── htg.forum.css
├── pages/
│   └── errors/
│       ├── 403.html
│       ├── 404.html
│       ├── 500.html
│       └── 503.html

v2.x/
└── README.md

scripts/
└── validate.mjs

.github/workflows/
└── validate.yml
```

## Main Flarum 1.x CSS

`v1.x/core/htg.forum.css` is the production stylesheet used by Harley's Clan Forum.

Paste this verified release import into Flarum's **Appearance → Custom CSS** field:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@020544b5591381e8aeeba7da84b79b2eda1ae575/v1.x/core/htg.forum.css");
```

Use the URL exactly as shown. Its commit pin also applies to every relative
import in the release, preventing jsDelivr from mixing cached `@main` files.
Do not wrap the URL in Markdown link syntax such as `[URL](URL)` or paste the
relative imports below directly into Flarum.

The entry point separates phone and desktop rules at Flarum's native
`767.98px` phone breakpoint:

```css
/* Phones: HCF add-ons plus mobile overrides. */
@import url("../add-ons/motion.css") screen and (max-width: 767.98px);
@import url("../add-ons/header-panels.css") screen and (max-width: 767.98px);
@import url("../add-ons/direct-messages.css") screen and (max-width: 767.98px);
@import url("../add-ons/loading-screen.css") screen and (max-width: 767.98px);
@import url("../add-ons/mobile.css") screen and (max-width: 767.98px);

/* Desktop and tablet-up. */
@import url("./htg.desktop.css") screen and (min-width: 768px);
```

`mobile.css` deliberately leaves the phone header, navigation controls,
drawer, backdrop, and content positioning to
[Flarum 1.x's framework App styles](https://github.com/flarum/framework/blob/1.x/framework/core/less/common/App.less).
It also preserves Flarum's native
[dropdown sheet](https://github.com/flarum/framework/blob/1.x/framework/core/less/common/Dropdown.less)
and [mobile modal](https://github.com/flarum/framework/blob/1.x/framework/core/less/common/Modal.less)
positioning and transitions.
It only supplies HCF drawer branding, extension overflow protection, Flarum's
phone discussion-list spacing, and compact mobile styling. Only the canonical
add-on filenames are kept so old aliases cannot create duplicate imports or
stale CDN paths.

The body-only `v1.x/core/header.html` fragment also installs a small Flarum
compatibility override for mobile notification, flag, and FoF Drafts controls.
When the phone drawer is open, those components load and open their native
dropdown sheet instead of immediately routing away. The override keeps the
framework component, unread counts, backdrop, close behavior, and direct
`/notifications`, `/flags`, and `/drafts` routes intact; it does not modify
Flarum core files.

## Core HTML

- Paste the complete body-only `v1.x/core/header.html` fragment into the forum
  custom header. Its mobile panel override is required for notification, flag,
  and FoF Drafts sheets; CSS alone cannot change Flarum's route-on-phone click.
- Paste the body-only `v1.x/core/footer.html` fragment into the forum custom footer.
- Use `v1.x/core/admin.css` for the Flarum administration panel.

## Seasonal content and error pages

- Birthday records and automatic holiday banners are in `v1.x/add-ons/seasonal/`.
- FoF HTML error pages are in `v1.x/pages/errors/`, organized by HTTP status code.

## Browser support

The Flarum 1.x styles target current desktop and mobile browsers and use
Flarum's official `767.98px` phone breakpoint. Run the dependency-free check
before publishing changes:

```sh
node scripts/validate.mjs
```

The same check runs automatically in GitHub Actions.

---

**Author:** HarleyTG
