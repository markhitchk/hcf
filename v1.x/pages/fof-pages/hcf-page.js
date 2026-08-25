/* ==========================================================
   HARLEY'S CLAN FORUM — FOF PAGES RUNTIME
   Silent shared device mode + Flarum identity detection.
   Loads the global domain router and re-initializes safely after
   dynamic FoF page loads / Flarum SPA navigation.

   Runtime Version: 1.4.1
   Domain Cutover: 2026-10-12T00:00:00-07:00
   Updated: 2026-08-25
========================================================== */
(function(){
  "use strict";

  var DOMAIN_ROUTER_SRC="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/hcf-domain-router.js?v=1.0.1";
  var SILENT_STYLE_ID="hcf-fof-silent-runtime";
  var resizeTimer=0;

  function installSilentRuntimeStyle(){
    if(document.getElementById(SILENT_STYLE_ID))return;

    var style=document.createElement("style");
    style.id=SILENT_STYLE_ID;
    style.textContent=
      ".hcf-page .hcf-runtime,"+
      ".hcf-page .hcf-runtime-item,"+
      ".hcf-page .hcf-runtime-label,"+
      ".hcf-page .hcf-runtime-value,"+
      ".hcf-page .hcf-runtime-device,"+
      ".hcf-page .hcf-runtime-identity,"+
      ".hcf-page [data-hcf-runtime-ui]{display:none!important;visibility:hidden!important;}";
    (document.head||document.documentElement).appendChild(style);
  }

  /* Install the silent override before checking for an older cached runtime. */
  installSilentRuntimeStyle();

  if(window.HCFPageRuntime){
    if(typeof window.HCFPageRuntime.refresh==="function")window.HCFPageRuntime.refresh();
    return;
  }

  function loadDomainRouter(){
    if(window.HCFDomainRouter)return;
    if(document.querySelector('script[data-hcf-domain-router]'))return;

    var script=document.createElement("script");
    script.src=DOMAIN_ROUTER_SRC;
    script.async=false;
    script.defer=false;
    script.setAttribute("data-hcf-domain-router","1.0.1");
    (document.head||document.documentElement).appendChild(script);
  }

  function normalizeUsername(value){
    var name=String(value||"").trim();
    var lower=name.toLowerCase();
    if(!name||lower==="guest"||lower==="guest_protocol"||lower.indexOf("sign in")!==-1||lower.indexOf("log in")!==-1){
      return "";
    }
    return name;
  }

  function isMobilePerformanceDevice(){
    var userAgent="";
    var touchPoints=0;
    var mobileHint=false;
    var touchFirst=false;
    var compactScreen=false;
    try{
      userAgent=navigator.userAgent||"";
      touchPoints=navigator.maxTouchPoints||0;
      mobileHint=Boolean(navigator.userAgentData&&navigator.userAgentData.mobile===true);
      touchFirst=window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      compactScreen=Math.min(window.screen.width||window.innerWidth,window.screen.height||window.innerHeight)<=1024;
    }catch(error){}
    var knownMobile=/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(userAgent);
    var iPadDesktopMode=/Macintosh/i.test(userAgent)&&touchPoints>1;
    return mobileHint||knownMobile||iPadDesktopMode||(touchFirst&&touchPoints>0&&compactScreen);
  }

  function isBasicMode(){
    try{
      return !window.CSS||!CSS.supports("display","grid");
    }catch(error){
      return true;
    }
  }

  function getIdentity(){
    try{
      if(window.app&&window.app.session&&window.app.session.user){
        var user=window.app.session.user;
        var username=typeof user.username==="function"?user.username():user.username;
        return normalizeUsername(username);
      }
    }catch(error){}

    var element=document.querySelector("header .Button--user .username,.App-header .Button--user .username,.Header-secondary .Button--user .username,.item-session .Button--user .username");
    return normalizeUsername(element?element.textContent:"");
  }

  function runtimeDisabled(page){
    if(!page)return false;
    return String(page.getAttribute("data-hcf-runtime")||"").toLowerCase()==="off";
  }

  function removeVisibleRuntime(page){
    if(!page)return;
    var runtimes=page.querySelectorAll(".hcf-runtime,[data-hcf-runtime-ui]");
    for(var i=0;i<runtimes.length;i++)runtimes[i].remove();
  }

  function updateDevice(page){
    if(!page)return;

    var mobile=isMobilePerformanceDevice();
    var basic=isBasicMode();
    var mode=basic?"basic":(mobile?"mobile":"standard");

    page.classList.toggle("hcf-mobile-performance",mobile&&!basic);
    page.classList.toggle("hcf-basic-mode",basic);
    page.setAttribute("data-hcf-device-mode",mode);
  }

  function updateIdentity(page){
    if(!page)return;

    var username=getIdentity();
    page.setAttribute("data-hcf-identity",username||"guest");
  }

  function refreshDomainLinks(){
    try{
      if(window.HCFDomainRouter&&typeof window.HCFDomainRouter.refresh==="function"){
        window.HCFDomainRouter.refresh();
      }
    }catch(error){}
  }

  function refresh(){
    installSilentRuntimeStyle();
    loadDomainRouter();

    var pages=document.querySelectorAll(".hcf-page");
    for(var i=0;i<pages.length;i++){
      var page=pages[i];

      /* Never show the old DEVICE MODE / MOBILE MODE / IDENTITY panel. */
      removeVisibleRuntime(page);

      if(runtimeDisabled(page)){
        page.classList.remove("hcf-mobile-performance","hcf-basic-mode");
        page.removeAttribute("data-hcf-device-mode");
        page.removeAttribute("data-hcf-identity");
        continue;
      }

      /* Keep detection active for CSS/JS behavior, but keep it silent. */
      updateDevice(page);
      updateIdentity(page);
    }

    refreshDomainLinks();
  }

  function onResize(){
    window.clearTimeout(resizeTimer);
    resizeTimer=window.setTimeout(refresh,180);
  }

  window.HCFPageRuntime={
    version:"1.4.1",
    refresh:refresh,
    getIdentity:getIdentity,
    isMobilePerformanceDevice:isMobilePerformanceDevice,
    runtimeDisabled:runtimeDisabled
  };

  window.addEventListener("resize",onResize,{passive:true});
  window.addEventListener("hcf:fof-page:loaded",refresh);
  document.addEventListener("visibilitychange",function(){
    if(!document.hidden)refresh();
  });

  window.setInterval(function(){
    if(!document.hidden)refresh();
  },30000);

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",refresh,{once:true});
  }else{
    refresh();
  }
})();
