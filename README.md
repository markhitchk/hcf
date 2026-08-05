# HCF — Harley's Clan Forum

Custom CSS, HTML components, add-ons, assets, and branded error pages for Harley's Clan Forum.

## Repository structure

```text
core/
├── master.css
├── master-v5.css
├── master-modern.css
├── master-animated.css
├── admin.css
├── header.html
└── footer.html

addons/
├── animations.css
├── conversations.css
├── messenger.css
├── notifications.css
├── user-directory.css
├── welcome-loading.css
├── kaios-accessibility.css
└── celebrations/
    ├── birthday.js
    ├── birthdays.json
    ├── holidays.js
    ├── holidays.json
    ├── install-snippet.html
    └── README.md

assets/
└── logos/
    └── HTG.svg

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

## Add-ons

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/messenger.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/notifications.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/conversations.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/user-directory.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/animations.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/welcome-loading.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/kaios-accessibility.css">
```

## Celebrations

Birthdays and holidays are kept together in `addons/celebrations/`.

```html
<script src="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/celebrations/holidays.js"></script>
```

## Compatibility

Small compatibility entry files keep the previous CSS and holiday URLs working while the canonical files use the organized names above.
