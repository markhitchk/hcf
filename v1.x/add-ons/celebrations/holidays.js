/* Deprecated compatibility loader. Use ../seasonal/holidays.js. */
(function () {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/seasonal/holidays.js';
  script.defer = true;
  document.head.appendChild(script);
})();
