/* =========================================================
   Harley's Clan Forum — FoF Page srcdoc Bootstrap
   Build: 1.0.0
   Updated: 2026-08-11

   Purpose:
   FriendsOfFlarum Pages injects saved HTML dynamically, so a normal
   <script> inside the FoF Content field may not execute. This file is
   loaded inside a hidden iframe srcdoc document, then safely reaches
   the parent FoF page, detects its ID/slug, fetches matching GitHub HTML,
   imports styles/body content, and re-runs page scripts.
   ========================================================= */
(function () {
  'use strict';

  var BUILD = '1.0.0';
  var OWNER = 'markhitchk';
  var REPO = 'hcf';
  var BRANCH = 'main';
  var FOLDER = 'v1.x/pages/fof-pages';
  var RAW_BASE = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + FOLDER + '/';
  var API_DIR = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FOLDER + '?ref=' + encodeURIComponent(BRANCH);

  var frame = window.frameElement;
  if (!frame || !frame.ownerDocument) return;

  var parentDocument = frame.ownerDocument;
  var parentWindow = parentDocument.defaultView || window.parent;
  var page = frame.closest ? frame.closest('.Pages[data-id][data-slug]') : null;
  var body = page ? (page.querySelector('.Pages-container .Post-body') || page.querySelector('.Post-body')) : null;
  var root = frame.parentElement ? frame.parentElement.querySelector('[data-hcf-fof-import-root]') : null;

  if (!page || !body || !root) {
    console.error('[HCF FoF Bootstrap] Could not locate FoF page/root.');
    return;
  }

  var id = String(page.getAttribute('data-id') || '').trim();
  var slug = String(page.getAttribute('data-slug') || '').trim();

  if (!id || !slug) {
    root.textContent = 'Page could not be detected.';
    return;
  }

  var key = id + '-' + slug;
  root.setAttribute('data-hcf-page', key);
  root.setAttribute('aria-busy', 'true');

  function encodeFile(name) {
    return encodeURIComponent(String(name || ''));
  }

  function directCandidates() {
    return [
      id + '-' + slug + '.html',
      slug + '.html',
      id + '.html'
    ];
  }

  async function fetchText(url) {
    try {
      var response = await fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: { 'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.1' }
      });

      if (!response.ok) return null;
      var text = await response.text();
      return text && text.trim() ? text : null;
    } catch (error) {
      return null;
    }
  }

  async function tryDirect() {
    var names = directCandidates();
    for (var i = 0; i < names.length; i++) {
      var url = RAW_BASE + encodeFile(names[i]);
      var html = await fetchText(url);
      if (html !== null) return { html: html, url: url, file: names[i] };
    }
    return null;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async function discoverFromDirectory() {
    try {
      var response = await fetch(API_DIR + '&hcf=' + Date.now(), {
        cache: 'no-store',
        credentials: 'omit',
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!response.ok) return null;

      var entries = await response.json();
      if (!Array.isArray(entries)) return null;

      var htmlFiles = entries.filter(function (entry) {
        return entry && entry.type === 'file' && /\.html$/i.test(entry.name || '') && entry.download_url;
      });

      var normalizedSlug = normalize(slug);
      var idPrefix = id + '-';

      htmlFiles.sort(function (a, b) {
        function score(entry) {
          var name = String(entry.name || '');
          var stem = name.replace(/\.html$/i, '');
          var normalizedStem = normalize(stem);
          var result = 0;

          if (name === key + '.html') result += 1000;
          if (name.indexOf(idPrefix) === 0) result += 500;
          if (normalizedStem === normalizedSlug) result += 300;
          if (normalizedStem.indexOf(normalizedSlug) !== -1) result += 100;
          return result;
        }
        return score(b) - score(a);
      });

      for (var i = 0; i < htmlFiles.length; i++) {
        var candidate = htmlFiles[i];
        var name = String(candidate.name || '');
        var stem = name.replace(/\.html$/i, '');
        var matchesId = name.indexOf(idPrefix) === 0 || stem === id;
        var matchesSlug = normalize(stem) === normalizedSlug || normalize(stem).indexOf(normalizedSlug) !== -1;

        if (!matchesId && !matchesSlug) continue;

        var html = await fetchText(candidate.download_url);
        if (html !== null) return { html: html, url: candidate.download_url, file: name };
      }
    } catch (error) {}

    return null;
  }

  function resolveUrl(value, sourceUrl) {
    if (!value) return value;
    try {
      return new URL(value, sourceUrl).href;
    } catch (error) {
      return value;
    }
  }

  function toCdnAssetUrl(url) {
    try {
      var parsed = new URL(url);
      if (parsed.hostname !== 'raw.githubusercontent.com') return parsed.href;

      var parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 4) return parsed.href;

      var owner = parts.shift();
      var repo = parts.shift();
      var branch = parts.shift();
      var path = parts.join('/');
      return 'https://cdn.jsdelivr.net/gh/' + owner + '/' + repo + '@' + branch + '/' + path;
    } catch (error) {
      return url;
    }
  }

  function fixRelativeAssets(parsed, sourceUrl) {
    Array.prototype.forEach.call(parsed.querySelectorAll('[src]'), function (element) {
      var value = element.getAttribute('src');
      if (value) element.setAttribute('src', resolveUrl(value, sourceUrl));
    });

    Array.prototype.forEach.call(parsed.querySelectorAll('[poster]'), function (element) {
      var value = element.getAttribute('poster');
      if (value) element.setAttribute('poster', resolveUrl(value, sourceUrl));
    });

    Array.prototype.forEach.call(parsed.querySelectorAll('[href]'), function (element) {
      var value = element.getAttribute('href');
      if (!value || value.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(value)) return;
      element.setAttribute('href', resolveUrl(value, sourceUrl));
    });
  }

  function removePreviousAssets() {
    Array.prototype.forEach.call(parentDocument.querySelectorAll('[data-hcf-fof-import-asset]'), function (node) {
      node.remove();
    });
  }

  function installStyles(parsed, sourceUrl) {
    var index = 0;

    Array.prototype.forEach.call(parsed.querySelectorAll('style'), function (original) {
      var style = parentDocument.createElement('style');
      style.setAttribute('data-hcf-fof-import-asset', key);
      style.setAttribute('data-hcf-fof-style-index', String(index++));
      style.textContent = original.textContent || '';
      (parentDocument.head || parentDocument.documentElement).appendChild(style);
      original.remove();
    });

    Array.prototype.forEach.call(parsed.querySelectorAll('link[rel="stylesheet"]'), function (original) {
      var href = resolveUrl(original.getAttribute('href'), sourceUrl);
      if (!href) return;

      var link = parentDocument.createElement('link');
      link.rel = 'stylesheet';
      link.href = toCdnAssetUrl(href);
      link.setAttribute('data-hcf-fof-import-asset', key);
      (parentDocument.head || parentDocument.documentElement).appendChild(link);
      original.remove();
    });
  }

  function copyScriptAttributes(from, to) {
    Array.prototype.forEach.call(from.attributes || [], function (attribute) {
      if (attribute.name.toLowerCase() === 'src') return;
      to.setAttribute(attribute.name, attribute.value);
    });
  }

  function runScript(original, sourceUrl) {
    return new Promise(function (resolve) {
      var script = parentDocument.createElement('script');
      var src = original.getAttribute('src');
      copyScriptAttributes(original, script);
      script.setAttribute('data-hcf-fof-import-asset', key);

      if (!src) {
        script.textContent = original.textContent || '';
        (parentDocument.head || parentDocument.documentElement).appendChild(script);
        script.remove();
        resolve();
        return;
      }

      var resolved = toCdnAssetUrl(resolveUrl(src, sourceUrl));

      if (parentDocument.querySelector('script[src="' + resolved.replace(/"/g, '\\"') + '"]')) {
        resolve();
        return;
      }

      script.src = resolved;
      script.async = false;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        console.warn('[HCF FoF Bootstrap] Script failed:', resolved);
        resolve();
      };
      (parentDocument.head || parentDocument.documentElement).appendChild(script);
    });
  }

  async function renderRemote(result) {
    var parser = new DOMParser();
    var parsed = parser.parseFromString(result.html, 'text/html');

    fixRelativeAssets(parsed, result.url);

    var scripts = Array.prototype.slice.call(parsed.querySelectorAll('script'));
    scripts.forEach(function (script) { script.remove(); });

    removePreviousAssets();
    installStyles(parsed, result.url);

    var nodes = Array.prototype.slice.call(parsed.body.childNodes).map(function (node) {
      return parentDocument.importNode(node, true);
    });

    if (!nodes.length) throw new Error('Remote HTML had no body content.');

    root.replaceChildren.apply(root, nodes);
    root.setAttribute('data-hcf-source-file', result.file);
    root.setAttribute('data-hcf-source-url', result.url);
    root.setAttribute('data-hcf-loaded', 'true');
    root.setAttribute('aria-busy', 'false');

    for (var i = 0; i < scripts.length; i++) {
      await runScript(scripts[i], result.url);
    }

    try {
      parentWindow.dispatchEvent(new parentWindow.CustomEvent('hcf:fof-page:loaded', {
        detail: {
          build: BUILD,
          id: id,
          slug: slug,
          file: result.file,
          source: result.url
        }
      }));
    } catch (error) {}

    console.info('[HCF FoF Bootstrap] Loaded ' + result.file + ' for ' + key);
  }

  async function start() {
    var result = await tryDirect();
    if (!result) result = await discoverFromDirectory();

    if (!result) {
      root.setAttribute('aria-busy', 'false');
      root.setAttribute('data-hcf-error', 'not-found');
      root.innerHTML = '<div class="hcf-page-import-error"><strong>Page source not found.</strong><br>The matching GitHub HTML file could not be located.</div>';
      return;
    }

    try {
      await renderRemote(result);
    } catch (error) {
      root.setAttribute('aria-busy', 'false');
      root.setAttribute('data-hcf-error', 'render-failed');
      root.innerHTML = '<div class="hcf-page-import-error"><strong>Page failed to render.</strong><br>The GitHub HTML was found, but could not be displayed.</div>';
      console.error('[HCF FoF Bootstrap]', error);
    }
  }

  start().finally(function () {
    try { frame.remove(); } catch (error) {}
  });
})();
