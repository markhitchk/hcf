/* Compatibility loader. Canonical file: addons/celebrations/holidays.js */
(function () {
  "use strict";
  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/celebrations/holidays.js";
  script.defer = true;
  document.head.appendChild(script);
})();
