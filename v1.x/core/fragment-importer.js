/* =========================================================
   HARLEY'S CLAN FORUM — CORE FRAGMENT IMPORTER
   Loads the canonical body-only header/footer fragments from
   jsDelivr while preserving markup, styles, relative assets,
   and sequential script execution.
   Version: 1.0
   Updated: 2026-08-25
========================================================= */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var kind = String(script.getAttribute('data-hcf-fragment') || '').toLowerCase();
  if (kind !== 'header' && kind !== 'footer') {
    console.warn('[HCF Fragment Importer] Missing data-hcf-fragment="header" or "footer".');
    return;
  }

  var registry = window.HCFCoreFragmentImports = window.HCFCoreFragmentImports || {};
  if (registry[kind]) return;
  registry[kind] = 'loading';

  var base = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/core/';
  var fragmentUrl = base + kind + '.html';
  var anchor = script;
  var parent = anchor.parentNode;

  function absolute(value) {
    try {
      return new URL(value, fragmentUrl).href;
    } catch (error) {
      return value;
    }
  }

  function isRelativeAsset(value) {
    var text = String(value || '').trim();
    return !!text &&
      text.charAt(0) !== '#' &&
      !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(text);
  }

  function rewriteCssUrls(css) {
    return String(css || '')
      .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, function (match, quote, value) {
        if (!isRelativeAsset(value)) return match;
        var resolved = absolute(value);
        return 'url("' + resolved.replace(/"/g, '%22') + '")';
      })
      .replace(/@import\s+(['"])([^'"]+)\1/gi, function (match, quote, value) {
        if (!isRelativeAsset(value)) return match;
        return '@import url("' + absolute(value).replace(/"/g, '%22') + '")';
      });
  }

  function rewriteAssets(root) {
    var attributes = ['src', 'href', 'poster', 'action', 'formaction'];
    Array.prototype.forEach.call(root.querySelectorAll('*'), function (element) {
      attributes.forEach(function (name) {
        if (!element.hasAttribute(name)) return;
        var value = element.getAttribute(name);
        if (isRelativeAsset(value)) element.setAttribute(name, absolute(value));
      });

      if (element.hasAttribute('srcset')) {
        var srcset = element.getAttribute('srcset').split(',').map(function (candidate) {
          var parts = candidate.trim().split(/\s+/);
          if (parts[0] && isRelativeAsset(parts[0])) parts[0] = absolute(parts[0]);
          return parts.join(' ');
        }).join(', ');
        element.setAttribute('srcset', srcset);
      }

      if (element.hasAttribute('style')) {
        element.setAttribute('style', rewriteCssUrls(element.getAttribute('style')));
      }
    });

    Array.prototype.forEach.call(root.querySelectorAll('style'), function (style) {
      style.textContent = rewriteCssUrls(style.textContent);
    });
  }

  function copyScriptAttributes(source, target) {
    Array.prototype.forEach.call(source.attributes || [], function (attribute) {
      if (attribute.name === 'src') return;
      target.setAttribute(attribute.name, attribute.value);
    });
  }

  function runScript(source) {
    return new Promise(function (resolve) {
      var next = document.createElement('script');
      copyScriptAttributes(source, next);

      if (source.src) {
        next.src = absolute(source.getAttribute('src') || source.src);
        next.async = false;
        next.onload = function () { resolve(); };
        next.onerror = function () {
          console.warn('[HCF Fragment Importer] Script failed:', next.src);
          resolve();
        };
      } else {
        next.text = source.textContent || '';
      }

      var targetParent = parent && parent.isConnected ? parent : document.body;
      if (targetParent) {
        targetParent.insertBefore(next, anchor && anchor.parentNode === targetParent ? anchor : null);
      } else {
        document.documentElement.appendChild(next);
      }

      if (!source.src) {
        next.remove();
        resolve();
      }
    });
  }

  fetch(fragmentUrl, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
    headers: { 'Accept': 'text/html,*/*;q=0.8' }
  })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function (html) {
      var template = document.createElement('template');
      template.innerHTML = html;

      if (template.content.querySelector('html,head,body')) {
        throw new Error('Fragment must remain body-only.');
      }

      rewriteAssets(template.content);

      var scripts = Array.prototype.slice.call(template.content.querySelectorAll('script'));
      scripts.forEach(function (item) { item.remove(); });

      var targetParent = parent && parent.isConnected ? parent : document.body;
      if (!targetParent) throw new Error('No insertion target.');

      targetParent.insertBefore(
        template.content.cloneNode(true),
        anchor && anchor.parentNode === targetParent ? anchor : null
      );

      return scripts.reduce(function (chain, item) {
        return chain.then(function () { return runScript(item); });
      }, Promise.resolve());
    })
    .then(function () {
      registry[kind] = 'done';
      try {
        window.dispatchEvent(new CustomEvent('hcf:core-fragment:loaded', {
          detail: { fragment: kind, url: fragmentUrl }
        }));
      } catch (error) {}
    })
    .catch(function (error) {
      registry[kind] = 'failed';
      console.warn('[HCF Fragment Importer] ' + kind + ' import failed:', error);
    });
})();
