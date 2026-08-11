/* =========================================================
   Harley's Clan Forum — Global FoF Domain Router
   Build: 1.0.0
   Updated: 2026-08-11

   Purpose:
   - Keep forum.harleytg.com as the active forum before cutover.
   - Automatically use harleysclan.freeflarum.com on/after
     October 12, 2026.
   - Immediately prefer FreeFlarum whenever a page is already
     running on harleysclan.freeflarum.com.
   - Rewrite old hard-coded forum URLs added later by FoF/Flarum.
   ========================================================= */
(function () {
  'use strict';

  var OLD_ORIGIN = 'https://forum.harleytg.com';
  var NEW_ORIGIN = 'https://harleysclan.freeflarum.com';
  var CUTOVER_AT = new Date('2026-10-12T00:00:00-07:00');

  var onFreeFlarum = location.hostname.toLowerCase() === 'harleysclan.freeflarum.com';
  var afterCutover = Date.now() >= CUTOVER_AT.getTime();
  var useFreeFlarum = onFreeFlarum || afterCutover;
  var activeOrigin = useFreeFlarum ? NEW_ORIGIN : OLD_ORIGIN;

  function rewriteUrl(value) {
    if (!value || typeof value !== 'string') return value;

    try {
      var url = new URL(value, location.href);

      if (url.origin === OLD_ORIGIN && useFreeFlarum) {
        return NEW_ORIGIN + url.pathname + url.search + url.hash;
      }

      if (url.origin === NEW_ORIGIN && !useFreeFlarum && !onFreeFlarum) {
        return OLD_ORIGIN + url.pathname + url.search + url.hash;
      }
    } catch (e) {}

    return value;
  }

  function rewriteSrcset(value) {
    if (!value || typeof value !== 'string') return value;

    return value
      .split(',')
      .map(function (item) {
        var parts = item.trim().split(/\s+/);
        if (!parts[0]) return item;
        parts[0] = rewriteUrl(parts[0]);
        return parts.join(' ');
      })
      .join(', ');
  }

  function rewriteElement(el) {
    if (!el || el.nodeType !== 1) return;

    var attrs = ['href', 'action', 'src', 'poster'];

    attrs.forEach(function (attr) {
      if (!el.hasAttribute || !el.hasAttribute(attr)) return;
      var current = el.getAttribute(attr);
      var next = rewriteUrl(current);
      if (next !== current) el.setAttribute(attr, next);
    });

    if (el.hasAttribute && el.hasAttribute('srcset')) {
      var currentSrcset = el.getAttribute('srcset');
      var nextSrcset = rewriteSrcset(currentSrcset);
      if (nextSrcset !== currentSrcset) el.setAttribute('srcset', nextSrcset);
    }
  }

  function rewriteTree(root) {
    if (!root) return;

    rewriteElement(root);

    if (!root.querySelectorAll) return;

    root.querySelectorAll('[href],[action],[src],[srcset],[poster]').forEach(rewriteElement);
  }

  function refresh() {
    rewriteTree(document.documentElement);
  }

  window.HCFDomainRouter = {
    build: '1.0.0',
    oldOrigin: OLD_ORIGIN,
    newOrigin: NEW_ORIGIN,
    activeOrigin: activeOrigin,
    cutoverAt: CUTOVER_AT.toISOString(),
    useFreeFlarum: useFreeFlarum,
    rewriteUrl: rewriteUrl,
    refresh: refresh
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once: true });
  } else {
    refresh();
  }

  var queued = false;
  var observer = new MutationObserver(function (mutations) {
    if (queued) return;

    var needsRefresh = mutations.some(function (mutation) {
      return mutation.type === 'childList' || mutation.type === 'attributes';
    });

    if (!needsRefresh) return;

    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      refresh();
    });
  });

  function startObserver() {
    if (!document.documentElement) return;

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'action', 'src', 'srcset', 'poster']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  } else {
    startObserver();
  }
})();
