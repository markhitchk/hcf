# HCF Dynamic Pages (Flarum 1.x)

Companion extension for **FriendsOfFlarum Pages** that adds a per-page GitHub HTML source to HTML-enabled FoF pages.

## What it does

- Adds an **HCF Dynamic HTML Source** panel directly below FoF Pages' **Enable HTML** option.
- Settings are saved inside that page's HTML as an invisible `<template data-hcf-dynamic-page>` marker.
- No extra database migration is required.
- No manifest is required.
- No custom forum footer loader is required.
- New FoF pages are supported automatically.
- Local FoF HTML remains visible if the remote source cannot be loaded.
- Remote `<style>`, stylesheet links, inline scripts, and external scripts are supported.
- Works with Flarum SPA navigation.

## Auto source mode

For a FoF page with ID `25` and slug `domain-help`, the extension tries these files in order:

1. `25-domain-help.html`
2. `domain-help.html`
3. `25.html`

Default source location:

- Repository: `markhitchk/hcf`
- Branch: `main`
- Folder: `v1.x/pages/fof-pages`

The repository, branch and folder can be changed per page.

## Custom URL mode

Choose **Custom HTTPS URL** in the per-page panel and enter a direct HTML URL. Only HTTPS sources are loaded.

## Installation

This directory is a standalone Flarum extension package.

Copy `hcf-dynamic-pages` into a local extensions directory in the Flarum installation, for example:

```text
<flarum-root>/extensions/hcf-dynamic-pages/
```

Then register that local Composer repository and install it:

```bash
composer config repositories.hcf-dynamic-pages path ./extensions/hcf-dynamic-pages
composer require harleytg/hcf-dynamic-pages:@dev
php flarum migrate
php flarum cache:clear
```

Enable **HCF Dynamic Pages** in Flarum Admin after FriendsOfFlarum Pages is enabled.

## Using a page

1. Open **Admin > FoF Pages**.
2. Create or edit a page.
3. Check **Enable HTML**.
4. The **HCF Dynamic HTML Source** panel appears.
5. Check **Use external GitHub HTML for this page**.
6. Leave **Auto detect** selected or choose a custom HTTPS URL.
7. Use **Test Source**.
8. Save the FoF page.

Keep usable HTML in FoF's normal **Content** box. That content is the fallback whenever GitHub or the custom source is unavailable.

## Stored page metadata

The extension stores a marker like this at the beginning of the HTML page content:

```html
<template
  data-hcf-dynamic-page="1"
  data-enabled="true"
  data-mode="auto"
  data-repository="markhitchk/hcf"
  data-branch="main"
  data-folder="v1.x/pages/fof-pages">
</template>
```

`<template>` is not displayed by the browser, but the forum runtime can read it before replacing the page body with the remote HTML.

## Compatibility

Targeted at Flarum 1.8 and FriendsOfFlarum Pages 1.x.
