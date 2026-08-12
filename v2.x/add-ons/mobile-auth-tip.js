/* ==========================================================
   HARLEY'S CLAN FORUM — MOBILE AUTH TOOLTIP TOGGLE

   Adds a real touch-friendly control to the Flarum Log In and
   Sign Up modal tooltip on phones. The existing CSS tooltip
   remains the fallback when JavaScript is unavailable.

   - × hides the message
   - ? shows it again
   - preference is remembered for the current browser session

   Flarum phone breakpoint: max-width 767.98px
   Version: 1.0
   Updated: 2026-08-11
========================================================== */

(function hcfMobileAuthTipToggle() {
  "use strict";

  if (window.__hcfMobileAuthTipToggle) return;
  window.__hcfMobileAuthTipToggle = true;

  var STORAGE_KEY = "hcfMobileAuthTipHidden";
  var HEADER_SELECTOR = ".LogInModal .Modal-header, .SignUpModal .Modal-header";
  var STYLE_ID = "hcf-mobile-auth-tip-toggle-style";

  function readHiddenPreference() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeHiddenPreference(hidden) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, hidden ? "1" : "0");
    } catch (error) {}
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".hc-auth-tip-toggle{display:none!important}",
      "@media screen and (max-width:767.98px){",
      ":is(.LogInModal,.SignUpModal) .Modal-header.hc-auth-tip-ready::after{content:none!important;display:none!important}",
      ":is(.LogInModal,.SignUpModal) .Modal-header.hc-auth-tip-ready.hc-auth-tip-hidden::before{display:none!important}",
      ":is(.LogInModal,.SignUpModal) .hc-auth-tip-toggle{",
      "position:absolute!important;top:12px!important;right:12px!important;z-index:4!important;",
      "display:grid!important;place-items:center!important;width:30px!important;min-width:30px!important;height:30px!important;min-height:30px!important;",
      "margin:0!important;padding:0!important;border:1px solid rgba(0,184,240,.45)!important;border-radius:50%!important;",
      "background:var(--control-bg,#171c22)!important;color:var(--primary-color,#00b8f0)!important;",
      "box-shadow:0 2px 10px rgba(0,0,0,.22)!important;font:800 17px/1 Arial,sans-serif!important;cursor:pointer!important;touch-action:manipulation!important;",
      "}",
      ":is(.LogInModal,.SignUpModal) .hc-auth-tip-toggle:focus-visible{outline:2px solid var(--primary-color,#00b8f0)!important;outline-offset:2px!important}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

  function syncHeader(header, hidden) {
    var button = header.querySelector(".hc-auth-tip-toggle");
    if (!button) return;

    header.classList.toggle("hc-auth-tip-hidden", hidden);
    header.classList.add("hc-auth-tip-ready");

    button.textContent = hidden ? "?" : "×";
    button.setAttribute("aria-expanded", hidden ? "false" : "true");
    button.setAttribute(
      "aria-label",
      hidden ? "Show username and password tip" : "Hide username and password tip"
    );
    button.setAttribute(
      "title",
      hidden ? "Show username and password tip" : "Hide username and password tip"
    );
  }

  function enhanceHeader(header) {
    if (!header || header.nodeType !== 1) return;
    if (header.querySelector(".hc-auth-tip-toggle")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "Button Button--icon hc-auth-tip-toggle";

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      var hidden = !header.classList.contains("hc-auth-tip-hidden");
      writeHiddenPreference(hidden);
      syncHeader(header, hidden);
    });

    header.appendChild(button);
    syncHeader(header, readHiddenPreference());
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) return;

    if (root.matches && root.matches(HEADER_SELECTOR)) {
      enhanceHeader(root);
    }

    if (!root.querySelectorAll) return;
    root.querySelectorAll(HEADER_SELECTOR).forEach(enhanceHeader);
  }

  function start() {
    installStyles();
    scan(document.documentElement);

    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          scan(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
