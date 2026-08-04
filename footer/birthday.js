/* =========================================================
   HARLEY'S CLAN FORUM — BIRTHDAY MODE
   Active: August 4, 2026 in America/Los_Angeles
   Ends:   August 5, 2026 at 12:00 AM Pacific Time
   Author: HarleyTG
========================================================= */

(function () {
    "use strict";

    var BIRTHDAY_START = new Date("2026-08-04T00:00:00-07:00").getTime();
    var BIRTHDAY_END = new Date("2026-08-05T00:00:00-07:00").getTime();
    var CHECK_INTERVAL = 30000;
    var DISMISS_KEY = "hc-birthday-banner-dismissed-2026";
    var STYLE_ID = "hc-birthday-style";
    var BANNER_ID = "hc-birthday-banner";
    var EFFECTS_ID = "hc-birthday-effects";

    var COLORS = [
        "#00ffff",
        "#5ea1ff",
        "#b86cff",
        "#ff5fc8",
        "#ffd76a",
        "#ffffff"
    ];

    var birthdayCss = [
        ":root{",
        "--hc-birthday-cyan:#00ffff;",
        "--hc-birthday-blue:#5ea1ff;",
        "--hc-birthday-purple:#b86cff;",
        "--hc-birthday-pink:#ff5fc8;",
        "--hc-birthday-gold:#ffd76a;",
        "}",

        "body.hc-birthday-active .hc-simple-footer{",
        "border-top-color:rgba(255,215,106,.72);",
        "background:",
        "radial-gradient(circle at 15% 20%,rgba(255,95,200,.10),transparent 28%),",
        "radial-gradient(circle at 85% 35%,rgba(184,108,255,.12),transparent 30%),",
        "radial-gradient(circle at 50% 100%,rgba(0,255,255,.12),transparent 36%),",
        "transparent;",
        "}",

        "body.hc-birthday-active .hc-simple-footer::before{",
        "background:",
        "radial-gradient(circle at 15% 30%,rgba(255,95,200,.19),transparent 23%),",
        "radial-gradient(circle at 82% 50%,rgba(184,108,255,.17),transparent 27%),",
        "radial-gradient(circle at 50% 98%,rgba(0,255,255,.19),transparent 36%);",
        "}",

        "body.hc-birthday-active .hc-simple-footer::after{",
        "height:2px;",
        "background:linear-gradient(90deg,transparent,var(--hc-birthday-cyan),var(--hc-birthday-pink),var(--hc-birthday-gold),var(--hc-birthday-purple),transparent);",
        "box-shadow:0 0 10px rgba(0,255,255,.72),0 0 22px rgba(255,95,200,.45);",
        "}",

        "body.hc-birthday-active .hc-footer-logo-wrap::before{",
        "border-top-color:var(--hc-birthday-gold);",
        "border-right-color:var(--hc-birthday-pink);",
        "box-shadow:0 0 13px rgba(255,215,106,.32),inset 0 0 9px rgba(255,95,200,.11);",
        "}",

        "body.hc-birthday-active .hc-footer-logo-wrap::after{",
        "border-left-color:var(--hc-birthday-cyan);",
        "border-top-color:var(--hc-birthday-purple);",
        "}",

        "body.hc-birthday-active .hc-footer-logo-img{",
        "border-color:var(--hc-birthday-gold);",
        "box-shadow:0 0 14px rgba(255,215,106,.48),0 0 34px rgba(255,95,200,.27);",
        "}",

        "body.hc-birthday-active .hc-terminal-block{",
        "border-color:rgba(184,108,255,.72);",
        "box-shadow:0 16px 50px rgba(0,0,0,.18),0 0 25px rgba(184,108,255,.16),inset 0 0 20px rgba(0,255,255,.02);",
        "}",

        "body.hc-birthday-active #hc-top-btn{",
        "border-color:rgba(255,215,106,.62);",
        "box-shadow:0 0 16px rgba(255,215,106,.13),0 0 22px rgba(255,95,200,.08);",
        "}",

        "#hc-birthday-banner{",
        "position:fixed;",
        "top:70px;",
        "left:50%;",
        "z-index:1055;",
        "display:flex;",
        "align-items:center;",
        "justify-content:center;",
        "gap:11px;",
        "width:calc(100% - 30px);",
        "max-width:760px;",
        "min-height:52px;",
        "padding:8px 46px 8px 16px;",
        "overflow:hidden;",
        "color:#fff;",
        "text-align:center;",
        "border:1px solid rgba(255,255,255,.66);",
        "border-radius:16px;",
        "background:linear-gradient(115deg,rgba(0,212,220,.96),rgba(79,140,255,.96),rgba(184,108,255,.96),rgba(255,95,200,.96));",
        "box-shadow:0 10px 36px rgba(0,0,0,.38),0 0 22px rgba(0,255,255,.31),0 0 34px rgba(255,95,200,.22);",
        "backdrop-filter:blur(16px);",
        "-webkit-backdrop-filter:blur(16px);",
        "transform:translateX(-50%);",
        "animation:hc-birthday-enter .65s cubic-bezier(.2,.8,.2,1) both,hc-birthday-glow 3s ease-in-out infinite;",
        "}",

        "#hc-birthday-banner::before{",
        "content:'🎂';",
        "display:inline-block;",
        "font-size:25px;",
        "animation:hc-birthday-cake 1.6s ease-in-out infinite;",
        "}",

        "#hc-birthday-banner::after{",
        "content:'';",
        "position:absolute;",
        "inset:0;",
        "z-index:-1;",
        "pointer-events:none;",
        "background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.22) 42%,transparent 62%);",
        "transform:translateX(-120%);",
        "animation:hc-birthday-shine 4.5s ease-in-out infinite;",
        "}",

        ".hc-birthday-copy strong{",
        "display:block;",
        "color:#fff;",
        "font:900 15px/1.2 Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;",
        "letter-spacing:.045em;",
        "text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 9px rgba(255,255,255,.28);",
        "}",

        ".hc-birthday-copy small{",
        "display:block;",
        "margin-top:3px;",
        "color:rgba(255,255,255,.94);",
        "font:700 9px/1.3 'JetBrains Mono','Courier New',monospace;",
        "letter-spacing:.12em;",
        "text-transform:uppercase;",
        "}",

        "#hc-birthday-close{",
        "position:absolute;",
        "top:50%;",
        "right:9px;",
        "display:grid;",
        "place-items:center;",
        "width:32px;",
        "height:32px;",
        "padding:0;",
        "color:#fff;",
        "font:700 20px/1 Arial,sans-serif;",
        "border:1px solid rgba(255,255,255,.42);",
        "border-radius:50%;",
        "background:rgba(0,0,0,.21);",
        "cursor:pointer;",
        "transform:translateY(-50%);",
        "transition:background-color .18s ease,transform .18s ease;",
        "}",

        "#hc-birthday-close:hover,#hc-birthday-close:focus-visible{",
        "background:rgba(0,0,0,.43);",
        "transform:translateY(-50%) scale(1.08);",
        "outline:none;",
        "}",

        "#hc-birthday-effects{",
        "position:fixed;",
        "inset:0;",
        "z-index:1045;",
        "overflow:hidden;",
        "pointer-events:none;",
        "}",

        ".hc-birthday-confetti{",
        "position:absolute;",
        "top:-32px;",
        "left:var(--hc-left);",
        "width:var(--hc-size);",
        "height:calc(var(--hc-size) * 1.75);",
        "border-radius:2px;",
        "background:var(--hc-color);",
        "opacity:.9;",
        "transform:rotate(var(--hc-rotation));",
        "animation:hc-birthday-fall var(--hc-duration) linear infinite;",
        "animation-delay:var(--hc-delay);",
        "}",

        "@keyframes hc-birthday-enter{",
        "from{opacity:0;transform:translate(-50%,-24px) scale(.96)}",
        "to{opacity:1;transform:translate(-50%,0) scale(1)}",
        "}",

        "@keyframes hc-birthday-glow{",
        "0%,100%{box-shadow:0 10px 36px rgba(0,0,0,.38),0 0 20px rgba(0,255,255,.28),0 0 30px rgba(255,95,200,.18)}",
        "50%{box-shadow:0 10px 36px rgba(0,0,0,.4),0 0 30px rgba(0,255,255,.45),0 0 44px rgba(255,95,200,.32)}",
        "}",

        "@keyframes hc-birthday-cake{",
        "0%,100%{transform:translateY(0) rotate(-5deg)}",
        "50%{transform:translateY(-4px) rotate(5deg)}",
        "}",

        "@keyframes hc-birthday-shine{",
        "0%,52%{transform:translateX(-120%);opacity:0}",
        "60%{opacity:1}",
        "82%,100%{transform:translateX(120%);opacity:0}",
        "}",

        "@keyframes hc-birthday-fall{",
        "0%{transform:translate3d(0,-42px,0) rotate(var(--hc-rotation))}",
        "50%{transform:translate3d(var(--hc-drift),52vh,0) rotate(calc(var(--hc-rotation) + 360deg))}",
        "100%{transform:translate3d(calc(var(--hc-drift) * -.5),110vh,0) rotate(calc(var(--hc-rotation) + 720deg))}",
        "}",

        "@media(max-width:767px){",
        "#hc-birthday-banner{top:58px;width:calc(100% - 18px);min-height:48px;padding:7px 40px 7px 10px;border-radius:13px}",
        "#hc-birthday-banner::before{font-size:21px}",
        ".hc-birthday-copy strong{font-size:12px;letter-spacing:.025em}",
        ".hc-birthday-copy small{font-size:8px}",
        "#hc-birthday-close{right:6px;width:29px;height:29px;font-size:17px}",
        "}",

        "@media(prefers-reduced-motion:reduce){",
        "#hc-birthday-banner,#hc-birthday-banner::before,#hc-birthday-banner::after,.hc-birthday-confetti{animation:none!important}",
        ".hc-birthday-confetti{display:none!important}",
        "}",
    ].join("");

    function isActive() {
        var now = Date.now();
        return now >= BIRTHDAY_START && now < BIRTHDAY_END;
    }

    function addStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = birthdayCss;
        document.head.appendChild(style);
    }

    function createBanner() {
        if (
            document.getElementById(BANNER_ID) ||
            sessionStorage.getItem(DISMISS_KEY) === "yes"
        ) {
            return;
        }

        var banner = document.createElement("section");
        banner.id = BANNER_ID;
        banner.setAttribute("role", "status");
        banner.setAttribute("aria-label", "Harley's birthday celebration");
        banner.innerHTML =
            '<div class="hc-birthday-copy">' +
                '<strong>HAPPY BIRTHDAY, HARLEYTG! 🎉</strong>' +
                '<small>August 4 • Harley’s Clan Birthday Celebration</small>' +
            '</div>' +
            '<button id="hc-birthday-close" type="button" aria-label="Close birthday announcement">×</button>';

        document.body.appendChild(banner);

        var closeButton = document.getElementById("hc-birthday-close");

        if (closeButton) {
            closeButton.addEventListener("click", function () {
                sessionStorage.setItem(DISMISS_KEY, "yes");
                banner.remove();
            });
        }
    }

    function createConfetti() {
        if (document.getElementById(EFFECTS_ID)) {
            return;
        }

        var effects = document.createElement("div");
        effects.id = EFFECTS_ID;
        effects.setAttribute("aria-hidden", "true");

        for (var i = 0; i < 36; i++) {
            var piece = document.createElement("i");
            var size = 5 + Math.random() * 6;
            var drift = -75 + Math.random() * 150;

            piece.className = "hc-birthday-confetti";
            piece.style.setProperty("--hc-left", Math.random() * 100 + "%");
            piece.style.setProperty("--hc-size", size + "px");
            piece.style.setProperty("--hc-color", COLORS[i % COLORS.length]);
            piece.style.setProperty("--hc-duration", 6 + Math.random() * 7 + "s");
            piece.style.setProperty("--hc-delay", -Math.random() * 12 + "s");
            piece.style.setProperty("--hc-drift", drift + "px");
            piece.style.setProperty("--hc-rotation", Math.random() * 360 + "deg");
            effects.appendChild(piece);
        }

        document.body.appendChild(effects);
    }

    function removeBirthdayMode() {
        document.body.classList.remove("hc-birthday-active");

        var banner = document.getElementById(BANNER_ID);
        var effects = document.getElementById(EFFECTS_ID);
        var style = document.getElementById(STYLE_ID);

        if (banner) {
            banner.remove();
        }

        if (effects) {
            effects.remove();
        }

        if (style) {
            style.remove();
        }
    }

    function updateBirthdayMode() {
        if (!document.body || !document.head) {
            return;
        }

        if (!isActive()) {
            removeBirthdayMode();
            return;
        }

        addStyle();
        document.body.classList.add("hc-birthday-active");
        createBanner();
        createConfetti();
    }

    function start() {
        updateBirthdayMode();
        window.setInterval(updateBirthdayMode, CHECK_INTERVAL);

        var remaining = BIRTHDAY_END - Date.now();

        if (remaining > 0 && remaining < 2147483647) {
            window.setTimeout(removeBirthdayMode, remaining + 250);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
