/* =========================================================
   Harley's Clan Forum — Dynamic FoF Pages GitHub Loader
   Build: 1.0.1
   Updated: 2026-08-11

   Install this ONCE in Flarum's global custom footer/header.
   It detects FriendsOfFlarum Pages by .Pages[data-id][data-slug],
   fetches the matching GitHub HTML file, and replaces only the
   FoF page body after a successful fetch.

   GitHub file convention:
     /p/10-help-document -> 10-help-document.html

   Safety / reliability:
   - Existing FoF database HTML stays visible while loading.
   - A 404/network failure leaves the saved FoF HTML untouched.
   - Works with Flarum SPA navigation via MutationObserver.
   - Re-runs inline/page scripts after remote HTML injection.
   - Common external scripts are normalized and loaded once.
   ========================================================= */
(function () {
  'use strict';

  if (window.HCFFoFPagesLoader) {
    if (typeof window.HCFFoFPagesLoader.refresh === 'function') {
      window.HCFFoFPagesLoader.refresh(true);
    }
    return;
  }

  var BUILD = '1.0.1';
  var RAW_BASE = 'https://raw.githubusercontent.com/markhitchk/hcf/main/v1.x/pages/fof-pages/';
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/';
  var SHARED_RUNTIME_SRC = CDN_BASE + 'hcf-page.js?v=1.2.0';
  var DOMAIN_ROUTER_SRC = CDN_BASE + 'hcf-domain-router.js?v=1.0.1';
  var CACHE_TTL = 30000;

  var pageCache = new Map();
  var missingCache = new Map();
  var loadedExternalScripts = new Set();
  var activeController = null;
  var refreshQueued = false;
  var requestSerial = 0;

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

  function markLoading(context, state) {
    context.page.classList.toggle('hcf-remote-loading', Boolean(state));
    context.body.setAttribute('aria-busy', state ? 'true' : 'false');
  }

  function markRemoteRoot(context) {
    var root = context.body.firstElementChild;
    if (!root) return;

    root.setAttribute('data-hcf-remote-page', context.key);
    root.setAttribute('data-hcf-remote-build', BUILD);
  }

  function getCachedPage(key) {
    var item = pageCache.get(key);
    if (!item) return null;
    if (now() - item.time > CACHE_TTL) {
      pageCache.delete(key);
      return null;
    }
    return item.html;
  }

  function isRecentlyMissing(key) {
    var time = missingCache.get(key);
    if (!time) return false;
    if (now() - time > CACHE_TTL) {
      missingCache.delete(key);
      return false;
    }
    return true;
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

  async function injectRemoteHtml(context, html) {
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
    markRemoteRoot(context);

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
          filename: context.filename
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

    var url = RAW_BASE + encodeURIComponent(context.filename) + '?hcf=' + now();
    var options = {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.1'
      }
    };

    if (activeController) options.signal = activeController.signal;

    var response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      if (error && error.name === 'AbortError') throw error;
      console.warn('[HCF FoF Loader] GitHub fetch failed for', context.key, error);
      return null;
    }

    if (response.status === 404) {
      missingCache.set(context.key, now());
      return null;
    }

    if (!response.ok) {
      console.warn('[HCF FoF Loader] GitHub returned HTTP ' + response.status + ' for ' + context.key);
      return null;
    }

    var html = await response.text();
    if (!html || !html.trim()) return null;

    pageCache.set(context.key, { html: html, time: now() });
    missingCache.delete(context.key);
    return html;
  }

  async function refresh(force) {
    var context = getContext();
    if (!context) return;

    if (!force && hasRemoteMarker(context)) return;

    var serial = ++requestSerial;
    markLoading(context, true);

    try {
      var html = await fetchRemotePage(context, Boolean(force));
      if (!html) return;

      var latest = getContext();
      if (!latest || latest.key !== context.key || latest.body !== context.body) return;
      if (serial !== requestSerial) return;

      await injectRemoteHtml(latest, html);
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

  function start() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'data-slug']
    });

    queueRefresh(false);
  }

  window.HCFFoFPagesLoader = {
    build: BUILD,
    rawBase: RAW_BASE,
    refresh: function (force) { return refresh(Boolean(force)); },
    clearCache: function () {
      pageCache.clear();
      missingCache.clear();
    },
    getCurrentPage: function () {
      var context = getContext();
      return context ? {
        id: context.id,
        slug: context.slug,
        key: context.key,
        filename: context.filename
      } : null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
