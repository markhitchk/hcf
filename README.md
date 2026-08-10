# HCF — Harley's Clan Forum

Custom forum styling, add-ons, shared assets, and branded error pages for Harley's Clan Forum.

## Flarum versions

| Folder | Flarum version | Status |
| --- | --- | --- |
| `v1.x/` | Flarum 1.x | Production |
| `v2.x/` | Flarum 2.x | Pre-release test build |

Production files remain under `v1.x/`. The complete Flarum 2 pre-release package is under `v2.x/`. The repository uses version folders on `main`, not version branches.

## Repository structure

```text
v1.x/
├── add-ons/
│   ├── animations.css
│   ├── messages.sys.css
│   ├── mobile-v2.css
│   ├── welcome-loading.css
│   └── celebrations/
│       ├── birthdays.json
│       ├── holidays.js
│       ├── holidays.json
│       ├── install-snippet.html
│       └── README.md
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
│   └── htg.forum.css
├── pages/
│   └── errors/
│       ├── 403.html
│       ├── 404.html
│       ├── 500.html
│       └── 503.html
└── readme

v2.x/
├── add-ons/
├── assets/
├── core/
├── pages/
└── readme.md
```

## Main Flarum 1.x CSS

`v1.x/core/htg.forum.css` is the production stylesheet used by Harley's Clan Forum.

Paste this single import into Flarum's **Appearance → Custom CSS** field:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/htg.forum.css");
```

Use the URL exactly as shown. Do not wrap it in Markdown link syntax such as `[URL](URL)`.

The main stylesheet loads these add-ons in order:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/animations.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/messages.sys.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/welcome-loading.css");

/* Modern phones and tablets only. */
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/mobile-v2.css");
```

## Core HTML

- Paste `v1.x/core/header.html` into the forum custom header.
- Paste `v1.x/core/footer.html` into the forum custom footer.
- Use `v1.x/core/admin.css` for the Flarum administration panel.

## Flarum 2.x pre-release build

`v2.x/` mirrors the full `v1.x/` package and includes compatibility for the current [`flarum/framework` `2.x` branch](https://github.com/flarum/framework/tree/2.x).

For a Flarum 2 test installation, import:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/core/htg.forum.css");
```

See [`v2.x/readme.md`](v2.x/readme.md) for the verified upstream commit, Flarum 2 changes, installation details, and release-day checklist.

## Celebrations and error pages

- Birthday records and automatic holiday banners are in `v1.x/add-ons/celebrations/`.
- FoF HTML error pages are in `v1.x/pages/errors/`, organized by HTTP status code.

## Browser support

The Flarum 1.x styles target current desktop and mobile browsers.

---

**Author:** HarleyTG
