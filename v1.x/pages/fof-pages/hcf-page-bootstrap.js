/* =========================================================
   Harley's Clan Forum — FoF Page srcdoc Bootstrap
   Build: 1.1.1
   Updated: 2026-08-11

   Lightweight shared loader for v1.x FriendsOfFlarum Pages.
   - Low-cost loading UI
   - Mobile animation disabled
   - Automatic missing/deleted page fallback
   - Explicit route aliases for FoF page/file ID mismatches
   - Network/render timeout protection
   - Remote page styles/scripts preserved
   ========================================================= */
(function () {
  'use strict';

  var BUILD = '1.1.1';
  var OWNER = 'markhitchk';
  var REPO = 'hcf';
  var BRANCH = 'main';
  var FOLDER = 'v1.x/pages/fof-pages';
  var RAW_BASE = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + FOLDER + '/';
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + BRANCH + '/' + FOLDER + '/';
  var API_DIR = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FOLDER + '?ref=' + encodeURIComponent(BRANCH);
  var LOAD_TIMEOUT = 12000;
  var ROUTE_FILES = {
    '26-critter-extraction': '27-critter-extraction.html'
  };

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
  var key = id && slug ? id + '-' + slug : '';
  var controller = typeof AbortController === 'function' ? new AbortController() : null;
  var timedOut = false;
  var timeoutId = 0;

  function installLoaderStyle() {
    if (parentDocument.getElementById('hcf-fof-bootstrap-ui')) return;

    var style = parentDocument.createElement('style');
    style.id = 'hcf-fof-bootstrap-ui';
    style.textContent =
      '[data-hcf-fof-import-root]{max-width:760px;margin:18px auto;padding:20px 18px;box-sizing:border-box;background:#12171c;border:1px solid #00b8f0;border-radius:8px;color:#e8f8ff;text-align:center;font-family:Arial,sans-serif}' +
      '.hcf-page-import-status{font-size:14px;font-weight:700;color:#00b8f0}' +
      '.hcf-page-import-subtext{margin-top:6px;font-size:12px;color:#aebbc2}' +
      '.hcf-page-loader-track{width:100%;max-width:340px;height:3px;margin:16px auto 0;overflow:hidden;background:#283138;border-radius:3px}' +
      '.hcf-page-loader-bar{width:34%;height:100%;background:#00b8f0;transform:translateX(-120%);animation:hcfFofLoad 1.5s linear infinite}' +
      '.hcf-page-import-error-title{margin:0 0 8px;font-size:16px;color:#ff6b6b}' +
      '.hcf-page-import-error-text{margin:0;color:#aebbc2;font-size:13px;line-height:1.5}' +
      '.hcf-page-import-error-button{margin-top:14px;padding:8px 14px;border:0;border-radius:5px;background:#00b8f0;color:#001217;font:700 12px Arial,sans-serif;cursor:pointer}' +
      '@keyframes hcfFofLoad{to{transform:translateX(315%)}}' +
      '@media(max-width:767.98px){[data-hcf-fof-import-root]{margin:12px auto;padding:17px 14px}.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}}' +
      '@media(prefers-reduced-motion:reduce){.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}}';
    (parentDocument.head || parentDocument.documentElement).appendChild(style);
  }

  function showLoading() {
    installLoaderStyle();
    root.setAttribute('aria-busy', 'true');
    root.removeAttribute('data-hcf-error');
    root.innerHTML =
      '<div class="hcf-page-import-status">Loading page…</div>' +
      '<div class="hcf-page-import-subtext">Harley\'s Clan Forum</div>' +
      '<div class="hcf-page-loader-track" aria-hidden="true"><div class="hcf-page-loader-bar"></div></div>';
  }

  function showError(type) {
    installLoaderStyle();
    root.setAttribute('aria-busy', 'false');
    root.setAttribute('data-hcf-error', type || 'unavailable');

    var message = type === 'timeout'
      ? 'The page service did not respond in time. The page may be temporarily unavailable.'
      : type === 'render-failed'
        ? 'The page file was found, but it could not be displayed correctly.'
        : 'This page could not be loaded. It may have been removed, deleted, renamed, or be temporarily unavailable.';

    root.innerHTML =
      '<div class="hcf-page-import-error" role="alert">' +
        '<h2 class="hcf-page-import-error-title">Page unavailable</h2>' +
        '<p class="hcf-page-import-error-text">' + message + '</p>' +
        '<button class="hcf-page-import-error-button" type="button" data-hcf-page-retry>Retry</button>' +
      '</div>';

    var retry = root.querySelector('[data-hcf-page-retry]');
    if (retry) {
      retry.addEventListener('click', function () {
        try { parentWindow.location.reload(); } catch (error) {}
      });
    }
  }

  if (!id || !slug) {
    showError('not-found');
    return;
  }

  root.setAttribute('data-hcf-page', key);
  showLoading();

  function encodeFile(name) {
    return encodeURIComponent(String(name || ''));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function fetchOptions(accept) {
    var options = {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'Accept': accept }
    };
    if (controller) options.signal = controller.signal;
    return options;
  }

  async function fetchText(url) {
    try {
      var response = await fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + Date.now(), fetchOptions('text/html,text/plain;q=0.9,*/*;q=0.1'));
      if (!response.ok) return null;
      var text = await response.text();
      return text && text.trim() ? text : null;
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      return null;
    }
  }

  async function tryDirect() {
    var name = ROUTE_FILES[key] || (key + '.html');
    var url = CDN_BASE + encodeFile(name);
    var html = await fetchText(url);
    return html === null ? null : { html: html, url: url, file: name };
  }

  async function discoverFromDirectory() {
    try {
      var response = await fetch(API_DIR + '&hcf=' + Date.now(), fetchOptions('application/vnd.github+json,application/json;q=0.9,*/*;q=0.1'));
      if (!response.ok) return null;

      var entries = await response.json();
      if (!Array.isArray(entries)) return null;

      var htmlFiles = entries.filter(function (entry) {
        return entry && entry.type === 'file' && /\.html$/i.test(entry.name || '') && entry.download_url;
      });

      var normalizedSlug = normalize(slug);
      var idPrefix = id + '-';
      var best = null;
      var bestScore = -1;

      htmlFiles.forEach(function (entry) {
        var name = String(entry.name || '');
        var stem = name.replace(/\.html$/i, '');
        var normalizedStem = normalize(stem);
        var score = -1;

        if (name === key + '.html') score = 1000;
        else if (name.indexOf(idPrefix) === 0 && normalize(stem.slice(idPrefix.length)) === normalizedSlug) score = 900;
        else if (name.indexOf(idPrefix) === 0) score = 700;
        else if (normalizedStem === normalizedSlug) score = 600;
        else if (normalizedStem.slice(-(normalizedSlug.length + 1)) === '-' + normalizedSlug) score = 500;

        if (score > bestScore) {
          best = entry;
          bestScore = score;
        }
      });

      if (!best || bestScore < 0) return null;

      var html = await fetchText(best.download_url);
      return html === null ? null : { html: html, url: best.download_url, file: best.name };
    } catch (error) {
      return null;
    }
  }

  function resolveUrl(value, sourceUrl) {
    if (!value) return value;
    try { return new URL(value, sourceUrl).href; }
    catch (error) { return value; }
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
      if (/\/hcf-page\.js(?:\?|$)/i.test(resolved)) {
        resolved = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/hcf-page.js?v=1.4.0';
      }

      if (parentDocument.querySelector('script[src="' + resolved.replace(/"/g, '\\"') + '"]')) {
        if (/\/hcf-page\.js(?:\?|$)/i.test(resolved) && parentWindow.HCFPageRuntime && typeof parentWindow.HCFPageRuntime.refresh === 'function') {
          try { parentWindow.HCFPageRuntime.refresh(); } catch (error) {}
        }
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
    timeoutId = parentWindow.setTimeout(function () {
      timedOut = true;
      if (controller) {
        try { controller.abort(); } catch (error) {}
      }
    }, LOAD_TIMEOUT);

    try {
      var result = await tryDirect();
      if (!result && !timedOut) result = await discoverFromDirectory();

      if (!result) {
        showError(timedOut ? 'timeout' : 'not-found');
        return;
      }

      try {
        await renderRemote(result);
      } catch (error) {
        showError('render-failed');
        console.error('[HCF FoF Bootstrap]', error);
      }
    } finally {
      if (timeoutId) parentWindow.clearTimeout(timeoutId);
      try { frame.remove(); } catch (error) {}
    }
  }

  start();
})();