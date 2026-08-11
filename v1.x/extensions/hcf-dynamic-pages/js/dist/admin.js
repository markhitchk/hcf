/* =========================================================
   HCF Dynamic Pages — Admin integration
   Build: 1.0.0
   Flarum 1.x / FriendsOfFlarum Pages 1.x
========================================================= */
(function () {
  'use strict';

  if (window.HCFDynamicPagesAdmin) return;

  var BUILD = '1.0.0';
  var MARKER_SELECTOR = 'template[data-hcf-dynamic-page]';
  var DEFAULTS = {
    enabled: false,
    mode: 'auto',
    repository: 'markhitchk/hcf',
    branch: 'main',
    folder: 'v1.x/pages/fof-pages',
    url: ''
  };

  function copyDefaults() {
    return {
      enabled: DEFAULTS.enabled,
      mode: DEFAULTS.mode,
      repository: DEFAULTS.repository,
      branch: DEFAULTS.branch,
      folder: DEFAULTS.folder,
      url: DEFAULTS.url
    };
  }

  function parseConfig(html) {
    var config = copyDefaults();
    try {
      var holder = document.createElement('template');
      holder.innerHTML = String(html || '');
      var marker = holder.content.querySelector(MARKER_SELECTOR);
      if (!marker) return config;

      config.enabled = marker.getAttribute('data-enabled') === 'true';
      config.mode = marker.getAttribute('data-mode') === 'url' ? 'url' : 'auto';
      config.repository = marker.getAttribute('data-repository') || DEFAULTS.repository;
      config.branch = marker.getAttribute('data-branch') || DEFAULTS.branch;
      config.folder = marker.getAttribute('data-folder') || DEFAULTS.folder;
      config.url = marker.getAttribute('data-url') || '';
    } catch (error) {}
    return config;
  }

  function removeMarker(html) {
    var source = String(html || '');
    return source.replace(/(?:\r?\n)?<template\b[^>]*\bdata-hcf-dynamic-page(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>\s*<\/template>\s*/ig, '');
  }

  function buildMarker(config) {
    var marker = document.createElement('template');
    marker.setAttribute('data-hcf-dynamic-page', '1');
    marker.setAttribute('data-build', BUILD);
    marker.setAttribute('data-enabled', config.enabled ? 'true' : 'false');
    marker.setAttribute('data-mode', config.mode === 'url' ? 'url' : 'auto');
    marker.setAttribute('data-repository', config.repository || DEFAULTS.repository);
    marker.setAttribute('data-branch', config.branch || DEFAULTS.branch);
    marker.setAttribute('data-folder', String(config.folder || DEFAULTS.folder).replace(/^\/+|\/+$/g, ''));
    if (config.url) marker.setAttribute('data-url', config.url);
    return marker.outerHTML;
  }

  function getPageIdBySlug(slug) {
    try {
      if (!window.app || !app.store || typeof app.store.all !== 'function') return '';
      var pages = app.store.all('pages') || [];
      for (var i = 0; i < pages.length; i++) {
        var pageSlug = typeof pages[i].slug === 'function' ? pages[i].slug() : '';
        if (pageSlug === slug) {
          return typeof pages[i].id === 'function' ? String(pages[i].id()) : String(pages[i].id || '');
        }
      }
    } catch (error) {}
    return '';
  }

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
    var file = encodeURIComponent(filename);
    return 'https://raw.githubusercontent.com/' + repo + '/' + ref + '/' + (path ? path + '/' : '') + file;
  }

  function sourceCandidates(config, slug, id) {
    if (config.mode === 'url') {
      return config.url ? [config.url.trim()] : [];
    }

    var safeSlug = String(slug || '').trim();
    var list = [];
    if (id && safeSlug) list.push(rawUrl(config.repository, config.branch, config.folder, id + '-' + safeSlug + '.html'));
    if (safeSlug) list.push(rawUrl(config.repository, config.branch, config.folder, safeSlug + '.html'));
    if (id) list.push(rawUrl(config.repository, config.branch, config.folder, id + '.html'));
    return list;
  }

  async function testCandidates(candidates, status) {
    if (!candidates.length) {
      status.className = 'HCFDynamicPages-status is-error';
      status.textContent = 'No source can be tested yet.';
      return;
    }

    status.className = 'HCFDynamicPages-status is-testing';
    status.textContent = 'Testing source…';

    for (var i = 0; i < candidates.length; i++) {
      var value = candidates[i];
      try {
        var parsed = new URL(value, location.href);
        if (parsed.protocol !== 'https:') continue;

        var response = await fetch(parsed.href + (parsed.search ? '&' : '?') + 'hcf_test=' + Date.now(), {
          method: 'GET',
          cache: 'no-store',
          credentials: 'omit',
          headers: { Accept: 'text/html,text/plain;q=0.9,*/*;q=0.1' }
        });

        if (response.ok) {
          status.className = 'HCFDynamicPages-status is-success';
          status.textContent = 'CONNECTED — ' + parsed.href;
          return;
        }
      } catch (error) {}
    }

    status.className = 'HCFDynamicPages-status is-error';
    status.textContent = 'Source not found. The local FoF HTML will remain the fallback.';
  }

  function findHtmlCheckbox(modal) {
    var checks = Array.prototype.slice.call(modal.querySelectorAll('.Form-group label.checkbox input[type="checkbox"]'));
    if (!checks.length) return null;

    for (var i = 0; i < checks.length; i++) {
      var label = checks[i].closest('label');
      if (label && /html/i.test(label.textContent || '')) return checks[i];
    }

    return checks[checks.length - 1];
  }

  function getSlugInput(modal) {
    var controls = modal.querySelectorAll('.Form > .Form-group input.FormControl');
    return controls.length > 1 ? controls[1] : null;
  }

  function persist(modal, state) {
    var textarea = state.textarea;
    var htmlEnabled = state.htmlCheckbox.checked;
    var current = removeMarker(textarea.value);

    if (!htmlEnabled) {
      textarea.value = current;
    } else {
      textarea.value = buildMarker(state.config) + '\n' + current.replace(/^\s+/, '');
    }

    try {
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {}
  }

  function updateVisibility(state) {
    var htmlEnabled = state.htmlCheckbox.checked;
    state.panel.hidden = !htmlEnabled;
    state.autoFields.hidden = state.config.mode !== 'auto';
    state.urlFields.hidden = state.config.mode !== 'url';
  }

  function initModal(modal) {
    if (!modal || modal.dataset.hcfDynamicPagesAdmin === BUILD) return;

    var textarea = modal.querySelector('.Form-group textarea.FormControl');
    var htmlCheckbox = findHtmlCheckbox(modal);
    if (!textarea || !htmlCheckbox) return;

    modal.dataset.hcfDynamicPagesAdmin = BUILD;

    var config = parseConfig(textarea.value);
    var state = {
      config: config,
      textarea: textarea,
      htmlCheckbox: htmlCheckbox,
      panel: null,
      autoFields: null,
      urlFields: null
    };

    var panel = document.createElement('section');
    panel.className = 'HCFDynamicPages-panel';
    panel.innerHTML =
      '<div class="HCFDynamicPages-heading">' +
        '<div><strong>HCF Dynamic HTML Source</strong><small>Per-page GitHub HTML loader</small></div>' +
        '<span class="HCFDynamicPages-build">v' + BUILD + '</span>' +
      '</div>' +
      '<label class="HCFDynamicPages-switch"><input type="checkbox" data-hcf-field="enabled"> <span>Use external GitHub HTML for this page</span></label>' +
      '<div class="HCFDynamicPages-grid">' +
        '<label>Source mode<select class="FormControl" data-hcf-field="mode"><option value="auto">Auto detect from this FoF page</option><option value="url">Custom HTTPS URL</option></select></label>' +
      '</div>' +
      '<div class="HCFDynamicPages-auto" data-hcf-auto>' +
        '<div class="HCFDynamicPages-grid HCFDynamicPages-grid--two">' +
          '<label>Repository<input class="FormControl" data-hcf-field="repository" type="text" autocomplete="off"></label>' +
          '<label>Branch<input class="FormControl" data-hcf-field="branch" type="text" autocomplete="off"></label>' +
        '</div>' +
        '<label>Base folder<input class="FormControl" data-hcf-field="folder" type="text" autocomplete="off"></label>' +
        '<p class="HCFDynamicPages-help">Auto mode tries <code>{page-id}-{slug}.html</code>, then <code>{slug}.html</code>, then <code>{page-id}.html</code>.</p>' +
      '</div>' +
      '<div class="HCFDynamicPages-url" data-hcf-url>' +
        '<label>Custom HTML URL<input class="FormControl" data-hcf-field="url" type="url" inputmode="url" placeholder="https://raw.githubusercontent.com/.../page.html" autocomplete="off"></label>' +
      '</div>' +
      '<div class="HCFDynamicPages-actions">' +
        '<button class="Button" type="button" data-hcf-test>Test Source</button>' +
        '<span class="HCFDynamicPages-status" data-hcf-status>Not tested</span>' +
      '</div>' +
      '<p class="HCFDynamicPages-note">If the remote source fails, the HTML in the FoF Content field is kept as the fallback.</p>';

    var htmlGroup = htmlCheckbox.closest('.Form-group');
    if (htmlGroup && htmlGroup.parentNode) htmlGroup.insertAdjacentElement('afterend', panel);

    state.panel = panel;
    state.autoFields = panel.querySelector('[data-hcf-auto]');
    state.urlFields = panel.querySelector('[data-hcf-url]');

    var enabled = panel.querySelector('[data-hcf-field="enabled"]');
    var mode = panel.querySelector('[data-hcf-field="mode"]');
    var repository = panel.querySelector('[data-hcf-field="repository"]');
    var branch = panel.querySelector('[data-hcf-field="branch"]');
    var folder = panel.querySelector('[data-hcf-field="folder"]');
    var url = panel.querySelector('[data-hcf-field="url"]');
    var testButton = panel.querySelector('[data-hcf-test]');
    var status = panel.querySelector('[data-hcf-status]');

    enabled.checked = config.enabled;
    mode.value = config.mode;
    repository.value = config.repository;
    branch.value = config.branch;
    folder.value = config.folder;
    url.value = config.url;

    function syncStateFromControls() {
      state.config.enabled = enabled.checked;
      state.config.mode = mode.value === 'url' ? 'url' : 'auto';
      state.config.repository = repository.value.trim() || DEFAULTS.repository;
      state.config.branch = branch.value.trim() || DEFAULTS.branch;
      state.config.folder = folder.value.trim().replace(/^\/+|\/+$/g, '') || DEFAULTS.folder;
      state.config.url = url.value.trim();
      updateVisibility(state);
    }

    [enabled, mode, repository, branch, folder, url].forEach(function (control) {
      control.addEventListener('input', syncStateFromControls);
      control.addEventListener('change', syncStateFromControls);
    });

    htmlCheckbox.addEventListener('change', function () {
      updateVisibility(state);
    });

    testButton.addEventListener('click', function () {
      syncStateFromControls();
      var slugInput = getSlugInput(modal);
      var slug = slugInput ? String(slugInput.value || '').trim() : '';
      var id = getPageIdBySlug(slug);
      testCandidates(sourceCandidates(state.config, slug, id), status);
    });

    modal.addEventListener('click', function (event) {
      var save = event.target && event.target.closest ? event.target.closest('.EditPageModal-save') : null;
      if (!save) return;
      syncStateFromControls();
      persist(modal, state);
    }, true);

    modal.addEventListener('submit', function () {
      syncStateFromControls();
      persist(modal, state);
    }, true);

    updateVisibility(state);
  }

  function scan() {
    var modals = document.querySelectorAll('.EditPageModal');
    for (var i = 0; i < modals.length; i++) initModal(modals[i]);
  }

  var observer = new MutationObserver(scan);

  function start() {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  }

  window.HCFDynamicPagesAdmin = {
    build: BUILD,
    scan: scan
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
