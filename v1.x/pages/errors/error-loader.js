(function () {
  'use strict';

  var ERROR_STYLESHEET = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/errors/error.css';
  var existingStylesheet = document.querySelector('link[data-hcf-error-styles], link[href*="/v1.x/pages/errors/error.css"]');

  if (!existingStylesheet) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = ERROR_STYLESHEET;
    stylesheet.setAttribute('data-hcf-error-styles', 'true');
    document.head.appendChild(stylesheet);
  }

  var ERRORS = {
    '403': {
      title: 'Access Forbidden',
      icon: '🔒',
      status: 'Access denied',
      message: 'Access to this area is restricted. Your account may not have permission to view this resource.',
      detail: 'The server understood the request but access is not permitted.',
      color: '#ffb454',
      background: 'rgba(255,180,84,.10)',
      border: 'rgba(255,180,84,.48)'
    },
    '404': {
      title: 'Page Not Found',
      icon: '🔎',
      status: 'Route unavailable',
      message: 'The page you requested could not be found. It may have been moved, renamed, or removed.',
      detail: 'The requested forum route does not exist or is no longer available.',
      color: '#00b8f0',
      background: 'rgba(0,184,240,.10)',
      border: 'rgba(0,184,240,.48)'
    },
    '500': {
      title: 'Internal Server Error',
      icon: '⚠',
      status: 'Server fault',
      message: 'The forum hit an unexpected server error while processing your request. Please try again in a moment.',
      detail: 'An unexpected server-side failure prevented the request from completing.',
      color: '#ff6b6b',
      background: 'rgba(255,107,107,.10)',
      border: 'rgba(255,107,107,.48)'
    },
    '503': {
      title: 'Service Unavailable',
      icon: '🛠',
      status: 'Temporarily offline',
      message: 'The forum is temporarily unavailable, usually because of maintenance or a short service interruption. Please try again shortly.',
      detail: 'The service is temporarily unable to handle requests.',
      color: '#ffd166',
      background: 'rgba(255,209,102,.10)',
      border: 'rgba(255,209,102,.48)'
    }
  };

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
  root.setAttribute('data-hcf-error', code);
  root.style.setProperty('--status', error.color);
  root.style.setProperty('--statusbg', error.background);
  root.style.setProperty('--statusborder', error.border);
  document.title = code + ' - ' + error.title + ' | Harley\'s Clan Forum';

  var favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    document.head.appendChild(favicon);
  }
  favicon.href = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/HTG.svg';

  document.body.innerHTML = '<main class="shell">' +
    '<header class="brand"><img class="logo" src="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/assets/logos/HTG.svg" alt="" aria-hidden="true"><div class="brand-copy"><p class="brand-title">Harley\'s Clan Forum</p><p class="brand-sub">Forum Network // Error Handler</p></div></header>' +
    '<section class="content" aria-labelledby="error-title">' +
    '<div class="pill"><span class="dot" aria-hidden="true"></span><span>' + error.status + '</span></div>' +
    '<div class="code" aria-hidden="true">' + code + '</div>' +
    '<h1 id="error-title">' + error.icon + ' ' + error.title + '</h1>' +
    '<p class="message">' + error.message + '</p>' +
    '<div class="detail"><strong>HTTP ' + code + '</strong> // ' + error.detail + '</div>' +
    '<nav class="actions" aria-label="Error page actions"><a class="button primary" href="https://forum.harleytg.com/">Back to Forum</a><a class="button" href="https://forum.harleytg.com/p/17-support">Get Support</a></nav>' +
    '</section>' +
    '<footer class="footer"><span>Harley\'s Clan Forum // Flarum 1.x</span><a href="https://forum.harleytg.com/">forum.harleytg.com</a></footer>' +
    '</main>';
})();
