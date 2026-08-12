/* =========================================================
   Harley's Clan Forum — FoF Page Entry Loader
   Build: 1.0.0
   Purpose:
   - Permanent bridge between FoF page HTML and hcf-page-bootstrap.js
   - Keeps loader/watchdog/error UI updateable from the repo
   - No commit SHA/version pin required in FoF page HTML
   ========================================================= */
(function () {
  'use strict';

  var BUILD = '1.0.0';
  var frame = window.frameElement;
  if (!frame || !frame.ownerDocument) return;

  var doc = frame.ownerDocument;
  var win = doc.defaultView || window.parent;
  var shell = frame.closest ? frame.closest('[data-hcf-fof-import-shell]') : null;
  var root = shell ? shell.querySelector('[data-hcf-fof-import-root]') : null;
  if (!root) return;

  var BOOTSTRAP_PATH = 'v1.x/pages/fof-pages/hcf-page-bootstrap.js';
  var SOURCES = [
    'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/' + BOOTSTRAP_PATH,
    'https://cdn.statically.io/gh/markhitchk/hcf/main/' + BOOTSTRAP_PATH
  ];
  var LOGO = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/assets/logos/HTG.svg';
  var SOURCE_TIMEOUT = 3500;
  var WATCHDOG = 12000;

  root.setAttribute('data-hcf-entry-build', BUILD);

  var sourceIndex = 0;
  var finished = false;
  var bootstrapStarted = false;
  var watchdogId = 0;

  function installStyle() {
    var old = doc.getElementById('hcf-page-entry-ui');
    if (old) old.remove();

    var style = doc.createElement('style');
    style.id = 'hcf-page-entry-ui';
    style.textContent =
      '[data-hcf-fof-import-shell]{--hcf-cyan:#00b8f0;--hcf-cyan-bright:#00ffff;--hcf-panel:rgba(18,22,28,.97);--hcf-panel-strong:#0c1015;--hcf-border:rgba(0,184,240,.34);--hcf-text:#eefcff;--hcf-muted:#9cb7c2;--hcf-warning:#ffd166}' +
      '[data-hcf-fof-import-root]{position:relative;width:min(760px,100%);margin:20px auto;padding:24px 18px;box-sizing:border-box;overflow:hidden;background:linear-gradient(180deg,rgba(0,184,240,.04),transparent 32%),var(--hcf-panel);border:1px solid var(--hcf-border);border-radius:18px;box-shadow:0 20px 55px rgba(0,0,0,.34),0 0 24px rgba(0,184,240,.07);color:var(--hcf-text);text-align:center;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}' +
      '[data-hcf-fof-import-root]:before{content:"";position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--hcf-cyan),transparent);box-shadow:0 0 16px rgba(0,184,240,.65)}' +
      '.hcf-entry-brand{display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:20px}.hcf-entry-logo{width:44px;height:44px;object-fit:contain;border-radius:50%;filter:drop-shadow(0 0 8px rgba(0,184,240,.36))}.hcf-entry-brand-copy{min-width:0;text-align:left}.hcf-entry-brand-title{margin:0;color:var(--hcf-cyan);font-size:16px;font-weight:800;line-height:1.1}.hcf-entry-brand-sub{margin:4px 0 0;color:var(--hcf-muted);font:700 9px/1.3 "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}' +
      '.hcf-entry-status{color:var(--hcf-text);font-size:16px;font-weight:800}.hcf-entry-sub{margin-top:7px;color:var(--hcf-muted);font-size:12px}.hcf-entry-track{width:100%;max-width:380px;height:4px;margin:20px auto 0;overflow:hidden;background:#283138;border-radius:999px}.hcf-entry-bar{width:34%;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--hcf-cyan),var(--hcf-cyan-bright));box-shadow:0 0 10px rgba(0,184,240,.7);transform:translateX(-120%);animation:hcfEntryProgress 1.35s linear infinite}' +
      '[data-hcf-fof-import-root][data-hcf-entry-error]{width:min(800px,100%);padding:0;overflow:visible;background:transparent;border:0;border-radius:0;box-shadow:none}[data-hcf-fof-import-root][data-hcf-entry-error]:before{display:none}' +
      '.hcf-entry-error{position:relative;overflow:hidden;border:1px solid rgba(0,184,240,.34);border-radius:22px;background:linear-gradient(180deg,rgba(0,184,240,.04),transparent 28%),rgba(18,22,28,.97);box-shadow:0 24px 70px rgba(0,0,0,.42),0 0 28px rgba(0,184,240,.08);text-align:left}.hcf-entry-error:before{content:"";position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--hcf-cyan),transparent);box-shadow:0 0 18px rgba(0,184,240,.72)}' +
      '.hcf-entry-error-brand{display:flex;align-items:center;gap:13px;padding:17px 19px;border-bottom:1px solid rgba(0,184,240,.16);background:rgba(8,12,16,.34)}.hcf-entry-error-logo{width:45px;height:45px;flex:0 0 45px;object-fit:contain;border-radius:50%;filter:drop-shadow(0 0 8px rgba(0,184,240,.35))}.hcf-entry-error-brand-title{margin:0;color:var(--hcf-cyan);font-size:20px;font-weight:800;line-height:1.1}.hcf-entry-error-brand-sub{margin:4px 0 0;color:var(--hcf-muted);font:700 10px/1.35 "Courier New",monospace;letter-spacing:.13em;text-transform:uppercase}' +
      '.hcf-entry-error-content{padding:clamp(28px,6vw,50px);text-align:center}.hcf-entry-pill{display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:6px 11px;border:1px solid rgba(255,209,102,.48);border-radius:999px;background:rgba(255,209,102,.1);color:var(--hcf-text);font:800 11px/1 "Courier New",monospace;letter-spacing:.1em;text-transform:uppercase}.hcf-entry-dot{width:7px;height:7px;border-radius:50%;background:var(--hcf-warning);box-shadow:0 0 10px var(--hcf-warning)}' +
      '.hcf-entry-code{margin:18px 0 2px;color:var(--hcf-cyan);font-size:clamp(70px,17vw,118px);font-weight:900;line-height:.9;letter-spacing:-.06em;text-shadow:2px 2px 0 #000,4px 4px 0 rgba(0,184,240,.16),0 0 24px rgba(0,184,240,.18)}.hcf-entry-title{margin:18px 0 0;color:var(--hcf-text);font-size:clamp(24px,5vw,35px);line-height:1.15}.hcf-entry-message{max-width:590px;margin:14px auto 0;color:var(--hcf-muted);font-size:clamp(14px,2.4vw,17px);line-height:1.7}.hcf-entry-detail{max-width:620px;margin:22px auto 0;padding:12px 14px;border:1px solid rgba(0,184,240,.16);border-radius:12px;background:var(--hcf-panel-strong);color:#c8dde4;font:600 12px/1.55 "Courier New",monospace;text-align:left;overflow-wrap:anywhere}.hcf-entry-detail strong{color:var(--hcf-cyan)}' +
      '.hcf-entry-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:11px;margin-top:27px}.hcf-entry-btn{display:inline-flex;align-items:center;justify-content:center;min-width:150px;min-height:45px;padding:10px 17px;border:1px solid rgba(0,184,240,.58);border-radius:11px;background:rgba(0,184,240,.08);color:var(--hcf-cyan);font:800 14px/1.2 Arial,sans-serif;text-decoration:none;cursor:pointer;appearance:none;-webkit-appearance:none}.hcf-entry-btn.p{border-color:var(--hcf-cyan);background:var(--hcf-cyan);color:#061013}.hcf-entry-footer{display:flex;justify-content:space-between;gap:14px;padding:14px 19px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(0,184,240,.14);background:rgba(7,10,14,.38);color:#78939d;font:700 10px/1.4 "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase}.hcf-entry-footer a{color:var(--hcf-cyan);text-decoration:none}' +
      '@keyframes hcfEntryProgress{from{transform:translateX(-120%)}to{transform:translateX(315%)}}' +
      '@media(hover:hover){.hcf-entry-btn:hover{transform:translateY(-1px);border-color:var(--hcf-cyan-bright);background:rgba(0,184,240,.14);box-shadow:0 8px 22px rgba(0,184,240,.11)}.hcf-entry-btn.p:hover{background:var(--hcf-cyan-bright);color:#061013}}' +
      '@media(max-width:600px){[data-hcf-fof-import-root]{width:100%;margin:12px auto;padding:18px 14px;border-radius:15px}.hcf-entry-logo{width:40px;height:40px}.hcf-entry-bar{width:34%;animation:hcfEntryProgress 1.6s linear infinite}[data-hcf-fof-import-root][data-hcf-entry-error]{padding:0}.hcf-entry-error{border-radius:17px}.hcf-entry-error-brand{padding:14px}.hcf-entry-error-logo{width:40px;height:40px;flex-basis:40px}.hcf-entry-error-brand-title{font-size:18px}.hcf-entry-error-content{padding:28px 18px 30px}.hcf-entry-code{font-size:clamp(64px,25vw,96px)}.hcf-entry-actions{flex-direction:column}.hcf-entry-btn{width:100%}.hcf-entry-footer{flex-direction:column;align-items:center;text-align:center}}' +
      '@media(prefers-reduced-motion:reduce){.hcf-entry-bar{width:100%;transform:none;animation:none;opacity:.75}}';

    (doc.head || doc.documentElement).appendChild(style);
  }

  function element(tag, className, text) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (typeof text !== 'undefined') el.textContent = text;
    return el;
  }

  function routeLabel() {
    var page = frame.closest ? frame.closest('.Pages[data-id][data-slug]') : null;
    if (!page) return '';
    var id = String(page.getAttribute('data-id') || '').trim();
    var slug = String(page.getAttribute('data-slug') || '').trim();
    return id && slug ? '/p/' + id + '-' + slug : '';
  }

  function showLoading() {
    installStyle();
    root.removeAttribute('data-hcf-entry-error');
    root.removeAttribute('data-hcf-error');
    root.setAttribute('aria-busy', 'true');
    root.replaceChildren();

    var brand = element('div', 'hcf-entry-brand');
    var logo = element('img', 'hcf-entry-logo');
    logo.src = LOGO;
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');

    var copy = element('div', 'hcf-entry-brand-copy');
    copy.appendChild(element('p', 'hcf-entry-brand-title', "Harley's Clan Forum"));
    copy.appendChild(element('p', 'hcf-entry-brand-sub', 'Forum Network // Page Loader'));

    brand.appendChild(logo);
    brand.appendChild(copy);
    root.appendChild(brand);
    root.appendChild(element('div', 'hcf-entry-status', 'Loading page…'));
    root.appendChild(element('div', 'hcf-entry-sub', 'Connecting to page service'));

    var track = element('div', 'hcf-entry-track');
    track.setAttribute('aria-hidden', 'true');
    track.appendChild(element('div', 'hcf-entry-bar'));
    root.appendChild(track);
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (watchdogId) {
      win.clearTimeout(watchdogId);
      watchdogId = 0;
    }
  }

  function showEmergency(reason) {
    if (finished) return;

    if (root.getAttribute('data-hcf-loaded') === 'true' || root.getAttribute('data-hcf-error')) {
      finish();
      return;
    }

    finished = true;
    if (watchdogId) {
      win.clearTimeout(watchdogId);
      watchdogId = 0;
    }

    installStyle();

    var offline = reason === 'offline';
    var timeout = reason === 'timeout';
    var title = offline
      ? 'You appear to be offline'
      : timeout
        ? 'Page took too long to load'
        : 'Page loader unavailable';

    var message = offline
      ? 'Reconnect to the internet, then retry this page.'
      : timeout
        ? (bootstrapStarted
            ? 'The page service started but did not finish loading in time.'
            : 'The page service could not start in time.')
        : 'The page service is temporarily unavailable. Please retry.';

    var ref = offline
      ? 'HCF-LOADER-OFFLINE'
      : timeout
        ? 'HCF-LOADER-TIMEOUT'
        : 'HCF-LOADER-UNAVAILABLE';

    root.setAttribute('aria-busy', 'false');
    root.setAttribute('data-hcf-entry-error', reason);
    root.setAttribute('data-hcf-error', reason);
    root.setAttribute('data-hcf-error-code', ref);
    root.replaceChildren();

    var panel = element('section', 'hcf-entry-error');
    panel.setAttribute('role', 'alert');

    var brand = element('header', 'hcf-entry-error-brand');
    var logo = element('img', 'hcf-entry-error-logo');
    logo.src = LOGO;
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');

    var brandCopy = element('div');
    brandCopy.appendChild(element('p', 'hcf-entry-error-brand-title', "Harley's Clan Forum"));
    brandCopy.appendChild(element('p', 'hcf-entry-error-brand-sub', 'Forum Network // Error Handler'));
    brand.appendChild(logo);
    brand.appendChild(brandCopy);
    panel.appendChild(brand);

    var content = element('div', 'hcf-entry-error-content');
    var pill = element('div', 'hcf-entry-pill');
    pill.appendChild(element('span', 'hcf-entry-dot'));
    pill.appendChild(element('span', null, offline ? 'Connection unavailable' : timeout ? 'Request timed out' : 'Loader unavailable'));
    content.appendChild(pill);
    content.appendChild(element('div', 'hcf-entry-code', '503'));

    var heading = element('h2', 'hcf-entry-title', title);
    content.appendChild(heading);
    content.appendChild(element('p', 'hcf-entry-message', message));

    var detail = element('div', 'hcf-entry-detail');
    detail.appendChild(element('strong', null, ref));
    var route = routeLabel();
    if (route) detail.appendChild(doc.createTextNode(' // Route: ' + route));
    content.appendChild(detail);

    var actions = element('div', 'hcf-entry-actions');
    var retry = element('button', 'hcf-entry-btn p', 'Retry Page');
    retry.type = 'button';
    var back = element('button', 'hcf-entry-btn', 'Go Back');
    back.type = 'button';
    var support = element('a', 'hcf-entry-btn', 'Get Support');
    support.href = 'https://forum.harleytg.com/p/17-support';

    actions.appendChild(retry);
    actions.appendChild(back);
    actions.appendChild(support);
    content.appendChild(actions);
    panel.appendChild(content);

    var footer = element('footer', 'hcf-entry-footer');
    footer.appendChild(element('span', null, "Harley's Clan Forum // Loader " + BUILD));
    var home = element('a', null, 'forum.harleytg.com');
    home.href = 'https://forum.harleytg.com/';
    footer.appendChild(home);
    panel.appendChild(footer);
    root.appendChild(panel);

    retry.addEventListener('click', function () {
      retry.disabled = true;
      retry.textContent = 'Retrying…';
      try {
        win.location.reload();
      } catch (error) {
        retry.disabled = false;
        retry.textContent = 'Retry Page';
      }
    });

    back.addEventListener('click', function () {
      try {
        if (win.history.length > 1) win.history.back();
        else win.location.href = win.location.origin + '/';
      } catch (error) {
        try { win.location.href = '/'; } catch (_) {}
      }
    });
  }

  function loadNext() {
    if (finished) return;

    if (sourceIndex >= SOURCES.length) {
      showEmergency(win.navigator && win.navigator.onLine === false ? 'offline' : 'sources');
      return;
    }

    var script = document.createElement('script');
    var settled = false;
    var timer = setTimeout(function () {
      if (settled || finished) return;
      settled = true;
      script.onload = null;
      script.onerror = null;
      try { script.remove(); } catch (_) {}
      loadNext();
    }, SOURCE_TIMEOUT);

    script.async = false;
    script.src = SOURCES[sourceIndex++] + '?hcf=' + Date.now();

    script.onload = function () {
      if (settled || finished) return;
      settled = true;
      clearTimeout(timer);
      bootstrapStarted = true;
    };

    script.onerror = function () {
      if (settled || finished) return;
      settled = true;
      clearTimeout(timer);
      try { script.remove(); } catch (_) {}
      loadNext();
    };

    document.head.appendChild(script);
  }

  showLoading();

  win.addEventListener('hcf:fof-page:loaded', finish, { once: true });
  win.addEventListener('hcf:fof-page:error', finish, { once: true });

  watchdogId = win.setTimeout(function () {
    if (finished) return;
    if (root.getAttribute('data-hcf-loaded') === 'true' || root.getAttribute('data-hcf-error')) {
      finish();
      return;
    }
    showEmergency(win.navigator && win.navigator.onLine === false ? 'offline' : 'timeout');
  }, WATCHDOG);

  loadNext();
})();
