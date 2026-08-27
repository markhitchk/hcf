(function () {
  'use strict';

  var ERROR_STYLESHEET = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/errors/error.css?v=2.0.0';
  var PAGE_RUNTIME = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/hcf-page.js?v=1.4.1';
  var LOGO = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/HTG.svg';

  var ERRORS = {
    '403': {
      title: 'Access Forbidden',
      status: 'Access Denied',
      dotClass: 'hcf-dot--warn',
      noticeClass: 'hcf-notice--warn',
      message: 'Access to this area is restricted. Your account may not have permission to view this resource.',
      detail: 'The server understood the request, but access is not permitted.',
      chips: ['HTTP 403', 'Restricted Resource']
    },
    '404': {
      title: 'Page Not Found',
      status: 'Route Unavailable',
      dotClass: '',
      noticeClass: '',
      message: 'The page you requested could not be found. It may have been moved, renamed, or removed.',
      detail: 'The requested forum route does not exist or is no longer available.',
      chips: ['HTTP 404', 'Route Missing']
    },
    '500': {
      title: 'Internal Server Error',
      status: 'Server Fault',
      dotClass: 'hcf-dot--danger',
      noticeClass: 'hcf-notice--danger',
      message: 'The forum hit an unexpected server error while processing your request. Please try again in a moment.',
      detail: 'An unexpected server-side failure prevented the request from completing.',
      chips: ['HTTP 500', 'Server Error']
    },
    '503': {
      title: 'Service Unavailable',
      status: 'Temporarily Offline',
      dotClass: 'hcf-dot--warn',
      noticeClass: 'hcf-notice--warn',
      message: 'The forum is temporarily unavailable, usually because of maintenance or a short service interruption. Please try again shortly.',
      detail: 'The service is temporarily unable to handle requests.',
      chips: ['HTTP 503', 'Service Offline']
    }
  };

  function ensureStylesheet() {
    if (document.querySelector('link[data-hcf-error-styles], link[href*="/v1.x/pages/errors/error.css"]')) {
      return;
    }

    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = ERROR_STYLESHEET;
    stylesheet.setAttribute('data-hcf-error-styles', '2.0.0');
    document.head.appendChild(stylesheet);
  }

  function loadPageRuntime() {
    if (window.HCFPageRuntime || document.querySelector('script[data-hcf-error-runtime]')) {
      if (window.HCFPageRuntime && typeof window.HCFPageRuntime.refresh === 'function') {
        window.HCFPageRuntime.refresh();
      }
      return;
    }

    var runtime = document.createElement('script');
    runtime.src = PAGE_RUNTIME;
    runtime.async = false;
    runtime.setAttribute('data-hcf-error-runtime', '1.4.1');
    document.body.appendChild(runtime);
  }

  function chipMarkup(chips) {
    var html = '';
    for (var i = 0; i < chips.length; i += 1) {
      html += '<span class="hcf-chip">' + chips[i] + '</span>';
    }
    return html;
  }

  ensureStylesheet();

  var root = document.documentElement;
  var code = root.getAttribute('data-hcf-error');

  if (!ERRORS[code]) {
    try {
      var queryCode = new URLSearchParams(window.location.search).get('code');
      if (ERRORS[queryCode]) code = queryCode;
    } catch (e) {}
  }

  if (!ERRORS[code]) code = '500';

  var error = ERRORS[code];
  var dotClass = error.dotClass ? ' ' + error.dotClass : '';
  var noticeClass = error.noticeClass ? ' ' + error.noticeClass : '';

  root.setAttribute('data-hcf-error', code);
  document.title = code + ' - ' + error.title + ' | Harley\'s Clan Forum';

  var favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.type = 'image/svg+xml';
  favicon.href = LOGO;

  document.body.innerHTML =
    '<div class="hcf-page" data-hcf-page-build="error-2.0.0">' +
      '<header class="hcf-brand">' +
        '<img class="hcf-logo" src="' + LOGO + '" alt="" aria-hidden="true">' +
        '<div class="hcf-brand-copy">' +
          '<p class="hcf-brand-title">Harley\'s Clan Forum</p>' +
          '<p class="hcf-brand-sub">Forum Network // Error Handler</p>' +
        '</div>' +
      '</header>' +
      '<section class="hcf-hero hcf-hero--compact">' +
        '<div class="hcf-pill"><span class="hcf-dot' + dotClass + '"></span>' + error.status + '</div>' +
        '<div class="hcf-disabled-code" aria-hidden="true">' + code + '</div>' +
        '<h1 class="hcf-title">' + error.title + '</h1>' +
        '<p class="hcf-lead">' + error.message + '</p>' +
        '<div class="hcf-meta">' + chipMarkup(error.chips) + '</div>' +
      '</section>' +
      '<main class="hcf-content">' +
        '<section class="hcf-section">' +
          '<div class="hcf-notice' + noticeClass + '"><strong>HTTP ' + code + '</strong> // ' + error.detail + '</div>' +
          '<div class="hcf-actions">' +
            '<a class="hcf-button hcf-button--primary" href="https://forum.harleytg.com/">Back to Forum</a>' +
            '<a class="hcf-button" href="https://forum.harleytg.com/p/17-support">Get Support</a>' +
          '</div>' +
        '</section>' +
      '</main>' +
      '<footer class="hcf-footer">' +
        '<span>Harley\'s Clan Forum // Flarum 1.x</span>' +
        '<a href="https://forum.harleytg.com/">forum.harleytg.com</a>' +
      '</footer>' +
    '</div>';

  loadPageRuntime();
})();
