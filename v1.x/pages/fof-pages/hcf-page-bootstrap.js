/* =========================================================
   Harley's Clan Forum — FoF Page srcdoc Bootstrap
   Build: 1.2.1
   Updated: 2026-08-11

   Shared loader for v1.x FriendsOfFlarum Pages.
   - Lightweight loading UI with mobile-safe animation behavior
   - Exact route filenames with optional aliases for true mismatches
   - Direct CDN load with GitHub directory fallback
   - Detailed but user-friendly error classification
   - Retry without forcing a full page reload
   - Network, timeout, rate-limit, empty-file, and render protection
   - Remote page styles/scripts preserved
   ========================================================= */
(function () {
  'use strict';

  var BUILD = '1.2.1';
  var OWNER = 'markhitchk';
  var REPO = 'hcf';
  var BRANCH = 'main';
  var FOLDER = 'v1.x/pages/fof-pages';
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + BRANCH + '/' + FOLDER + '/';
  var API_DIR = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FOLDER + '?ref=' + encodeURIComponent(BRANCH);

  /* Keep this below the 10-second HTML-side emergency fallback. */
  var LOAD_TIMEOUT = 8500;

  /* Add entries only when a FoF route intentionally differs from its source filename. */
  var ROUTE_FILES = {};

  var ERROR_COPY = {
    'invalid-route': {
      title: 'Page link is invalid',
      message: 'The forum could not determine which page file to open.',
      code: 'HCF-PAGE-ROUTE'
    },
    'offline': {
      title: 'You appear to be offline',
      message: 'Reconnect to the internet, then try loading this page again.',
      code: 'HCF-PAGE-OFFLINE'
    },
    'timeout': {
      title: 'Page took too long to load',
      message: 'The page service did not respond in time. This is usually temporary.',
      code: 'HCF-PAGE-TIMEOUT'
    },
    'not-found': {
      title: 'Page file not found',
      message: 'The page file could not be found. It may have been removed, renamed, or moved.',
      code: 'HCF-PAGE-404'
    },
    'rate-limited': {
      title: 'Page service is busy',
      message: 'GitHub temporarily limited page requests. Please try again shortly.',
      code: 'HCF-PAGE-429'
    },
    'upstream-error': {
      title: 'Page service unavailable',
      message: 'The remote page service returned an error. Please try again shortly.',
      code: 'HCF-PAGE-UPSTREAM'
    },
    'network-error': {
      title: 'Network error',
      message: 'The forum could not reach the page service. Check your connection and try again.',
      code: 'HCF-PAGE-NETWORK'
    },
    'empty-file': {
      title: 'Page file is empty',
      message: 'The page file exists, but it does not contain any displayable content.',
      code: 'HCF-PAGE-EMPTY'
    },
    'render-failed': {
      title: 'Page could not be displayed',
      message: 'The page file was found, but the browser could not render it correctly.',
      code: 'HCF-PAGE-RENDER'
    },
    'unavailable': {
      title: 'Page unavailable',
      message: 'This page could not be loaded right now. Please try again.',
      code: 'HCF-PAGE-UNAVAILABLE'
    }
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
  var runToken = 0;
  var controller = null;
  var timeoutId = 0;
  var timedOut = false;

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
      '.hcf-page-import-error-title{margin:0 0 8px;font-size:17px;color:#ff6b6b}' +
      '.hcf-page-import-error-text{max-width:560px;margin:0 auto;color:#c0ccd2;font-size:13px;line-height:1.55}' +
      '.hcf-page-import-error-code{margin-top:9px;color:#788991;font:11px/1.4 "Courier New",monospace}' +
      '.hcf-page-import-error-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:15px}' +
      '.hcf-page-import-error-button{padding:8px 14px;border:0;border-radius:5px;background:#00b8f0;color:#001217;font:700 12px Arial,sans-serif;cursor:pointer}' +
      '.hcf-page-import-error-button.is-secondary{background:#283138;color:#d8e5eb;border:1px solid #42515a}' +
      '@keyframes hcfFofLoad{to{transform:translateX(315%)}}' +
      '@media(max-width:767.98px){[data-hcf-fof-import-root]{margin:12px auto;padding:17px 14px}.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}}' +
      '@media(prefers-reduced-motion:reduce){.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}}';

    (parentDocument.head || parentDocument.documentElement).appendChild(style);
  }

  function dispatch(name, detail) {
    try {
      parentWindow.dispatchEvent(new parentWindow.CustomEvent(name, { detail: detail }));
    } catch (error) {}
  }

  function showLoading() {
    installLoaderStyle();
    root.setAttribute('aria-busy', 'true');
    root.removeAttribute('data-hcf-error');
    root.removeAttribute('data-hcf-error-code');
    root.removeAttribute('data-hcf-loaded');
    root.innerHTML =
      '<div class="hcf-page-import-status">Loading page…</div>' +
      '<div class="hcf-page-import-subtext">Harley\'s Clan Forum</div>' +
      '<div class="hcf-page-loader-track" aria-hidden="true"><div class="hcf-page-loader-bar"></div></div>';
  }

  function showError(type, extra) {
    installLoaderStyle();

    var errorType = ERROR_COPY[type] ? type : 'unavailable';
    var copy = ERROR_COPY[errorType];
    var errorCode = copy.code;

    if (extra && extra.status && errorType === 'upstream-error') {
      errorCode += '-' + String(extra.status);
    }

    root.setAttribute('aria-busy', 'false');
    root.setAttribute('data-hcf-error', errorType);
    root.setAttribute('data-hcf-error-code', errorCode);

    root.innerHTML =
      '<div class="hcf-page-import-error" role="alert">' +
        '<h2 class="hcf-page-import-error-title">' + copy.title + '</h2>' +
        '<p class="hcf-page-import-error-text">' + copy.message + '</p>' +
        '<div class="hcf-page-import-error-code">Reference: ' + errorCode + '</div>' +
        '<div class="hcf-page-import-error-actions">' +
          '<button class="hcf-page-import-error-button" type="button" data-hcf-page-retry>Retry</button>' +
          '<button class="hcf-page-import-error-button is-secondary" type="button" data-hcf-page-back>Go back</button>' +
        '</div>' +
      '</div>';

    var retry = root.querySelector('[data-hcf-page-retry]');
    var back = root.querySelector('[data-hcf-page-back]');

    if (retry) {
      retry.addEventListener('click', function () {
        try { parentWindow.location.reload(); } catch (error) {}
      });
    }

    if (back) {
      back.addEventListener('click', function () {
        try {
          if (parentWindow.history.length > 1) parentWindow.history.back();
          else parentWindow.location.href = parentWindow.location.origin + '/';
        } catch (error) {}
      });
    }

    dispatch('hcf:fof-page:error', {
      build: BUILD,
      id: id,
      slug: slug,
      key: key,
      type: errorType,
      code: errorCode,
      status: extra && extra.status ? extra.status : null,
      source: extra && extra.source ? extra.source : null
    });

    console.warn('[HCF FoF Bootstrap] ' + errorCode + ' for ' + (key || '(unknown page)'));
  }

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

  function classifyStatus(status) {
    if (status === 404) return 'not-found';
    if (status === 403 || status === 429) return 'rate-limited';
    if (status >= 500) return 'upstream-error';
    if (status >= 400) return 'upstream-error';
    return 'unavailable';
  }

  async function requestText(url, accept) {
    if (parentWindow.navigator && parentWindow.navigator.onLine === false) {
      return { ok: false, type: 'offline', status: 0, source: url };
    }

    try {
      var bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + Date.now();
      var response = await fetch(bust, fetchOptions(accept || 'text/html,text/plain;q=0.9,*/*;q=0.1'));

      if (!response.ok) {
        return {
          ok: false,
          type: classifyStatus(response.status),
          status: response.status,
          source: url
        };
      }

      var text = await response.text();
      if (!text || !text.trim()) {
        return { ok: false, type: 'empty-file', status: response.status, source: url };
      }

      return { ok: true, text: text, status: response.status, source: url };
    } catch (error) {
      if (timedOut || (error && error.name === 'AbortError')) {
        return { ok: false, type: 'timeout', status: 0, source: url };
      }

      if (parentWindow.navigator && parentWindow.navigator.onLine === false) {
        return { ok: false, type: 'offline', status: 0, source: url };
      }

      return { ok: false, type: 'network-error', status: 0, source: url };
    }
  }

  function chooseUsefulError(primary, fallback) {
    var rank = {
      'offline': 100,
      'timeout': 90,
      'rate-limited': 80,
      'network-error': 70,
      'upstream-error': 60,
      'empty-file': 50,
      'not-found': 10,
      'unavailable': 0
    };

    if (!primary) return fallback;
    if (!fallback) return primary;
    return (rank[fallback.type] || 0) > (rank[primary.type] || 0) ? fallback : primary;
  }

  async function tryDirect() {
    var name = ROUTE_FILES[key] || (key + '.html');
    var url = CDN_BASE + encodeFile(name);
    var result = await requestText(url);

    if (!result.ok) return { result: null, error: result };
    return {
      result: { html: result.text, url: url, file: name, sourceKind: 'cdn' },
      error: null
    };
  }

  async function discoverFromDirectory() {
    var directory = await requestText(API_DIR, 'application/vnd.github+json,application/json;q=0.9,*/*;q=0.1');
    if (!directory.ok) return { result: null, error: directory };

    var entries;
    try {
      entries = JSON.parse(directory.text);
    } catch (error) {
      return { result: null, error: { type: 'upstream-error', status: 200, source: API_DIR } };
    }

    if (!Array.isArray(entries)) {
      return { result: null, error: { type: 'upstream-error', status: 200, source: API_DIR } };
    }

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
      else if (normalizedStem === normalizedSlug) score = 600;
      else if (normalizedStem.slice(-(normalizedSlug.length + 1)) === '-' + normalizedSlug) score = 500;

      if (score > bestScore) {
        best = entry;
        bestScore = score;
      }
    });

    if (!best || bestScore < 0) {
      return { result: null, error: { type: 'not-found', status: 404, source: API_DIR } };
    }

    var fileResult = await requestText(best.download_url);
    if (!fileResult.ok) return { result: null, error: fileResult };

    return {
      result: { html: fileResult.text, url: best.download_url, file: best.name, sourceKind: 'github' },
      error: null
    };
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
        resolve(true);
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
        resolve(true);
        return;
      }

      script.src = resolved;
      script.async = false;
      script.onload = function () { resolve(true); };
      script.onerror = function () {
        console.warn('[HCF FoF Bootstrap] Optional page script failed:', resolved);
        resolve(false);
      };
      (parentDocument.head || parentDocument.documentElement).appendChild(script);
    });
  }

  async function renderRemote(result) {
    var parser = new DOMParser();
    var parsed = parser.parseFromString(result.html, 'text/html');

    if (!parsed || !parsed.body) {
      var parseError = new Error('Remote HTML could not be parsed.');
      parseError.hcfType = 'render-failed';
      throw parseError;
    }

    fixRelativeAssets(parsed, result.url);

    var scripts = Array.prototype.slice.call(parsed.querySelectorAll('script'));
    scripts.forEach(function (script) { script.remove(); });

    removePreviousAssets();
    installStyles(parsed, result.url);

    var nodes = Array.prototype.slice.call(parsed.body.childNodes).map(function (node) {
      return parentDocument.importNode(node, true);
    });

    var hasDisplayableContent = nodes.some(function (node) {
      if (node.nodeType === 1) return true;
      if (node.nodeType === 3) return Boolean(String(node.textContent || '').trim());
      return false;
    });

    if (!hasDisplayableContent) {
      var emptyError = new Error('Remote HTML had no displayable body content.');
      emptyError.hcfType = 'empty-file';
      throw emptyError;
    }

    root.replaceChildren.apply(root, nodes);
    root.setAttribute('data-hcf-source-file', result.file);
    root.setAttribute('data-hcf-source-url', result.url);
    root.setAttribute('data-hcf-source-kind', result.sourceKind || 'unknown');
    root.setAttribute('data-hcf-loaded', 'true');
    root.setAttribute('aria-busy', 'false');

    var failedScripts = 0;
    for (var i = 0; i < scripts.length; i++) {
      if (!(await runScript(scripts[i], result.url))) failedScripts++;
    }

    dispatch('hcf:fof-page:loaded', {
      build: BUILD,
      id: id,
      slug: slug,
      file: result.file,
      source: result.url,
      sourceKind: result.sourceKind || 'unknown',
      scriptWarnings: failedScripts
    });

    console.info('[HCF FoF Bootstrap] Loaded ' + result.file + ' for ' + key + (failedScripts ? ' with ' + failedScripts + ' script warning(s)' : ''));
  }

  async function start() {
    var token = ++runToken;

    if (!id || !slug) {
      showError('invalid-route');
      return;
    }

    if (timeoutId) parentWindow.clearTimeout(timeoutId);
    if (controller) {
      try { controller.abort(); } catch (error) {}
    }

    controller = typeof AbortController === 'function' ? new AbortController() : null;
    timedOut = false;
    root.setAttribute('data-hcf-page', key);
    showLoading();

    timeoutId = parentWindow.setTimeout(function () {
      timedOut = true;
      if (controller) {
        try { controller.abort(); } catch (error) {}
      }
    }, LOAD_TIMEOUT);

    var bestError = null;

    try {
      var direct = await tryDirect();
      if (token !== runToken) return;

      if (direct.result) {
        await renderRemote(direct.result);
        return;
      }

      bestError = chooseUsefulError(bestError, direct.error);

      if (!timedOut && direct.error && direct.error.type !== 'offline') {
        var discovered = await discoverFromDirectory();
        if (token !== runToken) return;

        if (discovered.result) {
          await renderRemote(discovered.result);
          return;
        }

        bestError = chooseUsefulError(bestError, discovered.error);
      }

      if (token === runToken) {
        showError(timedOut ? 'timeout' : (bestError && bestError.type) || 'unavailable', bestError);
      }
    } catch (error) {
      if (token === runToken) {
        showError(error && error.hcfType ? error.hcfType : 'render-failed');
      }
      console.error('[HCF FoF Bootstrap]', error);
    } finally {
      if (timeoutId) {
        parentWindow.clearTimeout(timeoutId);
        timeoutId = 0;
      }
    }
  }

  /* Remove the hidden srcdoc iframe only after the async loader finishes or errors. */
  start().finally(function () {
    try { frame.remove(); } catch (error) {}
  });
})();
