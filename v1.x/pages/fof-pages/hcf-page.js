/* ==========================================================
   HARLEY'S CLAN FORUM — FOF PAGES RUNTIME
   Shared device mode + Flarum identity detection.
   Loads the global domain router and re-initializes safely after
   dynamic FoF page loads / Flarum SPA navigation.

   Runtime Version: 1.2.0
   Domain Cutover: October 12, 2026
   Updated: 2026-08-11
========================================================== */
(function(){
  "use strict";

  if(window.HCFPageRuntime){
    if(typeof window.HCFPageRuntime.refresh==="function")window.HCFPageRuntime.refresh();
    return;
  }

  var DOMAIN_ROUTER_SRC="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/hcf-domain-router.js?v=1.0.1";
  var resizeTimer=0;

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

  function makeRuntime(page){
    if(!page)return null;

    var existing=page.querySelector(".hcf-runtime");
    if(existing)return existing;

    var runtime=document.createElement("div");
    runtime.className="hcf-runtime";
    runtime.setAttribute("aria-label","Forum session information");
    runtime.innerHTML=
      '<div class="hcf-runtime-item"><span class="hcf-runtime-label">DEVICE MODE</span><span class="hcf-runtime-value hcf-runtime-device"><span class="hcf-runtime-dot" aria-hidden="true"></span><span class="hcf-runtime-device-text">STANDARD MODE</span></span></div>'+
      '<div class="hcf-runtime-item"><span class="hcf-runtime-label">IDENTITY</span><span class="hcf-runtime-value hcf-runtime-identity">GUEST_PROTOCOL</span></div>';

    var hero=page.querySelector(".hcf-hero");
    if(hero&&hero.parentNode){
      hero.parentNode.insertBefore(runtime,hero.nextSibling);
    }else{
      page.insertBefore(runtime,page.firstChild);
    }
    return runtime;
  }

  function updateDevice(page,runtime){
    if(!page||!runtime)return;

    var value=runtime.querySelector(".hcf-runtime-device");
    var text=runtime.querySelector(".hcf-runtime-device-text");
    if(!value||!text)return;

    var mobile=isMobilePerformanceDevice();
    var basic=isBasicMode();

    page.classList.toggle("hcf-mobile-performance",mobile);
    page.classList.toggle("hcf-basic-mode",basic);

    if(basic){
      value.className="hcf-runtime-value hcf-runtime-device is-limited";
      text.textContent="BASIC MODE";
    }else if(mobile){
      value.className="hcf-runtime-value hcf-runtime-device is-mobile";
      text.textContent="MOBILE MODE";
    }else{
      value.className="hcf-runtime-value hcf-runtime-device is-standard";
      text.textContent="STANDARD MODE";
    }
  }

  function updateIdentity(runtime){
    if(!runtime)return;

    var target=runtime.querySelector(".hcf-runtime-identity");
    if(!target)return;

    var username=getIdentity();
    if(!username){
      target.textContent="GUEST_PROTOCOL";
      target.className="hcf-runtime-value hcf-runtime-identity is-guest";
      return;
    }

    target.textContent="";
    target.className="hcf-runtime-value hcf-runtime-identity is-user";
    var link=document.createElement("a");
    link.href="/u/"+encodeURIComponent(username);
    link.textContent="@"+username;
    target.appendChild(link);
  }

  function refreshDomainLinks(){
    try{
      if(window.HCFDomainRouter&&typeof window.HCFDomainRouter.refresh==="function"){
        window.HCFDomainRouter.refresh();
      }
    }catch(error){}
  }

  function refresh(){
    loadDomainRouter();

    var pages=document.querySelectorAll(".hcf-page");
    for(var i=0;i<pages.length;i++){
      var page=pages[i];
      var runtime=makeRuntime(page);
      updateDevice(page,runtime);
      updateIdentity(runtime);
    }

    refreshDomainLinks();
  }

  function onResize(){
    window.clearTimeout(resizeTimer);
    resizeTimer=window.setTimeout(refresh,180);
  }

  window.HCFPageRuntime={
    version:"1.2.0",
    refresh:refresh,
    getIdentity:getIdentity,
    isMobilePerformanceDevice:isMobilePerformanceDevice
  };

  window.addEventListener("resize",onResize,{passive:true});
  window.addEventListener("hcf:fof-page:loaded",refresh);
  document.addEventListener("visibilitychange",function(){
    if(!document.hidden)refresh();
  });

  window.setInterval(function(){
    if(!document.hidden)refresh();
  },15000);

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",refresh,{once:true});
  }else{
    refresh();
  }
})();
