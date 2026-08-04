/* =========================================================
   HARLEY'S CLAN FORUM — LEGACY BIRTHDAY LOADER

   Birthday mode was moved to:
   header/header.html

   This file intentionally performs no actions. It remains in place
   temporarily so older cached copies of footer/footer.html do not
   return a missing-script error.
========================================================= */

(function () {
    "use strict";

    /* Remove any legacy floating birthday elements left by an older cache. */
    function removeLegacyBirthdayUi() {
        var banner = document.getElementById("hc-birthday-banner");
        var effects = document.getElementById("hc-birthday-effects");
        var style = document.getElementById("hc-birthday-style");

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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", removeLegacyBirthdayUi, { once: true });
    } else {
        removeLegacyBirthdayUi();
    }
})();
