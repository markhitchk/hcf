# HCF for Flarum 2.x

This folder is the pre-release Flarum 2.x build of Harley's Clan Forum's theme, add-ons, shared assets, custom HTML, and branded error pages.

It is a complete copy of the current `v1.x/` package with Flarum 2 compatibility updates applied. The production `v1.x/` folder is unchanged.

## Compatibility snapshot

| Component | Version or commit |
| --- | --- |
| HCF source | `v1.x/` at `296f88870e303edd046bf25d2ece471622f8e0ed` |
| Flarum source | [`flarum/framework` branch `2.x`](https://github.com/flarum/framework/tree/2.x) |
| Verified Flarum commit | `f4a460ef9e6dff8452ad4d524df726692c7280bb` |
| Build version | `6.0.0-alpha.1` |
| Verified date | August 9, 2026 |

Flarum 2 is still under development. This package is ready for a Flarum 2 test installation, but it should be rechecked against the final Flarum 2 release commit before replacing the live Flarum 1.x theme.

## Install the main theme

Paste this single line into **Administration → Appearance → Custom CSS**:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/core/htg.forum.css");
```

The main file imports the add-ons in this order:

```css
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/add-ons/animations.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/add-ons/messages.sys.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/add-ons/welcome-loading.css");
@import url("https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v2.x/add-ons/mobile-v2.css");
```

Use the URLs exactly as shown. Do not wrap them in Markdown link syntax.

## Custom HTML and admin CSS

- Paste `core/header.html` into the custom header field.
- Paste `core/footer.html` into the custom footer field.
- Use `core/admin.css` for the Flarum administration panel.
- The Flarum 2 direct-messages route is `/messages`.

## Flarum 2 changes included

- All versioned imports and asset URLs point to `v2.x/`.
- The header's Direct Messages link uses Flarum 2's `/messages` route.
- `messages.sys.css` supports Flarum 2's native `flarum/messages` components: `DialogsDropdown`, `DialogList`, `DialogSection`, and `MessageStream`.
- `messages.css` remains available as a compatibility entry point and imports the maintained `messages.sys.css` file.
- Flag and notification styling supports Flarum 2's `HeaderList`, `HeaderListGroup`, and `HeaderListItem` markup.
- Admin styling supports the Flarum 2 `ExtensionsWidget` section and item classes.
- Hard-coded icon font references use Font Awesome 7, as bundled by Flarum 2.
- Legacy `ConversationsPage` and `NotificationList` selectors remain as isolated fallbacks for extensions that have not migrated yet.
- Branded footer and error-page images load from the versioned `v2.x/assets/logos/` folder.

## Folder structure

```text
v2.x/
├── add-ons/
│   ├── animations.css
│   ├── messages.css
│   ├── messages.sys.css
│   ├── mobile-v2.css
│   ├── welcome-loading.css
│   └── celebrations/
├── assets/
│   └── logos/
├── core/
│   ├── admin.css
│   ├── footer.html
│   ├── header.html
│   └── htg.forum.css
├── pages/
│   └── errors/
└── readme.md
```

## Release-day check

Before moving the live forum to Flarum 2:

1. Compare the final `flarum/framework` release commit with the verified commit above.
2. Test the header dropdowns, `/messages`, flags, login/sign-up modals, profile controls, mobile bottom navigation, and admin dashboard.
3. Clear Flarum's cache and purge jsDelivr after publishing any last selector changes.

---

**Author:** HarleyTG
