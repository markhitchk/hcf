# HCF — Harley's Clan Forum

Custom forum styling, add-ons, shared assets, and branded error pages for Harley's Clan Forum.

## Flarum versions

| Folder | Flarum version | Status |
| --- | --- | --- |
| `v1.x/` | Flarum 1.x | Production |
| `v2.x/` | Flarum 2.x | Not in use |

All production Flarum files are stored under `v1.x/`. Shared branding assets are stored once under the repository-level `assets/` folder and are used by every supported version. The repository uses folders on the `main` branch; it does not use version branches.

## Repository structure

```text
assets/
└── logos/
    ├── HTG.svg
    ├── HTG-App-Icon.png
    ├── HTG-Construction-Icon.png
    ├── HTG-Full-Logo.png
    ├── htg-icon.png
    └── htg-neon.png

v1.x/
├── add-ons/
│   ├── compact-laptop.css
│   ├── cookie-consent.css
│   ├── day-night-compat.css
│   ├── desktop-header-alerts.css
│   ├── direct-messages.css
│   ├── header-panels.css
│   ├── loading-screen.css
│   ├── mobile-auth-tip.js
│   ├── mobile-auth-tooltip.css
│   ├── mobile.css
│   ├── motion.css
│   └── seasonal/
│       ├── birthdays.json
│       ├── holidays.js
│       ├── holidays.json
│       ├── install-snippet.html
│       └── README.md
├── core/
│   ├── admin.css
│   ├── footer.html
│   ├── header.html
│   ├── htg.desktop.css
│   └── htg.forum.css
└── pages/
    ├── errors/
    │   ├── 403.html
    │   ├── 404.html
    │   ├── 500.html
    │   ├── 503.html
    │   └── error-loader.js
    └── fof-pages/
        ├── *.html
        ├── hcf-domain-router.js
        ├── hcf-fof-loader.js
        ├── hcf-page.js
        ├── hcf-page.css
        ├── hcf-page-runtime.css
        └── hcf-page-v2.1.css

v2.x/
└── README.md

scripts/
├── validate.mjs
└── validate-global-assets.mjs

.github/workflows/
└── validate.yml
```

## Shared logo assets

All HCF versions must use the repository-level logo assets. Do not create or reference a version-local `v1.x/assets/logos/` copy.

Canonical CDN paths:

```text
https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/HTG.svg
https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/htg-icon.png
https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/htg-neon.png
```

## Main Flarum 1.x CSS

`v1.x/core/htg.forum.css` is the production stylesheet used by Harley's Clan Forum.

Paste this live import into Flarum's **Appearance → Custom CSS** field:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/htg.forum.css");
```

Use the URL exactly as shown. HCF CDN references use `@main` so the forum follows the current production files in this repository. Relative imports inside `htg.forum.css` remain under the same `v1.x/` tree. Do not wrap the URL in Markdown link syntax such as `[URL](URL)` or paste the relative imports below directly into Flarum.

The entry point loads the shared FoF Cookie Consent theme on every viewport, then separates phone and desktop rules at Flarum's native `767.98px` phone breakpoint:

```css
/* Shared extension styling. */
@import url("../add-ons/cookie-consent.css");

/* Phones: HCF add-ons plus mobile overrides. */
@import url("../add-ons/motion.css") screen and (max-width: 767.98px);
@import url("../add-ons/header-panels.css") screen and (max-width: 767.98px);
@import url("../add-ons/direct-messages.css") screen and (max-width: 767.98px);
@import url("../add-ons/loading-screen.css") screen and (max-width: 767.98px);
@import url("../add-ons/mobile.css") screen and (max-width: 767.98px);

/* Desktop and tablet-up. */
@import url("./htg.desktop.css") screen and (min-width: 768px);
```

`cookie-consent.css` styles FriendsOfFlarum Cookie Consent using the extension's standard CookieConsent v3 classes. It follows Flarum dark/light theme variables while keeping HCF cyan `#00b8f0`, includes desktop and mobile layouts, and is designed to work with the Discord feedback clearance logic in `v1.x/core/footer.html`.

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

Mobile notification, flag, and FoF Drafts controls retain Flarum's native
phone behavior: tapping one from the open drawer routes to its full page.
HCF hides only the transient Bootstrap dropdown that can flash before routing.
On those route pages, titles and every action supplied by Flarum or an
extension stay in a visible in-page control row below the custom notice.
The standard Flarum composer overlay and the Composer Page extension's
`/compose` route both keep their phone header controls below that notice.
Flarum's native `.Composer` keeps its first title row—such as “Start a
discussion”—centered inside the composer's own phone header instead of fixing
that row to the viewport.
On `/compose`, the navigation background, “Start a discussion” title, and send
control share one offset so the title remains centered inside the phone header.
Flarum success, error, and extension alerts also retain the HCF desktop alert
appearance on phones, with full-width touch controls and safe-area spacing.
That includes AskVortsov PWA's inline push-permission notice and its Opt In or
Learn More controls inside user notification settings.

## Core HTML

- Paste the complete body-only `v1.x/core/header.html` fragment into the forum
  custom header.
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
node scripts/validate-global-assets.mjs
```

The same check runs automatically in GitHub Actions.

---

**Author:** HarleyTG
