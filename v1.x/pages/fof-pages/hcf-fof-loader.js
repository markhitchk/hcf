/* =========================================================
   Harley's Clan Forum — Dynamic FoF Pages GitHub Loader
   Build: 1.1.1
   Updated: 2026-08-25

   Install this ONCE in Flarum's global custom footer/header.

   AUTO-DISCOVERY MODE
   -------------------
   The loader does not use a manifest or hard-coded page list.
   It detects the currently rendered FriendsOfFlarum page from
   .Pages[data-id][data-slug] and automatically resolves a GitHub
   HTML file for it.

   Preferred GitHub filename:
     /p/10-help-document -> 10-help-document.html

   If that exact filename does not exist, the loader can inspect
   the public GitHub fof-pages directory and resolve by:
   - FoF page ID prefix, e.g. 10-*.html
   - exact slug, e.g. help-document.html
   - slug suffix, e.g. *-help-document.html

   This means newly-created FoF Pages are detected automatically.
   No manifest, page registration, or loader edit is required.

   Safety / reliability:
   - Existing FoF database HTML stays visible while loading.
   - Missing/network-failed GitHub pages leave FoF HTML untouched.
   - Works with Flarum SPA navigation via MutationObserver.
   - Also refreshes on browser route/navigation events.
   - Re-runs inline/page scripts after remote HTML injection.
   - Common external scripts are normalized and loaded once.
   - GitHub directory discovery is cached to reduce API traffic.
   ========================================================= */
(function () {
  'use strict';

  if (window.HCFFoFPagesLoader) {
    if (typeof window.HCFFoFPagesLoader.refresh === 'function') {
      window.HCFFoFPagesLoader.refresh(true);
    }
    return;
  }

  var BUILD = '1.1.1';
  var RAW_BASE = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/';
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/';
  var DIRECTORY_API = 'https://api.github.com/repos/markhitchk/hcf/contents/v1.x/pages/fof-pages?ref=main';
  var SHARED_RUNTIME_SRC = CDN_BASE + 'hcf-page.js?v=1.4.1';
  var DOMAIN_ROUTER_SRC = CDN_BASE + 'hcf-domain-router.js?v=1.0.1';
  var CACHE_TTL = 30000;
  var MISSING_TTL = 15000;
  var DIRECTORY_TTL = 60000;

  var pageCache = new Map();
  var missingCache = new Map();
  var resolutionCache = new Map();
  var loadedExternalScripts = new Set();
  var activeController = null;
  var refreshQueued = false;
  var requestSerial = 0;
  var directoryCache = {
    time: 0,
    files: []
  };
  var directoryBlockedUntil = 0;

  Array.prototype.forEach.call(document.scripts || [], function (script) {
    if (script.src) loadedExternalScripts.add(script.src);
  });

  function now() {
    return Date.now();
  }

  function absoluteUrl(value) {
    try {
      return new URL(value, location.href).href;
    } catch (error) {
      return String(value || '');
    }
  }

  function encodeFilename(filename) {
    return String(filename || '')
      .split('/')
      .map(function (part) { return encodeURIComponent(part); })
      .join('/');
  }

  function rawUrl(filename) {
    return RAW_BASE + encodeFilename(filename);
  }

  function ensureStylesheet(id, href) {
    if (document.getElementById(id)) return;

    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-hcf-fof-loader-style', BUILD);
    (document.head || document.documentElement).appendChild(link);
  }

  ensureStylesheet(
    'hcf-fof-page-shared-style',
    CDN_BASE + 'hcf-page-v2.1.css?v=2.1'
  );

  ensureStylesheet(
    'hcf-fof-page-runtime-style',
    CDN_BASE + 'hcf-page-runtime.css?v=2.2a3'
  );

  function getContext() {
    var page = document.querySelector('.Pages[data-id][data-slug]');
    if (!page) return null;

    var body = page.querySelector('.Pages-container .Post-body') || page.querySelector('.Post-body');
    if (!body) return null;

    var id = String(page.getAttribute('data-id') || '').trim();
    var slug = String(page.getAttribute('data-slug') || '').trim();

    if (!id || !slug) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(slug)) return null;

    var key = id + '-' + slug;

    return {
      page: page,
      body: body,
      id: id,
      slug: slug,
      key: key,
      filename: key + '.html'
    };
  }

  function hasRemoteMarker(context) {
    var root = context.body.querySelector('[data-hcf-remote-page]');
    return Boolean(root && root.getAttribute('data-hcf-remote-page') === context.key);
  }

  function setState(context, state) {
    if (!context || !context.page) return;
    context.page.setAttribute('data-hcf-remote-state', state);
  }

  function markLoading(context, state) {
    context.page.classList.toggle('hcf-remote-loading', Boolean(state));
    context.body.setAttribute('aria-busy', state ? 'true' : 'false');
    if (state) setState(context, 'loading');
  }

  function markRemoteRoot(context, filename) {
    var root = context.body.firstElementChild;
    if (!root) return;

    root.setAttribute('data-hcf-remote-page', context.key);
    root.setAttribute('data-hcf-remote-file', filename || context.filename);
    root.setAttribute('data-hcf-remote-build', BUILD);
  }

  function getCachedPage(key) {
    var item = pageCache.get(key);
    if (!item) return null;
    if (now() - item.time > CACHE_TTL) {
      pageCache.delete(key);
      return null;
    }
    return item;
  }

  function isRecentlyMissing(key) {
    var time = missingCache.get(key);
    if (!time) return false;
    if (now() - time > MISSING_TTL) {
      missingCache.delete(key);
      return false;
    }
    return true;
  }

  function getCachedResolution(key) {
    var item = resolutionCache.get(key);
    if (!item) return null;
    if (now() - item.time > DIRECTORY_TTL) {
      resolutionCache.delete(key);
      return null;
    }
    return item.file;
  }

  function copyScriptAttributes(from, to) {
    Array.prototype.forEach.call(from.attributes || [], function (attr) {
      if (attr.name.toLowerCase() === 'src') return;
      to.setAttribute(attr.name, attr.value);
    });
  }

  function normalizeSharedScript(src) {
    if (/\/hcf-page\.js(?:\?|$)/i.test(src)) return SHARED_RUNTIME_SRC;
    if (/\/hcf-domain-router\.js(?:\?|$)/i.test(src)) return DOMAIN_ROUTER_SRC;
    return src;
  }

  function executeScript(oldScript) {
    return new Promise(function (resolve) {
      var src = oldScript.getAttribute('src');
      var script = document.createElement('script');
      copyScriptAttributes(oldScript, script);

      if (src) {
        var resolvedSrc = normalizeSharedScript(absoluteUrl(src));

        if (/\/hcf-page\.js(?:\?|$)/i.test(resolvedSrc) && window.HCFPageRuntime) {
          try { window.HCFPageRuntime.refresh(); } catch (error) {}
          resolve();
          return;
        }

        if (/\/hcf-domain-router\.js(?:\?|$)/i.test(resolvedSrc)) {
          if (window.HCFDomainRouter || document.querySelector('script[data-hcf-domain-router]')) {
            resolve();
            return;
          }
        }

        if (loadedExternalScripts.has(resolvedSrc)) {
          resolve();
          return;
        }

        loadedExternalScripts.add(resolvedSrc);
        script.src = resolvedSrc;
        script.async = false;
        script.onload = function () { resolve(); };
        script.onerror = function () {
          loadedExternalScripts.delete(resolvedSrc);
          console.warn('[HCF FoF Loader] Script failed:', resolvedSrc);
          resolve();
        };

        (document.head || document.documentElement).appendChild(script);
        return;
      }

      script.text = oldScript.textContent || '';
      (document.head || document.documentElement).appendChild(script);
      script.remove();
      resolve();
    });
  }

  async function injectRemoteHtml(context, payload) {
    var html = payload && payload.html;
    var filename = payload && payload.filename ? payload.filename : context.filename;
    var template = document.createElement('template');
    template.innerHTML = String(html || '').trim();

    var scripts = Array.prototype.slice.call(template.content.querySelectorAll('script'));
    scripts.forEach(function (script) { script.remove(); });

    if (!template.content.firstElementChild) {
      throw new Error('Remote page contained no renderable HTML.');
    }

    context.body.replaceChildren(template.content.cloneNode(true));
    context.page.classList.add('hcf-remote-active');
    context.page.setAttribute('data-hcf-remote-key', context.key);
    context.page.setAttribute('data-hcf-remote-file', filename);
    setState(context, 'remote');
    markRemoteRoot(context, filename);

    for (var i = 0; i < scripts.length; i++) {
      await executeScript(scripts[i]);
    }

    try {
      window.dispatchEvent(new CustomEvent('hcf:fof-page:loaded', {
        detail: {
          build: BUILD,
          id: context.id,
          slug: context.slug,
          key: context.key,
          filename: filename,
          autoDiscovered: filename !== context.filename
        }
      }));
    } catch (error) {}

    if (window.HCFPageRuntime && typeof window.HCFPageRuntime.refresh === 'function') {
      try { window.HCFPageRuntime.refresh(); } catch (error) {}
    }

    if (window.HCFDomainRouter && typeof window.HCFDomainRouter.refresh === 'function') {
      try { window.HCFDomainRouter.refresh(); } catch (error) {}
    }
  }

  async function fetchDirectory(force) {
    if (!force && directoryCache.files.length && now() - directoryCache.time <= DIRECTORY_TTL) {
      return directoryCache.files;
    }
    if (now() < directoryBlockedUntil) {
      return directoryCache.files;
    }

    try {
      var response = await fetch(DIRECTORY_API + '&hcf=' + now(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Accept': 'application/vnd.github+json,application/json;q=0.9,*/*;q=0.1'
        }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          directoryBlockedUntil = now() + 300000;
        }
        console.warn('[HCF FoF Loader] GitHub directory discovery returned HTTP ' + response.status);
        return directoryCache.files;
      }

      var data = await response.json();
      if (!Array.isArray(data)) return directoryCache.files;

      var files = data
        .filter(function (item) {
          return item && item.type === 'file' && /\.html$/i.test(item.name || '') && !/^install-/i.test(item.name || '');
        })
        .map(function (item) {
          return {
            name: String(item.name || ''),
            downloadUrl: rawUrl(item.name)
          };
        });

      directoryCache = {
        time: now(),
        files: files
      };

      return files;
    } catch (error) {
      console.warn('[HCF FoF Loader] GitHub directory discovery failed:', error);
      return directoryCache.files;
    }
  }

  function scoreFile(context, file) {
    var name = String(file && file.name || '').toLowerCase();
    if (!/\.html$/.test(name)) return -1;

    var base = name.replace(/\.html$/, '');
    var id = context.id.toLowerCase();
    var slug = context.slug.toLowerCase();
    var key = context.key.toLowerCase();

    if (base === key) return 1000;
    if (base === id + '-' + slug) return 990;
    if (base === id) return 950;
    if (base === slug) return 900;

    if (base.indexOf(id + '-') === 0) {
      var suffix = base.slice(id.length + 1);
      if (suffix === slug) return 980;
      return 800;
    }

    if (base.slice(-(slug.length + 1)) === '-' + slug) return 700;
    return -1;
  }

  async function discoverFile(context, force) {
    if (!force) {
      var cached = getCachedResolution(context.key);
      if (cached) return cached;
    }

    var files = await fetchDirectory(Boolean(force));
    if (!files.length) return null;

    var best = null;
    var bestScore = -1;

    files.forEach(function (file) {
      var score = scoreFile(context, file);
      if (score > bestScore) {
        best = file;
        bestScore = score;
      }
    });

    if (!best || bestScore < 0) return null;

    resolutionCache.set(context.key, {
      time: now(),
      file: best
    });

    return best;
  }

  function makeFetchOptions(controller) {
    var options = {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.1'
      }
    };

    if (controller) options.signal = controller.signal;
    return options;
  }

  async function fetchHtml(url, controller) {
    var response;

    try {
      response = await fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 'hcf=' + now(), makeFetchOptions(controller));
    } catch (error) {
      if (error && error.name === 'AbortError') throw error;
      console.warn('[HCF FoF Loader] GitHub fetch failed:', url, error);
      return { ok: false, status: 0, html: null };
    }

    if (!response.ok) {
      return { ok: false, status: response.status, html: null };
    }

    var html = await response.text();
    if (!html || !html.trim()) return { ok: false, status: response.status, html: null };

    return { ok: true, status: response.status, html: html };
  }

  async function fetchRemotePage(context, force) {
    if (!force) {
      var cached = getCachedPage(context.key);
      if (cached) return cached;
      if (isRecentlyMissing(context.key)) return null;
    }

    if (activeController) {
      try { activeController.abort(); } catch (error) {}
    }

    activeController = typeof AbortController === 'function' ? new AbortController() : null;
    var controller = activeController;

    // Fast path: no directory API call for the normal {id}-{slug}.html convention.
    var direct = await fetchHtml(rawUrl(context.filename), controller);
    if (direct.ok) {
      var directPayload = {
        html: direct.html,
        filename: context.filename,
        url: rawUrl(context.filename),
        time: now()
      };
      pageCache.set(context.key, directPayload);
      missingCache.delete(context.key);
      resolutionCache.set(context.key, {
        time: now(),
        file: { name: context.filename, downloadUrl: directPayload.url }
      });
      return directPayload;
    }

    if (direct.status !== 404 && direct.status !== 0) {
      console.warn('[HCF FoF Loader] GitHub returned HTTP ' + direct.status + ' for ' + context.key);
      return null;
    }

    // Dynamic fallback: inspect the GitHub directory and resolve by ID/slug.
    var discovered = await discoverFile(context, Boolean(force));
    if (discovered) {
      var discoveredUrl = discovered.downloadUrl || rawUrl(discovered.name);

      // Avoid fetching the exact failed direct URL twice.
      if (discovered.name !== context.filename || discoveredUrl !== rawUrl(context.filename)) {
        var result = await fetchHtml(discoveredUrl, controller);
        if (result.ok) {
          var discoveredPayload = {
            html: result.html,
            filename: discovered.name,
            url: discoveredUrl,
            time: now()
          };
          pageCache.set(context.key, discoveredPayload);
          missingCache.delete(context.key);
          return discoveredPayload;
        }
      }
    }

    missingCache.set(context.key, now());
    return null;
  }

  async function refresh(force) {
    var context = getContext();
    if (!context) return;

    if (!force && hasRemoteMarker(context)) return;

    var serial = ++requestSerial;
    markLoading(context, true);

    try {
      var payload = await fetchRemotePage(context, Boolean(force));
      if (!payload) {
        setState(context, 'local');
        try {
          window.dispatchEvent(new CustomEvent('hcf:fof-page:local', {
            detail: {
              build: BUILD,
              id: context.id,
              slug: context.slug,
              key: context.key
            }
          }));
        } catch (error) {}
        return;
      }

      var latest = getContext();
      if (!latest || latest.key !== context.key || latest.body !== context.body) return;
      if (serial !== requestSerial) return;

      await injectRemoteHtml(latest, payload);
    } catch (error) {
      if (!error || error.name !== 'AbortError') {
        console.warn('[HCF FoF Loader] Remote page render failed:', error);
      }
    } finally {
      var current = getContext();
      if (current && current.key === context.key) markLoading(current, false);
    }
  }

  function queueRefresh(force) {
    if (refreshQueued && !force) return;
    refreshQueued = true;

    var run = function () {
      refreshQueued = false;
      refresh(Boolean(force));
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
    }
  }

  var observer = new MutationObserver(function () {
    queueRefresh(false);
  });

  function routeRefresh() {
    queueRefresh(false);
  }

  function start() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'data-slug']
    });

    window.addEventListener('popstate', routeRefresh, { passive: true });
    window.addEventListener('hashchange', routeRefresh, { passive: true });
    window.addEventListener('pageshow', routeRefresh, { passive: true });

    queueRefresh(false);
  }

  window.HCFFoFPagesLoader = {
    build: BUILD,
    mode: 'auto-discovery',
    rawBase: RAW_BASE,
    directoryApi: DIRECTORY_API,
    refresh: function (force) { return refresh(Boolean(force)); },
    discover: async function (force) {
      var context = getContext();
      if (!context) return null;
      var file = await discoverFile(context, Boolean(force));
      return file ? {
        id: context.id,
        slug: context.slug,
        filename: file.name,
        url: file.downloadUrl
      } : null;
    },
    clearCache: function () {
      pageCache.clear();
      missingCache.clear();
      resolutionCache.clear();
      directoryCache = { time: 0, files: [] };
    },
    getCurrentPage: function () {
      var context = getContext();
      if (!context) return null;
      var resolution = getCachedResolution(context.key);
      return {
        id: context.id,
        slug: context.slug,
        key: context.key,
        preferredFilename: context.filename,
        resolvedFilename: resolution ? resolution.name : null,
        state: context.page.getAttribute('data-hcf-remote-state') || 'unknown'
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
