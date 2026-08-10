/* =========================================================
   HARLEY'S CLAN FORUM — AUTOMATIC CELEBRATION BANNERS
   Time zone: America/Los_Angeles

   Test every celebration:
   https://forum.harleytg.com/?hcHoliday=all

   Optional visible time per banner:
   https://forum.harleytg.com/?hcHoliday=all&hcSpeed=5000
========================================================= */
(function () {
  "use strict";

  var script = document.currentScript;
  var base = script && script.src
    ? script.src.split(/[?#]/)[0].replace(/[^/]+$/, "")
    : "";

  var config = {
    enabled: true,
    timeZone: "America/Los_Angeles",
    checkIntervalMs: 30000,
    pageEffects: true,
    showWithBirthday: true,
    customHolidays: []
  };

  var currentId = "";
  var forcedId = "";
  var timer = null;
  var sequenceTimer = null;
  var sequenceMode = false;
  var sequenceIndex = 0;
  var sequenceDelayMs = 6000;
  var sequenceTransitioning = false;
  var sequenceTransitionMs = 700;
  var bannerObserver = null;
  var stackObserver = null;
  var reduceMotion = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  var holidays = [
    h("new-years-day", "New Year's Day", "Happy New Year! 🎉", "A new year begins with Harley’s Clan", "🎆", fixed(1, 1), ["#061b4d", "#234fd0", "#7a35d6", "#e9a918"], ["✦", "★", "●", "◆"]),
    h("mlk-day", "Martin Luther King Jr. Day", "Honoring Dr. Martin Luther King Jr.", "Celebrating service, equality, courage, and community", "🕊️", nth(1, 1, 3), ["#111827", "#243b68", "#5b3d8f", "#b27a2c"], ["✦", "•", "★"]),
    h("valentines-day", "Valentine's Day", "Happy Valentine’s Day! 💖", "Sending kindness and friendship across Harley’s Clan", "💝", fixed(2, 14), ["#7c1747", "#d62976", "#ff5fc8", "#7c35b7"], ["♥", "❤", "✦"]),
    h("presidents-day", "Presidents' Day", "Presidents’ Day 🇺🇸", "Recognizing the history and leadership of the United States", "🏛️", nth(2, 1, 3), ["#661b2b", "#a72b3b", "#153e7f", "#275ca8"], ["★", "✦", "•"]),
    h("st-patricks-day", "St. Patrick's Day", "Happy St. Patrick’s Day! ☘️", "A little luck from Harley’s Clan", "🍀", fixed(3, 17), ["#063b24", "#0b7a3b", "#17a653", "#a28119"], ["☘", "●", "✦"]),
    h("easter", "Easter", "Happy Easter! 🐰", "Wishing Harley’s Clan a bright and cheerful day", "🐣", { type: "easter" }, ["#5d3d9e", "#9a55c7", "#e06fae", "#54a7c7"], ["●", "◆", "✦", "♡"]),
    h("mothers-day", "Mother's Day", "Happy Mother’s Day! 🌷", "Celebrating the mothers and caregivers in our community", "💐", nth(5, 0, 2), ["#773a70", "#b54782", "#dc6ca0", "#7c5dad"], ["✿", "♡", "✦"]),
    h("memorial-day", "Memorial Day", "Memorial Day — We Remember", "Honoring those who gave their lives in service", "🇺🇸", last(5, 1), ["#101b34", "#1f3f78", "#7e2633", "#2b4167"], ["★", "✦", "•"]),
    h("juneteenth", "Juneteenth", "Juneteenth ❤️💚🖤", "Celebrating freedom, history, progress, and community", "⭐", fixed(6, 19), ["#171717", "#7f1d1d", "#116a35", "#171717"], ["★", "✦", "●"]),
    h("fathers-day", "Father's Day", "Happy Father’s Day! 🧰", "Celebrating the fathers and mentors in our community", "💙", nth(6, 0, 3), ["#103665", "#155b94", "#227ea8", "#3c4c93"], ["★", "◆", "✦"]),
    h("independence-day", "Independence Day", "Happy Independence Day! 🎆", "Celebrating July 4th with Harley’s Clan", "🇺🇸", fixed(7, 4), ["#8d1d2c", "#d63743", "#153d84", "#2460bb"], ["★", "✦", "●", "◆"]),
    h("labor-day", "Labor Day", "Happy Labor Day! 🛠️", "Recognizing workers and the contributions they make", "⚙️", nth(9, 1, 1), ["#17304c", "#1f5b7a", "#227f8b", "#64531e"], ["⚙", "✦", "◆"]),
    h("halloween", "Halloween", "Happy Halloween! 🎃", "A spooky celebration from Harley’s Clan", "👻", fixed(10, 31), ["#180822", "#5e1689", "#d35b00", "#0d0d0f"], ["🎃", "◆", "✦", "●"]),
    h("veterans-day", "Veterans Day", "Veterans Day — Thank You", "Honoring everyone who has served", "🎖️", fixed(11, 11), ["#17223b", "#294d87", "#6d1f2b", "#263d63"], ["★", "✦", "•"]),
    h("thanksgiving", "Thanksgiving", "Happy Thanksgiving! 🦃", "Wishing Harley’s Clan a warm and thankful day", "🍂", nth(11, 4, 4), ["#5c2410", "#a84c16", "#d98c22", "#62351d"], ["🍂", "◆", "●", "✦"]),
    h("christmas-eve", "Christmas Eve", "Merry Christmas Eve! 🎄", "The holiday celebration begins at Harley’s Clan", "🎁", fixed(12, 24), ["#073b2c", "#0c7a4d", "#a51e32", "#7a1425"], ["❄", "✦", "●", "★"]),
    h("christmas-day", "Christmas Day", "Merry Christmas! 🎄", "Holiday wishes from Harley’s Clan", "🎅", fixed(12, 25), ["#073b2c", "#0c7a4d", "#b12034", "#841829"], ["❄", "✦", "●", "★"]),
    h("new-years-eve", "New Year's Eve", "Happy New Year’s Eve! 🎇", "Counting down together with Harley’s Clan", "🥳", fixed(12, 31), ["#10144d", "#3139b7", "#7a35d6", "#d49b20"], ["✦", "★", "●", "◆"])
  ];

  var birthdayTest = h(
    "birthday-test",
    "Birthday Celebration",
    "Happy Birthday, Test Member! 🎉",
    "Harley’s Clan Birthday Celebration",
    "🎂",
    fixed(1, 1),
    ["#00cfd8", "#4f8cff", "#b86cff", "#ff5fc8"],
    ["■", "●", "◆", "✦"]
  );

  function h(id, label, title, subtitle, icon, rule, gradient, particles) {
    return {
      id: id,
      label: label,
      title: title,
      subtitle: subtitle,
      icon: icon,
      rule: rule,
      gradient: gradient,
      particles: particles
    };
  }

  function fixed(month, day) {
    return { type: "fixed", month: month, day: day };
  }

  function nth(month, weekday, number) {
    return { type: "nth", month: month, weekday: weekday, nth: number };
  }

  function last(month, weekday) {
    return { type: "last", month: month, weekday: weekday };
  }

  function pad(number) {
    return number < 10 ? "0" + number : String(number);
  }

  function pacificDate() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timeZone || "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    }).formatToParts(new Date());

    var date = { year: 0, month: 0, day: 0 };
    parts.forEach(function (part) {
      if (part.type === "year" || part.type === "month" || part.type === "day") {
        date[part.type] = Number(part.value);
      }
    });
    date.iso = date.year + "-" + pad(date.month) + "-" + pad(date.day);
    return date;
  }

  function easter(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var x = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - x - k) % 7;
    var m = Math.floor((a + 11 * x + 22 * l) / 451);
    var month = Math.floor((x + l - 7 * m + 114) / 31);
    return {
      month: month,
      day: ((x + l - 7 * m + 114) % 31) + 1
    };
  }

  function ruleDate(rule, year) {
    if (rule.type === "fixed") {
      return { month: rule.month, day: rule.day };
    }
    if (rule.type === "easter") {
      return easter(year);
    }
    if (rule.type === "nth") {
      var first = new Date(Date.UTC(year, rule.month - 1, 1)).getUTCDay();
      return {
        month: rule.month,
        day: 1 + ((rule.weekday - first + 7) % 7) + 7 * (rule.nth - 1)
      };
    }
    if (rule.type === "last") {
      var total = new Date(Date.UTC(year, rule.month, 0)).getUTCDate();
      var weekday = new Date(Date.UTC(year, rule.month - 1, total)).getUTCDay();
      return {
        month: rule.month,
        day: total - ((weekday - rule.weekday + 7) % 7)
      };
    }
    return null;
  }

  function normalizeCustom(item) {
    if (!item || !item.id || !item.month || !item.day) {
      return null;
    }
    return h(
      String(item.id),
      item.label || item.id,
      item.title || item.label || item.id,
      item.subtitle || "Harley’s Clan Holiday Celebration",
      item.icon || "🎉",
      fixed(Number(item.month), Number(item.day)),
      Array.isArray(item.gradient) && item.gradient.length
        ? item.gradient
        : ["#083b4d", "#166b87", "#7a35d6", "#d45c98"],
      Array.isArray(item.particles) && item.particles.length
        ? item.particles
        : ["✦", "★", "●", "◆"]
    );
  }

  function allHolidays() {
    return holidays.concat(
      (config.customHolidays || []).map(normalizeCustom).filter(Boolean)
    );
  }

  function allTestCelebrations() {
    return [birthdayTest].concat(allHolidays());
  }

  function getQueryValue(name) {
    try {
      return new URLSearchParams(location.search).get(name) || "";
    } catch (error) {
      return "";
    }
  }

  function queryForce() {
    return getQueryValue("hcHoliday").toLowerCase();
  }

  function isSequenceRequest(value) {
    return value === "all" || value === "test" || value === "test-all";
  }

  function requestedSpeed() {
    var value = Number(getQueryValue("hcSpeed"));
    if (!Number.isFinite(value)) {
      return 6000;
    }
    return Math.max(2500, Math.min(30000, value));
  }

  function activeHoliday(date) {
    var list = allHolidays();
    var wanted = forcedId || queryForce();

    if (wanted === "off" || isSequenceRequest(wanted)) {
      return null;
    }

    if (wanted) {
      return list.filter(function (item) {
        return item.id === wanted;
      })[0] || null;
    }

    for (var index = 0; index < list.length; index++) {
      var result = ruleDate(list[index].rule, date.year);
      if (result && result.month === date.month && result.day === date.day) {
        return list[index];
      }
    }
    return null;
  }

  function storageGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {}
  }

  function addStyles() {
    if (document.getElementById("hc-holiday-style")) {
      return;
    }

    var style = document.createElement("style");
    style.id = "hc-holiday-style";
    style.textContent = [
      ".hc-banner-slide[hidden]{display:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}",
      "#hc-holiday-header,#hc-holiday-header *,#hc-holiday-effects,#hc-holiday-effects *{box-sizing:border-box}",
      "#hc-holiday-header[hidden]{display:none!important}",
      "#hc-holiday-header{--g:linear-gradient(115deg,#083b4d,#166b87,#7a35d6,#d45c98);position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:54px;margin:0;padding:8px 48px 8px 16px;overflow:hidden;border-top:1px solid rgba(255,255,255,.72);border-bottom:1px solid rgba(255,255,255,.72);background:var(--g);color:#fff;text-align:center;box-shadow:0 7px 22px rgba(0,0,0,.32),0 0 22px rgba(0,255,255,.24),inset 0 1px rgba(255,255,255,.18);animation:hcHolidayIn .65s cubic-bezier(.2,.8,.2,1) both,hcHolidayGlow 3s ease-in-out .65s infinite;will-change:transform,opacity}",
      "#hc-holiday-header.hc-sequence-leaving{animation:none!important;transform:translate3d(-100%,0,0)!important;opacity:0!important;transition:transform .7s cubic-bezier(.22,.61,.36,1),opacity .5s ease!important}",
      "#hc-holiday-header.hc-sequence-entering{animation:none!important;transform:translate3d(100%,0,0)!important;opacity:0!important;transition:none!important}",
      "#hc-holiday-header.hc-sequence-entering.hc-sequence-entering-active{transform:translate3d(0,0,0)!important;opacity:1!important;transition:transform .7s cubic-bezier(.22,.61,.36,1),opacity .5s ease!important}",
      "#hc-holiday-header:before{content:\"\";position:absolute;inset:0;z-index:-2;pointer-events:none;background:radial-gradient(circle at 15% 40%,rgba(255,255,255,.2),transparent 22%),radial-gradient(circle at 82% 50%,rgba(255,255,255,.16),transparent 26%)}",
      "#hc-holiday-header:after{content:\"\";position:absolute;top:-45%;left:-40%;z-index:-1;width:34%;height:190%;pointer-events:none;opacity:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),rgba(255,255,255,.42),rgba(255,255,255,.08),transparent);transform:skewX(-18deg);animation:hcHolidaySweep 4.8s ease-in-out infinite}",
      ".hc-holiday-icon{position:relative;z-index:3;flex:0 0 auto;font-size:27px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));animation:hcHolidayFloat 1.55s ease-in-out infinite}",
      ".hc-holiday-copy{position:relative;z-index:3;min-width:0}",
      ".hc-holiday-copy strong{display:block;color:#fff;font:900 15px/1.2 Arial,sans-serif;letter-spacing:.055em;text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 9px rgba(255,255,255,.3)}",
      ".hc-holiday-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.94);font:700 9px/1.35 \"Courier New\",monospace;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.42)}",
      "#hc-holiday-close{position:absolute;top:50%;right:10px;z-index:5;display:grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid rgba(255,255,255,.46);border-radius:50%;background:rgba(0,0,0,.22);color:#fff;cursor:pointer;font:700 20px/1 Arial,sans-serif;transform:translateY(-50%);transition:.18s}",
      "#hc-holiday-close:hover,#hc-holiday-close:focus-visible{border-color:#fff;background:rgba(0,0,0,.44);outline:none;transform:translateY(-50%) scale(1.08)}",
      ".hc-holiday-particles{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}",
      ".hc-holiday-particles i,#hc-holiday-effects i{position:absolute;top:-30px;left:var(--x);display:block;color:var(--c);font-style:normal;font-size:var(--s);line-height:1;opacity:var(--o,.84);text-shadow:0 0 4px rgba(255,255,255,.28);animation:hcHolidayFall var(--d) linear infinite;animation-delay:var(--delay)}",
      "#hc-holiday-effects{position:fixed;inset:0;z-index:790;overflow:hidden;pointer-events:none;contain:strict}",
      "@keyframes hcHolidayIn{from{opacity:0;transform:translateY(-100%) scaleY(.72);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}",
      "@keyframes hcHolidayGlow{50%{box-shadow:0 8px 25px rgba(0,0,0,.35),0 0 30px rgba(255,255,255,.28),inset 0 1px rgba(255,255,255,.24)}}",
      "@keyframes hcHolidaySweep{0%,12%{left:-40%;opacity:0}20%{opacity:.95}68%{opacity:.55}80%,100%{left:115%;opacity:0}}",
      "@keyframes hcHolidayFloat{0%,100%{transform:translateY(1px) rotate(-5deg) scale(.97)}50%{transform:translateY(-3px) rotate(5deg) scale(1.06)}}",
      "@keyframes hcHolidayFall{from{transform:translate3d(0,-8vh,0) rotate(0)}to{transform:translate3d(var(--drift),112vh,0) rotate(780deg)}}",
      "@media(max-width:600px){#hc-holiday-header{min-height:52px;gap:8px;padding:7px 40px 7px 9px}.hc-holiday-icon{font-size:22px}.hc-holiday-copy strong{font-size:12px;letter-spacing:.025em}.hc-holiday-copy small{font-size:8px;letter-spacing:.07em}#hc-holiday-close{right:6px;width:29px;height:29px;font-size:17px}}",
      "@media(prefers-reduced-motion:reduce){#hc-holiday-header,#hc-holiday-header:after,.hc-holiday-icon,.hc-holiday-particles i,#hc-holiday-effects i{animation:none!important;transition:none!important}#hc-holiday-effects{display:none!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function syncBannerSlot(banner) {
    if (!banner) {
      return;
    }
    var slot = banner.closest(".hc-banner-slide");
    if (slot) {
      slot.hidden = Boolean(banner.hidden);
      slot.setAttribute("aria-hidden", banner.hidden ? "true" : "false");
    }
  }

  function queueSlotSync(banner) {
    syncBannerSlot(banner);
    window.setTimeout(function () {
      syncBannerSlot(banner);
    }, 0);
    window.setTimeout(function () {
      syncBannerSlot(banner);
    }, 80);
  }

  function watchBannerSlot(banner) {
    if (bannerObserver) {
      bannerObserver.disconnect();
    }
    bannerObserver = new MutationObserver(function () {
      queueSlotSync(banner);
    });
    bannerObserver.observe(banner, {
      attributes: true,
      attributeFilter: ["hidden"]
    });

    var stack = document.querySelector("#hc-header-stack,.hc-header-stack");
    if (stack && !stackObserver) {
      stackObserver = new MutationObserver(function () {
        queueSlotSync(banner);
      });
      stackObserver.observe(stack, { childList: true, subtree: true });
    }
  }

  function resetSequenceClasses(banner) {
    banner.classList.remove(
      "hc-sequence-leaving",
      "hc-sequence-entering",
      "hc-sequence-entering-active"
    );
  }

  function hideBanner(banner) {
    resetSequenceClasses(banner);
    banner.hidden = true;
    queueSlotSync(banner);
  }

  function showBanner(banner) {
    banner.hidden = false;
    queueSlotSync(banner);
  }

  function makeBanner() {
    var banner = document.getElementById("hc-holiday-header");
    if (banner) {
      watchBannerSlot(banner);
      return banner;
    }

    banner = document.createElement("section");
    banner.id = "hc-holiday-header";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = '<span class="hc-holiday-icon" aria-hidden="true"></span><div class="hc-holiday-copy"><strong></strong><small></small></div><button id="hc-holiday-close" type="button" aria-label="Close holiday announcement">×</button><span class="hc-holiday-particles" aria-hidden="true"></span>';

    var stack = document.querySelector("#hc-header-stack,.hc-header-stack") || document.body;
    var birthday = document.getElementById("hc-birthday-header");
    if (birthday && birthday.parentNode === stack) {
      stack.insertBefore(banner, birthday);
    } else {
      stack.appendChild(banner);
    }

    banner.querySelector("#hc-holiday-close").addEventListener("click", function () {
      if (sequenceMode) {
        nextSequence();
        return;
      }

      var date = pacificDate();
      if (currentId) {
        storageSet("hc-holiday-dismissed-" + date.iso + "-" + currentId, "yes");
      }
      hideBanner(banner);
      removeEffects();
    });

    watchBannerSlot(banner);
    return banner;
  }

  function particleColor(item) {
    var palette = ["#ffffff"].concat(item.gradient || []);
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function particles(container, item, amount, page) {
    container.textContent = "";
    for (var index = 0; index < amount; index++) {
      var piece = document.createElement("i");
      piece.textContent = item.particles[
        Math.floor(Math.random() * item.particles.length)
      ];
      piece.style.setProperty("--x", Math.random() * 100 + "%");
      piece.style.setProperty("--s", (page ? 10 : 7) + Math.random() * (page ? 14 : 9) + "px");
      piece.style.setProperty("--c", particleColor(item));
      piece.style.setProperty("--d", (page ? 7 : 2.8) + Math.random() * (page ? 8 : 3.2) + "s");
      piece.style.setProperty("--delay", -Math.random() * (page ? 14 : 5) + "s");
      piece.style.setProperty("--drift", -90 + Math.random() * 180 + "px");
      piece.style.setProperty("--o", (0.48 + Math.random() * 0.42).toFixed(2));
      container.appendChild(piece);
    }
  }

  function removeEffects() {
    var layer = document.getElementById("hc-holiday-effects");
    if (layer) {
      layer.remove();
    }
  }

  function buildEffects(item) {
    removeEffects();

    if (!config.pageEffects) {
      return;
    }

    if (!sequenceMode) {
      var birthday = document.getElementById("hc-birthday-header");
      if (birthday && !birthday.hidden) {
        return;
      }
    }

    var layer = document.createElement("div");
    layer.id = "hc-holiday-effects";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    particles(layer, item, window.innerWidth <= 600 ? 28 : 48, true);
  }

  function suppressOtherBannersForTest() {
    if (!sequenceMode) {
      return;
    }

    ["forum-notice", "hc-birthday-header"].forEach(function (id) {
      var other = document.getElementById(id);
      if (other) {
        other.hidden = true;
        queueSlotSync(other);
      }
    });

    var birthdayEffects = document.getElementById("hc-birthday-page-confetti");
    if (birthdayEffects) {
      birthdayEffects.remove();
    }
  }

  function setBannerContent(item, testPosition) {
    var banner = makeBanner();
    currentId = item.id;

    banner.style.setProperty(
      "--g",
      "linear-gradient(115deg," + item.gradient.join(",") + ")"
    );
    banner.querySelector(".hc-holiday-icon").textContent = item.icon;
    banner.querySelector("strong").textContent = item.title;

    var subtitle = item.subtitle + " • " + item.label;
    if (testPosition) {
      subtitle += " • TEST " + testPosition.current + "/" + testPosition.total;
    }
    banner.querySelector("small").textContent = subtitle;
    banner.setAttribute("aria-label", item.label + " celebration");

    particles(banner.querySelector(".hc-holiday-particles"), item, 24, false);
    showBanner(banner);
  }

  function renderItem(item, testPosition) {
    var banner = makeBanner();
    if (!item) {
      currentId = "";
      hideBanner(banner);
      removeEffects();
      return;
    }

    resetSequenceClasses(banner);
    setBannerContent(item, testPosition);
    buildEffects(item);
  }

  function refresh() {
    if (!document.body || sequenceMode) {
      return;
    }

    addStyles();
    var banner = makeBanner();
    var date = pacificDate();
    var item = config.enabled ? activeHoliday(date) : null;

    if (!item) {
      currentId = "";
      hideBanner(banner);
      removeEffects();
      return;
    }

    var birthday = document.getElementById("hc-birthday-header");
    if (!config.showWithBirthday && birthday && !birthday.hidden) {
      hideBanner(banner);
      removeEffects();
      return;
    }

    var dismissed = storageGet(
      "hc-holiday-dismissed-" + date.iso + "-" + item.id
    ) === "yes";

    if (dismissed) {
      currentId = item.id;
      hideBanner(banner);
      removeEffects();
      return;
    }

    renderItem(item, null);
  }

  function clearSequenceTimer() {
    window.clearTimeout(sequenceTimer);
    sequenceTimer = null;
  }

  function scheduleSequenceAdvance() {
    clearSequenceTimer();
    if (!sequenceMode) {
      return;
    }
    sequenceTimer = window.setTimeout(nextSequence, sequenceDelayMs);
  }

  function sequencePosition(list) {
    return {
      current: sequenceIndex + 1,
      total: list.length
    };
  }

  function showSequenceItem(immediate) {
    if (!sequenceMode) {
      return;
    }

    clearSequenceTimer();
    suppressOtherBannersForTest();

    var list = allTestCelebrations();
    if (!list.length) {
      return;
    }

    if (sequenceIndex >= list.length) {
      sequenceIndex = 0;
    }

    var item = list[sequenceIndex];
    var position = sequencePosition(list);
    var banner = makeBanner();

    if (
      immediate ||
      reduceMotion ||
      banner.hidden ||
      !currentId
    ) {
      sequenceTransitioning = false;
      renderItem(item, position);
      scheduleSequenceAdvance();
      return;
    }

    sequenceTransitioning = true;
    removeEffects();
    resetSequenceClasses(banner);
    banner.classList.add("hc-sequence-leaving");

    window.setTimeout(function () {
      if (!sequenceMode) {
        sequenceTransitioning = false;
        return;
      }

      banner.classList.remove("hc-sequence-leaving");
      banner.classList.add("hc-sequence-entering");
      setBannerContent(item, position);
      void banner.offsetWidth;
      banner.classList.add("hc-sequence-entering-active");
      buildEffects(item);

      window.setTimeout(function () {
        resetSequenceClasses(banner);
        sequenceTransitioning = false;
        scheduleSequenceAdvance();
      }, sequenceTransitionMs + 40);
    }, sequenceTransitionMs);
  }

  function nextSequence() {
    if (!sequenceMode || sequenceTransitioning) {
      return;
    }

    clearSequenceTimer();
    var list = allTestCelebrations();
    if (!list.length) {
      return;
    }
    sequenceIndex = (sequenceIndex + 1) % list.length;
    showSequenceItem(false);
  }

  function startSequence(delay) {
    sequenceMode = true;
    forcedId = "";
    sequenceIndex = 0;
    sequenceTransitioning = false;
    sequenceDelayMs = Math.max(
      2500,
      Math.min(30000, Number(delay) || requestedSpeed())
    );
    window.clearTimeout(timer);
    timer = null;
    showSequenceItem(true);
  }

  function stopSequence() {
    sequenceMode = false;
    sequenceTransitioning = false;
    clearSequenceTimer();
    removeEffects();
    resetSequenceClasses(makeBanner());
    refresh();
    schedule();
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = null;

    if (sequenceMode) {
      return;
    }

    var delay = Math.max(10000, Number(config.checkIntervalMs) || 30000);
    timer = window.setTimeout(function tick() {
      refresh();
      timer = window.setTimeout(tick, delay);
    }, delay);
  }

  function applyRequestedMode() {
    var requested = queryForce();
    if (isSequenceRequest(requested)) {
      startSequence(requestedSpeed());
      return;
    }
    refresh();
    schedule();
  }

  function loadConfig() {
    if (!base || typeof fetch !== "function") {
      applyRequestedMode();
      return;
    }

    fetch(base + "holidays.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Holiday settings unavailable");
        }
        return response.json();
      })
      .then(function (data) {
        Object.keys(config).forEach(function (key) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            config[key] = data[key];
          }
        });
        applyRequestedMode();
      })
      .catch(function () {
        applyRequestedMode();
      });
  }

  window.HCHolidays = {
    list: function () {
      return allHolidays().map(function (item) {
        return { id: item.id, label: item.label };
      });
    },
    force: function (id) {
      sequenceMode = false;
      sequenceTransitioning = false;
      clearSequenceTimer();
      forcedId = String(id || "").toLowerCase();
      refresh();
    },
    clearForce: function () {
      sequenceMode = false;
      sequenceTransitioning = false;
      clearSequenceTimer();
      forcedId = "";
      refresh();
    },
    testAll: function (delay) {
      startSequence(delay);
    },
    next: function () {
      nextSequence();
    },
    stopTest: function () {
      stopSequence();
    },
    refresh: refresh
  };

  function start() {
    addStyles();
    makeBanner();
    loadConfig();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
