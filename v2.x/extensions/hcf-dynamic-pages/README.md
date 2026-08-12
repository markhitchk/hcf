# HCF Dynamic Pages (Flarum 2.x)

Companion extension for **FriendsOfFlarum Pages 2.x** that adds a per-page
GitHub HTML source to HTML-enabled FoF pages.

## Compatibility

- Flarum: `^2.0`
- FriendsOfFlarum Pages: 2.x-compatible package
- Default HCF content folder: `v2.x/pages/fof-pages`

The runtime was audited against the current FoF Pages `2.x` component markup:
`Pages`, `data-id`, `data-slug`, `Pages-container`, `Post-body` and
`EditPageModal` remain available.

## What it does

- Adds an **HCF Dynamic HTML Source** panel below FoF Pages' **Enable HTML** option.
- Stores settings inside the page HTML as an invisible
  `<template data-hcf-dynamic-page>` marker.
- Requires no extra database migration or manifest.
- Supports new FoF pages automatically.
- Keeps local FoF HTML as a fallback if the remote source cannot load.
- Supports remote stylesheets, `<style>`, inline scripts and external scripts.
- Works across Flarum SPA navigation by rescanning page DOM changes.

## Auto source mode

For a FoF page with ID `25` and slug `domain-help`, the extension tries:

1. `25-domain-help.html`
2. `domain-help.html`
3. `25.html`

Default source:

- Repository: `markhitchk/hcf`
- Branch: `main`
- Folder: `v2.x/pages/fof-pages`

Repository, branch and folder remain configurable per page.

## Installation

Copy this directory into the Flarum 2.x installation, for example:

```text
<flarum-root>/extensions/hcf-dynamic-pages/
```

Then register and require it:

```bash
composer config repositories.hcf-dynamic-pages path ./extensions/hcf-dynamic-pages
composer require harleytg/hcf-dynamic-pages:@dev
php flarum migrate
php flarum cache:clear
```

Enable **FriendsOfFlarum Pages** first, then enable **HCF Dynamic Pages**.

## Using a page

1. Open **Admin → FoF Pages**.
2. Create or edit a page.
3. Enable HTML.
4. Enable **Use external GitHub HTML for this page**.
5. Leave **Auto detect** selected or enter a custom HTTPS URL.
6. Test the source.
7. Save the page.

Keep usable local HTML in the normal FoF Content field. It remains the
fallback if the remote file is missing or unavailable.

## Stored metadata

```html
<template
  data-hcf-dynamic-page="1"
  data-enabled="true"
  data-mode="auto"
  data-repository="markhitchk/hcf"
  data-branch="main"
  data-folder="v2.x/pages/fof-pages">
</template>
```

## Release note

This package is source-audited for the Flarum 2.x release-candidate API. Run a
live test on the actual HCF 2.x installation before production deployment.
