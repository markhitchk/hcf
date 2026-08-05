/* =========================================================
   HARLEY'S CLAN FORUM — AUTOMATIC HOLIDAY BANNER
   Folder: /holidays
   Time zone: America/Los_Angeles
========================================================= */
(function () {
  "use strict";

  var script = document.currentScript;
  var base = script && script.src ? script.src.split(/[?#]/)[0].replace(/[^/]+$/, "") : "";
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

  function h(id, label, title, subtitle, icon, rule, gradient, particles) {
    return { id: id, label: label, title: title, subtitle: subtitle, icon: icon, rule: rule, gradient: gradient, particles: particles };
  }
  function fixed(month, day) { return { type: "fixed", month: month, day: day }; }
  function nth(month, weekday, number) { return { type: "nth", month: month, weekday: weekday, nth: number }; }
  function last(month, weekday) { return { type: "last", month: month, weekday: weekday }; }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function pacificDate() {
    var p = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timeZone || "America/Los_Angeles",
      year: "numeric", month: "numeric", day: "numeric"
    }).formatToParts(new Date());
    var out = { year: 0, month: 0, day: 0 };
    p.forEach(function (part) {
      if (part.type === "year" || part.type === "month" || part.type === "day") out[part.type] = Number(part.value);
    });
    out.iso = out.year + "-" + pad(out.month) + "-" + pad(out.day);
    return out;
  }

  function easter(year) {
    var a = year % 19, b = Math.floor(year / 100), c = year % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), x = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - x - k) % 7;
    var m = Math.floor((a + 11 * x + 22 * l) / 451);
    var month = Math.floor((x + l - 7 * m + 114) / 31);
    return { month: month, day: ((x + l - 7 * m + 114) % 31) + 1 };
  }

  function ruleDate(rule, year) {
    if (rule.type === "fixed") return { month: rule.month, day: rule.day };
    if (rule.type === "easter") return easter(year);
    if (rule.type === "nth") {
      var first = new Date(Date.UTC(year, rule.month - 1, 1)).getUTCDay();
      return { month: rule.month, day: 1 + ((rule.weekday - first + 7) % 7) + 7 * (rule.nth - 1) };
    }
    if (rule.type === "last") {
      var total = new Date(Date.UTC(year, rule.month, 0)).getUTCDate();
      var wd = new Date(Date.UTC(year, rule.month - 1, total)).getUTCDay();
      return { month: rule.month, day: total - ((wd - rule.weekday + 7) % 7) };
    }
    return null;
  }

  function normalizeCustom(item) {
    if (!item || !item.id || !item.month || !item.day) return null;
    return h(
      String(item.id), item.label || item.id, item.title || item.label || item.id,
      item.subtitle || "Harley’s Clan Holiday Celebration", item.icon || "🎉",
      fixed(Number(item.month), Number(item.day)),
      Array.isArray(item.gradient) && item.gradient.length ? item.gradient : ["#083b4d", "#166b87", "#7a35d6", "#d45c98"],
      Array.isArray(item.particles) && item.particles.length ? item.particles : ["✦", "★", "●", "◆"]
    );
  }

  function allHolidays() {
    return holidays.concat((config.customHolidays || []).map(normalizeCustom).filter(Boolean));
  }

  function queryForce() {
    try {
      var value = new URLSearchParams(location.search).get("hcHoliday");
      return value ? value.toLowerCase() : "";
    } catch (e) { return ""; }
  }

  function activeHoliday(date) {
    var list = allHolidays();
    var wanted = forcedId || queryForce();
    if (wanted === "off") return null;
    if (wanted) return list.filter(function (item) { return item.id === wanted; })[0] || null;
    for (var i = 0; i < list.length; i++) {
      var d = ruleDate(list[i].rule, date.year);
      if (d && d.month === date.month && d.day === date.day) return list[i];
    }
    return null;
  }

  function storageGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} }

  function addStyles() {
    if (document.getElementById("hc-holiday-style")) return;
    var style = document.createElement("style");
    style.id = "hc-holiday-style";
    style.textContent = "#hc-holiday-header,#hc-holiday-header *,#hc-holiday-effects,#hc-holiday-effects *{box-sizing:border-box}#hc-holiday-header[hidden]{display:none!important}#hc-holiday-header{--g:linear-gradient(115deg,#083b4d,#166b87,#7a35d6,#d45c98);position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:54px;margin:0;padding:8px 48px 8px 16px;overflow:hidden;border-top:1px solid rgba(255,255,255,.72);border-bottom:1px solid rgba(255,255,255,.72);background:var(--g);color:#fff;text-align:center;box-shadow:0 7px 22px rgba(0,0,0,.32),0 0 22px rgba(0,255,255,.24),inset 0 1px rgba(255,255,255,.18);animation:hcHolidayIn .65s cubic-bezier(.2,.8,.2,1) both,hcHolidayGlow 3s ease-in-out .65s infinite}#hc-holiday-header:before{content:\"\";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 15% 40%,rgba(255,255,255,.2),transparent 22%),radial-gradient(circle at 82% 50%,rgba(255,255,255,.16),transparent 26%)}#hc-holiday-header:after{content:\"\";position:absolute;top:-45%;left:-40%;z-index:-1;width:34%;height:190%;opacity:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),rgba(255,255,255,.42),rgba(255,255,255,.08),transparent);transform:skewX(-18deg);animation:hcHolidaySweep 4.8s ease-in-out infinite}.hc-holiday-icon{position:relative;z-index:3;flex:0 0 auto;font-size:27px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));animation:hcHolidayFloat 1.55s ease-in-out infinite}.hc-holiday-copy{position:relative;z-index:3;min-width:0}.hc-holiday-copy strong{display:block;color:#fff;font:900 15px/1.2 Arial,sans-serif;letter-spacing:.055em;text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 9px rgba(255,255,255,.3)}.hc-holiday-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.94);font:700 9px/1.35 \"Courier New\",monospace;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.42)}#hc-holiday-close{position:absolute;top:50%;right:10px;z-index:5;display:grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid rgba(255,255,255,.46);border-radius:50%;background:rgba(0,0,0,.22);color:#fff;cursor:pointer;font:700 20px/1 Arial,sans-serif;transform:translateY(-50%);transition:.18s}#hc-holiday-close:hover,#hc-holiday-close:focus-visible{border-color:#fff;background:rgba(0,0,0,.44);outline:none;transform:translateY(-50%) scale(1.08)}.hc-holiday-particles{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}.hc-holiday-particles i,#hc-holiday-effects i{position:absolute;top:-30px;left:var(--x);display:block;color:var(--c);font-style:normal;font-size:var(--s);line-height:1;opacity:var(--o,.84);text-shadow:0 0 4px rgba(255,255,255,.28);animation:hcHolidayFall var(--d) linear infinite;animation-delay:var(--delay)}#hc-holiday-effects{position:fixed;inset:0;z-index:790;overflow:hidden;pointer-events:none;contain:strict}@keyframes hcHolidayIn{from{opacity:0;transform:translateY(-100%) scaleY(.72);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}@keyframes hcHolidayGlow{50%{box-shadow:0 8px 25px rgba(0,0,0,.35),0 0 30px rgba(255,255,255,.28),inset 0 1px rgba(255,255,255,.24)}}@keyframes hcHolidaySweep{0%,12%{left:-40%;opacity:0}20%{opacity:.95}68%{opacity:.55}80%,100%{left:115%;opacity:0}}@keyframes hcHolidayFloat{0%,100%{transform:translateY(1px) rotate(-5deg) scale(.97)}50%{transform:translateY(-3px) rotate(5deg) scale(1.06)}}@keyframes hcHolidayFall{from{transform:translate3d(0,-8vh,0) rotate(0)}to{transform:translate3d(var(--drift),112vh,0) rotate(780deg)}}@media(max-width:600px){#hc-holiday-header{min-height:52px;gap:8px;padding:7px 40px 7px 9px}.hc-holiday-icon{font-size:22px}.hc-holiday-copy strong{font-size:12px;letter-spacing:.025em}.hc-holiday-copy small{font-size:8px;letter-spacing:.07em}#hc-holiday-close{right:6px;width:29px;height:29px;font-size:17px}}@media(prefers-reduced-motion:reduce){#hc-holiday-header,#hc-holiday-header:after,.hc-holiday-icon,.hc-holiday-particles i,#hc-holiday-effects i{animation:none!important}#hc-holiday-effects{display:none!important}}";
    document.head.appendChild(style);
  }

  function makeBanner() {
    var banner = document.getElementById("hc-holiday-header");
    if (banner) return banner;
    banner = document.createElement("section");
    banner.id = "hc-holiday-header";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = '<span class="hc-holiday-icon" aria-hidden="true"></span><div class="hc-holiday-copy"><strong></strong><small></small></div><button id="hc-holiday-close" type="button" aria-label="Close holiday announcement">×</button><span class="hc-holiday-particles" aria-hidden="true"></span>';
    var stack = document.querySelector("#hc-header-stack,.hc-header-stack") || document.body;
    var birthday = document.getElementById("hc-birthday-header");
    if (birthday && birthday.parentNode === stack) stack.insertBefore(banner, birthday);
    else stack.appendChild(banner);
    banner.querySelector("#hc-holiday-close").addEventListener("click", function () {
      var d = pacificDate();
      if (currentId) storageSet("hc-holiday-dismissed-" + d.iso + "-" + currentId, "yes");
      banner.hidden = true;
      removeEffects();
    });
    return banner;
  }

  function particles(container, item, amount, page) {
    container.textContent = "";
    for (var i = 0; i < amount; i++) {
      var piece = document.createElement("i");
      piece.textContent = item.particles[Math.floor(Math.random() * item.particles.length)];
      piece.style.setProperty("--x", Math.random() * 100 + "%");
      piece.style.setProperty("--s", (page ? 10 : 7) + Math.random() * (page ? 14 : 9) + "px");
      piece.style.setProperty("--c", ["#fff", "#00ffff", "#ffd76a", "#ff8bd8", "#86b8ff"][Math.floor(Math.random() * 5)]);
      piece.style.setProperty("--d", (page ? 7 : 2.8) + Math.random() * (page ? 8 : 3.2) + "s");
      piece.style.setProperty("--delay", -Math.random() * (page ? 14 : 5) + "s");
      piece.style.setProperty("--drift", (-90 + Math.random() * 180) + "px");
      piece.style.setProperty("--o", (.48 + Math.random() * .42).toFixed(2));
      container.appendChild(piece);
    }
  }

  function removeEffects() {
    var layer = document.getElementById("hc-holiday-effects");
    if (layer) layer.remove();
  }

  function buildEffects(item) {
    removeEffects();
    if (!config.pageEffects) return;
    var birthday = document.getElementById("hc-birthday-header");
    if (birthday && !birthday.hidden) return;
    var layer = document.createElement("div");
    layer.id = "hc-holiday-effects";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    particles(layer, item, innerWidth <= 600 ? 28 : 48, true);
  }

  function refresh() {
    if (!document.body) return;
    addStyles();
    var banner = makeBanner();
    var date = pacificDate();
    var item = config.enabled ? activeHoliday(date) : null;
    if (!item) {
      currentId = "";
      banner.hidden = true;
      removeEffects();
      return;
    }
    var birthday = document.getElementById("hc-birthday-header");
    if (!config.showWithBirthday && birthday && !birthday.hidden) {
      banner.hidden = true;
      removeEffects();
      return;
    }
    currentId = item.id;
    banner.style.setProperty("--g", "linear-gradient(115deg," + item.gradient.join(",") + ")");
    banner.querySelector(".hc-holiday-icon").textContent = item.icon;
    banner.querySelector("strong").textContent = item.title;
    banner.querySelector("small").textContent = item.subtitle + " • " + item.label;
    banner.setAttribute("aria-label", item.label + " celebration");
    particles(banner.querySelector(".hc-holiday-particles"), item, 24, false);
    var dismissed = storageGet("hc-holiday-dismissed-" + date.iso + "-" + item.id) === "yes";
    banner.hidden = dismissed;
    if (dismissed) removeEffects(); else buildEffects(item);
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function tick() {
      refresh();
      timer = setTimeout(tick, Math.max(10000, Number(config.checkIntervalMs) || 30000));
    }, Math.max(10000, Number(config.checkIntervalMs) || 30000));
  }

  function loadConfig() {
    if (!base || typeof fetch !== "function") { refresh(); schedule(); return; }
    fetch(base + "holidays.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Holiday settings unavailable");
      return r.json();
    }).then(function (data) {
      Object.keys(config).forEach(function (key) { if (Object.prototype.hasOwnProperty.call(data, key)) config[key] = data[key]; });
      refresh(); schedule();
    }).catch(function () { refresh(); schedule(); });
  }

  window.HCHolidays = {
    list: function () { return allHolidays().map(function (x) { return { id: x.id, label: x.label }; }); },
    force: function (id) { forcedId = String(id || "").toLowerCase(); refresh(); },
    clearForce: function () { forcedId = ""; refresh(); },
    refresh: refresh
  };

  function start() { addStyles(); refresh(); loadConfig(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
