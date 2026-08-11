/* =========================================================
   HCF Dynamic Pages — Forum runtime
   Build: 1.0.0
   Flarum 1.x / FriendsOfFlarum Pages 1.x
========================================================= */
(function () {
  'use strict';

  if (window.HCFDynamicPages) return;

  var BUILD = '1.0.0';
  var MARKER_SELECTOR = 'template[data-hcf-dynamic-page]';
  var CACHE_TTL = 60000;
  var cache = new Map();
  var loadedScripts = new Set();
  var queued = false;

  Array.prototype.forEach.call(document.scripts || [], function (script) {
    if (script.src) loadedScripts.add(script.src);
  });

  function encodePath(path) {
    return String(path || '')
      .split('/')
      .filter(Boolean)
      .map(function (part) { return encodeURIComponent(part); })
      .join('/');
  }

  function rawUrl(repository, branch, folder, filename) {
    var repo = String(repository || '').trim().replace(/^\/+|\/+$/g, '');
    var ref = encodeURIComponent(String(branch || 'main').trim());
    var path = encodePath(folder);
    return 'https://raw.githubusercontent.com/' + repo + '/' + ref + '/' + (path ? path + '/' : '') + encodeURIComponent(filename);
  }

  function readConfig(marker) {
    return {
      enabled: marker.getAttribute('data-enabled') === 'true',
      mode: marker.getAttribute('data-mode') === 'url' ? 'url' : 'auto',
      repository: marker.getAttribute('data-repository') || 'markhitchk/hcf',
      branch: marker.getAttribute('data-branch') || 'main',
      folder: marker.getAttribute('data-folder') || 'v1.x/pages/fof-pages',
      url: marker.getAttribute('data-url') || ''
    };
  }

  function sourceCandidates(config, id, slug) {
    if (config.mode === 'url') return config.url ? [config.url.trim()] : [];

    var list = [];
    if (id && slug) list.push(rawUrl(config.repository, config.branch, config.folder, id + '-' + slug + '.html'));
    if (slug) list.push(rawUrl(config.repository, config.branch, config.folder, slug + '.html'));
    if (id) list.push(rawUrl(config.repository, config.branch, config.folder, id + '.html'));
    return list;
  }

  function cached(url) {
    var item = cache.get(url);
    if (!item) return null;
    if (Date.now() - item.time > CACHE_TTL) {
      cache.delete(url);
      return null;
    }
    return item.html;
  }

  async function fetchHtml(url) {
    var existing = cached(url);
    if (existing !== null) return existing;

    var parsed;
    try {
      parsed = new URL(url, location.href);
    } catch (error) {
      return null;
    }

    if (parsed.protocol !== 'https:') return null;

    try {
      var response = await fetch(parsed.href, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'text/html,text/plain;q=0.9,*/*;q=0.1' }
      });
      if (!response.ok) return null;
      var html = await response.text();
      if (!html || !html.trim()) return null;
      cache.set(parsed.href, { html: html, time: Date.now() });
      return html;
    } catch (error) {
      return null;
    }
  }

  async function resolveSource(candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var html = await fetchHtml(candidates[i]);
      if (html !== null) return { url: candidates[i], html: html };
    }
    return null;
  }

  function normalizeRemoteHtml(html) {
    var source = String(html || '');
    if (!/<(?:html|head|body)\b/i.test(source)) return source;

    try {
      var doc = new DOMParser().parseFromString(source, 'text/html');
      var headAssets = Array.prototype.map.call(
        doc.head.querySelectorAll('style,link[rel="stylesheet"],script'),
        function (node) { return node.outerHTML; }
      ).join('\n');
      return headAssets + '\n' + doc.body.innerHTML;
    } catch (error) {
      return source;
    }
  }

  function absoluteUrl(value) {
    try {
      return new URL(value, location.href).href;
    } catch (error) {
      return String(value || '');
    }
  }

  function copyScriptAttributes(from, to) {
    Array.prototype.forEach.call(from.attributes || [], function (attribute) {
      if (attribute.name.toLowerCase() === 'src') return;
      to.setAttribute(attribute.name, attribute.value);
    });
  }

  function runScript(oldScript) {
    return new Promise(function (resolve) {
      var script = document.createElement('script');
      var src = oldScript.getAttribute('src');
      copyScriptAttributes(oldScript, script);

      if (src) {
        var resolved = absoluteUrl(src);
        if (loadedScripts.has(resolved)) {
          resolve();
          return;
        }

        loadedScripts.add(resolved);
        script.src = resolved;
        script.async = false;
        script.onload = function () { resolve(); };
        script.onerror = function () {
          loadedScripts.delete(resolved);
          console.warn('[HCF Dynamic Pages] Script failed:', resolved);
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

  async function inject(body, html) {
    var source = normalizeRemoteHtml(html);
    var holder = document.createElement('template');
    holder.innerHTML = source.trim();

    var scripts = Array.prototype.slice.call(holder.content.querySelectorAll('script'));
    scripts.forEach(function (script) { script.remove(); });

    if (!holder.content.firstChild) throw new Error('Remote HTML is empty.');

    body.replaceChildren(holder.content.cloneNode(true));

    for (var i = 0; i < scripts.length; i++) {
      await runScript(scripts[i]);
    }
  }

  async function processPage(page) {
    if (!page) return;

    var body = page.querySelector('.Pages-container .Post-body') || page.querySelector('.Post-body');
    if (!body) return;

    var marker = body.querySelector(MARKER_SELECTOR);
    if (!marker) return;

    var config = readConfig(marker);
    if (!config.enabled) return;

    var id = String(page.getAttribute('data-id') || '').trim();
    var slug = String(page.getAttribute('data-slug') || '').trim();
    if (!id || !slug) return;

    var key = id + '-' + slug;
    if (body.getAttribute('data-hcf-dynamic-key') === key) return;
    if (body.getAttribute('data-hcf-dynamic-loading') === key) return;

    body.setAttribute('data-hcf-dynamic-loading', key);
    page.classList.add('HCFDynamicPages-loading');

    try {
      var result = await resolveSource(sourceCandidates(config, id, slug));
      if (!result) {
        page.classList.add('HCFDynamicPages-fallback');
        page.classList.remove('HCFDynamicPages-loading');
        body.removeAttribute('data-hcf-dynamic-loading');
        return;
      }

      var currentPage = document.querySelector('.Pages[data-id="' + CSS.escape(id) + '"][data-slug="' + CSS.escape(slug) + '"]');
      if (currentPage !== page || !document.documentElement.contains(body)) return;

      await inject(body, result.html);
      body.setAttribute('data-hcf-dynamic-key', key);
      body.setAttribute('data-hcf-dynamic-source', result.url);
      body.removeAttribute('data-hcf-dynamic-loading');
      page.classList.remove('HCFDynamicPages-loading', 'HCFDynamicPages-fallback');
      page.classList.add('HCFDynamicPages-active');

      try {
        window.dispatchEvent(new CustomEvent('hcf:dynamic-page:loaded', {
          detail: { build: BUILD, id: id, slug: slug, source: result.url }
        }));
      } catch (error) {}
    } catch (error) {
      body.removeAttribute('data-hcf-dynamic-loading');
      page.classList.remove('HCFDynamicPages-loading');
      page.classList.add('HCFDynamicPages-fallback');
      console.warn('[HCF Dynamic Pages] Falling back to FoF HTML for ' + key, error);
    }
  }

  function scan() {
    var pages = document.querySelectorAll('.Pages[data-id][data-slug]');
    for (var i = 0; i < pages.length; i++) processPage(pages[i]);
  }

  function queueScan() {
    if (queued) return;
    queued = true;
    var run = function () {
      queued = false;
      scan();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  var observer = new MutationObserver(queueScan);

  function start() {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'data-slug']
    });
    queueScan();
  }

  window.HCFDynamicPages = {
    build: BUILD,
    refresh: queueScan,
    clearCache: function () { cache.clear(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
