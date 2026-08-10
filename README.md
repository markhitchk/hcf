# HCF — Harley's Clan Forum

Custom forum styling, optional addons, shared assets, and branded error pages for Harley's Clan Forum.

## Repository structure

```text
core/
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

## Main theme

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/core/master.css">
```

`core/master.css` loads the unified responsive messaging stylesheet.

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
