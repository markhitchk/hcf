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
│   ├── loading-screen.css
│   ├── mobile.css
│   ├── motion.css
│   ├── seasonal/
│   └── compatibility aliases
├── assets/
│   └── logos/
│       ├── HTG.svg
│       ├── HTG-Icon.svg
│       └── HTG-Icon.png
├── core/
│   ├── HTG-Icon.svg
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
└── readme

v2.x/
└── readme.md
```

## Main Flarum 1.x CSS

`v1.x/core/htg.forum.css` is the production stylesheet used by Harley's Clan Forum.

Paste this single import into Flarum's **Appearance → Custom CSS** field:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/htg.forum.css");
```

Use the URL exactly as shown. Do not wrap it in Markdown link syntax such as `[URL](URL)`.

The entry point separates phone and desktop rules at Flarum's native
`767.98px` phone breakpoint:

```css
/* Phones: HCF add-ons plus mobile overrides. */
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/motion.css") screen and (max-width: 767.98px);
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/direct-messages.css") screen and (max-width: 767.98px);
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/loading-screen.css") screen and (max-width: 767.98px);
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/mobile.css") screen and (max-width: 767.98px);

/* Desktop and tablet-up. */
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/htg.desktop.css") screen and (min-width: 768px);
```

`mobile.css` deliberately leaves the phone header, navigation controls,
drawer, backdrop, and content positioning to
[Flarum 1.x's framework App styles](https://github.com/flarum/framework/blob/1.x/framework/core/less/common/App.less).
It only supplies HCF drawer branding, extension overflow protection, and
compact mobile spacing. The old names such as `mobile-v2.css`,
`animations.css`, `messages.sys.css`, and `welcome-loading.css` remain
as compatibility aliases.

## Core HTML

- Paste `v1.x/core/header.html` into the forum custom header.
- Paste `v1.x/core/footer.html` into the forum custom footer.
- Use `v1.x/core/admin.css` for the Flarum administration panel.

## Seasonal content and error pages

- Birthday records and automatic holiday banners are in `v1.x/add-ons/seasonal/`.
- FoF HTML error pages are in `v1.x/pages/errors/`, organized by HTTP status code.

## Browser support

The Flarum 1.x styles target current desktop and mobile browsers.

---

**Author:** HarleyTG
