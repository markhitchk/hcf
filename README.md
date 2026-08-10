# HCF — Harley's Clan Forum

Custom forum styling, optional addons, shared assets, and branded error pages for Harley's Clan Forum.

## Repository structure

```text
core/
├── htg.forum.css
├── master.css
├── admin.css
├── header.html
└── footer.html

addons/
├── animations.css
├── conversations.css
├── mobile-v2.css
├── kaios-accessibility-v2.css
├── messages.sys.css
├── user-directory.css
├── welcome-loading.css
└── celebrations/
    ├── birthdays.json
    ├── holidays.js
    ├── holidays.json
    ├── install-snippet.html
    └── README.md

assets/
└── logos/
    ├── HTG.svg
    ├── HTG-Icon.svg
    └── HTG-Icon.png

pages/
└── errors/
    ├── 403.html
    ├── 404.html
    ├── 500.html
    └── 503.html
```

## Main forum CSS

`core/htg.forum.css` is the canonical stylesheet used by Harley's Clan Forum.

Paste this single raw CSS import into Flarum's **Appearance → Custom CSS** field:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/core/htg.forum.css");
```

Do not wrap CSS URLs in Markdown link syntax such as `[URL](URL)`.

The main stylesheet currently loads these addons in order:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/animations.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@27b450adfe7d89ff5aa395589d60cb147534fc60/addons/messages.sys.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/welcome-loading.css");

/* Modern phones and tablets only. */
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/mobile-v2.css");
```

`core/master.css` is retained as a legacy stylesheet and is not the primary forum entrypoint.

## Optional addons

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/animations.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/conversations.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/mobile-v2.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/kaios-accessibility-v2.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/user-directory.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/welcome-loading.css">
```

Load `kaios-accessibility-v2.css` after `mobile-v2.css` so the KaiOS-specific rules remain last.

## Core HTML

- Paste `core/header.html` into the forum custom header.
- Paste `core/footer.html` into the forum custom footer.
- Use `core/admin.css` for the Flarum administration panel.

## Celebrations

Birthday records and automatic holiday banners are grouped in `addons/celebrations`.

## Error pages

The FoF HTML error pages are stored under `pages/errors` by HTTP status code.

## Browser support

Designed for current desktop and mobile browsers. KaiOS support is available through the optional `kaios-accessibility-v2.css` addon.

---

**Author:** HarleyTG
