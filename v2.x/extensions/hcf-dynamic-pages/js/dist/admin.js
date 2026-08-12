/* HCF Dynamic Pages — Admin runtime | Flarum 2.x | Build 2.0.0-rc1 */
(function () {
  'use strict';
  if (window.HCFDynamicPagesAdmin) return;

  var BUILD = '2.0.0-rc1';
  var DEFAULTS = {
    enabled: false,
    mode: 'auto',
    repository: 'markhitchk/hcf',
    branch: 'main',
    folder: 'v2.x/pages/fof-pages',
    url: ''
  };

  function defaults() { return Object.assign({}, DEFAULTS); }

  function markerConfig(html) {
    var value = defaults();
    var holder = document.createElement('template');
    holder.innerHTML = String(html || '');
    var marker = holder.content.querySelector('template[data-hcf-dynamic-page]');
    if (!marker) return value;
    value.enabled = marker.getAttribute('data-enabled') === 'true';
    value.mode = marker.getAttribute('data-mode') === 'url' ? 'url' : 'auto';
    value.repository = marker.getAttribute('data-repository') || DEFAULTS.repository;
    value.branch = marker.getAttribute('data-branch') || DEFAULTS.branch;
    value.folder = marker.getAttribute('data-folder') || DEFAULTS.folder;
    value.url = marker.getAttribute('data-url') || '';
    return value;
  }

  function withoutMarker(html) {
    return String(html || '').replace(/(?:\r?\n)?<template\b[^>]*\bdata-hcf-dynamic-page(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>\s*<\/template>\s*/ig, '');
  }

  function buildMarker(config) {
    var marker = document.createElement('template');
    marker.setAttribute('data-hcf-dynamic-page', '1');
    marker.setAttribute('data-build', BUILD);
    marker.setAttribute('data-enabled', config.enabled ? 'true' : 'false');
    marker.setAttribute('data-mode', config.mode);
    marker.setAttribute('data-repository', config.repository);
    marker.setAttribute('data-branch', config.branch);
    marker.setAttribute('data-folder', config.folder);
    if (config.url) marker.setAttribute('data-url', config.url);
    return marker.outerHTML;
  }

  function htmlCheckbox(modal) {
    var inputs = modal.querySelectorAll('.Form-group label.checkbox input[type="checkbox"]');
    for (var i = 0; i < inputs.length; i += 1) {
      var label = inputs[i].closest('label');
      if (label && /html/i.test(label.textContent || '')) return inputs[i];
    }
    return inputs.length ? inputs[inputs.length - 1] : null;
  }

  function pageId(slug) {
    try {
      var pages = app.store.all('pages') || [];
      for (var i = 0; i < pages.length; i += 1) {
        if (typeof pages[i].slug === 'function' && pages[i].slug() === slug) return String(pages[i].id());
      }
    } catch (error) {}
    return '';
  }

  function encodedPath(path) {
    return String(path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function raw(repository, branch, folder, file) {
    return 'https://raw.githubusercontent.com/' +
      String(repository).replace(/^\/+|\/+$/g, '') + '/' +
      encodeURIComponent(branch) + '/' + encodedPath(folder) + '/' + encodeURIComponent(file);
  }

  function candidates(config, slug, id) {
    if (config.mode === 'url') return config.url ? [config.url] : [];
    var result = [];
    if (id && slug) result.push(raw(config.repository, config.branch, config.folder, id + '-' + slug + '.html'));
    if (slug) result.push(raw(config.repository, config.branch, config.folder, slug + '.html'));
    if (id) result.push(raw(config.repository, config.branch, config.folder, id + '.html'));
    return result;
  }

  async function testSource(list, status) {
    status.className = 'HCFDynamicPages-status is-testing';
    status.textContent = 'Testing source…';
    for (var i = 0; i < list.length; i += 1) {
      try {
        var url = new URL(list[i], location.href);
        if (url.protocol !== 'https:') continue;
        var response = await fetch(url.href + (url.search ? '&' : '?') + 'hcf_test=' + Date.now(), {
          cache: 'no-store', credentials: 'omit'
        });
        if (response.ok) {
          status.className = 'HCFDynamicPages-status is-success';
          status.textContent = 'CONNECTED — ' + url.href;
          return;
        }
      } catch (error) {}
    }
    status.className = 'HCFDynamicPages-status is-error';
    status.textContent = list.length ? 'Source not found. Local FoF HTML remains the fallback.' : 'No source can be tested yet.';
  }

  function init(modal) {
    if (!modal || modal.dataset.hcfDynamicPagesAdmin === BUILD) return;
    var textarea = modal.querySelector('.Form-group textarea.FormControl');
    var checkbox = htmlCheckbox(modal);
    if (!textarea || !checkbox) return;

    var group = checkbox.closest('.Form-group');
    if (!group || !group.parentNode) return;
    modal.dataset.hcfDynamicPagesAdmin = BUILD;

    var config = markerConfig(textarea.value);
    var panel = document.createElement('section');
    panel.className = 'HCFDynamicPages-panel';
    panel.innerHTML =
      '<div class="HCFDynamicPages-heading"><div><strong>HCF Dynamic HTML Source</strong><small>Flarum 2.x page source</small></div><span class="HCFDynamicPages-build">v' + BUILD + '</span></div>' +
      '<label class="HCFDynamicPages-switch"><input type="checkbox" data-f="enabled"> <span>Use external GitHub HTML for this page</span></label>' +
      '<label>Source mode<select class="FormControl" data-f="mode"><option value="auto">Auto detect from this FoF page</option><option value="url">Custom HTTPS URL</option></select></label>' +
      '<div data-auto><div class="HCFDynamicPages-grid HCFDynamicPages-grid--two"><label>Repository<input class="FormControl" data-f="repository"></label><label>Branch<input class="FormControl" data-f="branch"></label></div><label>Base folder<input class="FormControl" data-f="folder"></label><p class="HCFDynamicPages-help">Auto mode tries <code>{page-id}-{slug}.html</code>, <code>{slug}.html</code>, then <code>{page-id}.html</code>.</p></div>' +
      '<div data-url><label>Custom HTML URL<input class="FormControl" type="url" inputmode="url" data-f="url"></label></div>' +
      '<div class="HCFDynamicPages-actions"><button class="Button" type="button" data-test>Test Source</button><span class="HCFDynamicPages-status" data-status>Not tested</span></div>' +
      '<p class="HCFDynamicPages-note">If the remote source fails, normal FoF Content remains the fallback.</p>';
    group.insertAdjacentElement('afterend', panel);

    var controls = {};
    ['enabled', 'mode', 'repository', 'branch', 'folder', 'url'].forEach(function (name) {
      controls[name] = panel.querySelector('[data-f="' + name + '"]');
    });
    controls.enabled.checked = config.enabled;
    controls.mode.value = config.mode;
    controls.repository.value = config.repository;
    controls.branch.value = config.branch;
    controls.folder.value = config.folder;
    controls.url.value = config.url;

    function sync() {
      config.enabled = controls.enabled.checked;
      config.mode = controls.mode.value === 'url' ? 'url' : 'auto';
      config.repository = controls.repository.value.trim() || DEFAULTS.repository;
      config.branch = controls.branch.value.trim() || DEFAULTS.branch;
      config.folder = controls.folder.value.trim().replace(/^\/+|\/+$/g, '') || DEFAULTS.folder;
      config.url = controls.url.value.trim();
      panel.querySelector('[data-auto]').hidden = config.mode !== 'auto';
      panel.querySelector('[data-url]').hidden = config.mode !== 'url';
      panel.hidden = !checkbox.checked;
    }

    function persist() {
      var content = withoutMarker(textarea.value);
      textarea.value = checkbox.checked ? buildMarker(config) + '\n' + content.replace(/^\s+/, '') : content;
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    Object.keys(controls).forEach(function (name) {
      controls[name].addEventListener('input', sync);
      controls[name].addEventListener('change', sync);
    });
    checkbox.addEventListener('change', sync);

    panel.querySelector('[data-test]').addEventListener('click', function () {
      sync();
      var fields = modal.querySelectorAll('.Form > .Form-group input.FormControl');
      var slug = fields.length > 1 ? String(fields[1].value || '').trim() : '';
      testSource(candidates(config, slug, pageId(slug)), panel.querySelector('[data-status]'));
    });

    modal.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('.EditPageModal-save')) {
        sync(); persist();
      }
    }, true);
    modal.addEventListener('submit', function () { sync(); persist(); }, true);
    sync();
  }

  function scan() {
    var modals = document.querySelectorAll('.EditPageModal');
    for (var i = 0; i < modals.length; i += 1) init(modals[i]);
  }

  function start() {
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    scan();
  }

  window.HCFDynamicPagesAdmin = { build: BUILD, defaults: defaults(), scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
