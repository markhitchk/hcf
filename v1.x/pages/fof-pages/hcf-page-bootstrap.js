(function () {
'use strict';
var BUILD='1.4.0', OWNER='markhitchk', REPO='hcf', BRANCH='main';
var FOLDER='v1.x/pages/fof-pages';
var CDN='https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+BRANCH+'/'+FOLDER+'/';
var API='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+FOLDER+'?ref='+encodeURIComponent(BRANCH);
var LOGO='https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+BRANCH+'/v1.x/assets/logos/HTG.svg';
var LOAD_TIMEOUT=8500;
var ROUTE_FILES={};
var ERR={
'invalid-route':{title:'Page link is invalid',msg:'The forum could not determine which page file to open.',ref:'HCF-PAGE-ROUTE',tpl:404,pill:'Route unavailable'},
'forbidden':{title:'Access forbidden',msg:'The page service understood the request, but access to this resource was denied.',ref:'HCF-PAGE-403',tpl:403,pill:'Access denied'},
'offline':{title:'You appear to be offline',msg:'Reconnect to the internet, then retry this page.',ref:'HCF-PAGE-OFFLINE',tpl:503,pill:'Connection unavailable'},
'timeout':{title:'Page took too long to load',msg:'The page service did not respond in time. This is usually temporary.',ref:'HCF-PAGE-TIMEOUT',tpl:503,pill:'Request timed out'},
'not-found':{title:'Page file not found',msg:'The requested forum page file could not be found. It may have been moved, renamed, or removed.',ref:'HCF-PAGE-404',tpl:404,pill:'Route unavailable'},
'rate-limited':{title:'Page service is busy',msg:'The upstream page service temporarily limited requests. Retry in a moment.',ref:'HCF-PAGE-429',tpl:503,pill:'Temporarily limited'},
'upstream-error':{title:'Page service unavailable',msg:'The upstream page service returned an error while loading this forum page.',ref:'HCF-PAGE-UPSTREAM',tpl:500,pill:'Server fault'},
'network-error':{title:'Network error',msg:'The forum could not reach the page service. Check your connection and retry.',ref:'HCF-PAGE-NETWORK',tpl:503,pill:'Connection failed'},
'empty-file':{title:'Page file is empty',msg:'The page file exists, but it does not contain any displayable content.',ref:'HCF-PAGE-EMPTY',tpl:500,pill:'Page data invalid'},
'render-failed':{title:'Page could not be displayed',msg:'The page file was found, but the browser could not render it correctly.',ref:'HCF-PAGE-RENDER',tpl:500,pill:'Render failure'},
'unavailable':{title:'Page unavailable',msg:'This page could not be loaded right now. Please retry.',ref:'HCF-PAGE-UNAVAILABLE',tpl:503,pill:'Temporarily unavailable'}
};
var frame=window.frameElement;
if(!frame||!frame.ownerDocument)return;
var doc=frame.ownerDocument, win=doc.defaultView||window.parent;
var page=frame.closest?frame.closest('.Pages[data-id][data-slug]'):null;
var body=page?(page.querySelector('.Pages-container .Post-body')||page.querySelector('.Post-body')):null;
var root=frame.parentElement?frame.parentElement.querySelector('[data-hcf-fof-import-root]'):null;
if(!page||!body||!root){console.error('[HCF FoF Bootstrap] Could not locate FoF page/root.');return;}
var id=String(page.getAttribute('data-id')||'').trim();
var slug=String(page.getAttribute('data-slug')||'').trim();
var key=id&&slug?id+'-'+slug:'';
var controller=null, timeoutId=0, timedOut=false, runToken=0;
function installUI(){
var old=doc.getElementById('hcf-fof-bootstrap-ui'); if(old) old.remove();
var s=doc.createElement('style'); s.id='hcf-fof-bootstrap-ui';
s.textContent=
'[data-hcf-fof-import-root]{max-width:760px;margin:18px auto;padding:20px 18px;box-sizing:border-box;background:#12171c;border:1px solid #00b8f0;border-radius:8px;color:#e8f8ff;text-align:center;font-family:Arial,sans-serif}' +
'[data-hcf-fof-import-root][data-hcf-error]{max-width:800px;padding:0;background:transparent;border:0;border-radius:0}' +
'.hcf-page-import-status{font-size:14px;font-weight:800;color:#00b8f0}.hcf-page-import-subtext{margin-top:6px;font-size:12px;color:#aebbc2}.hcf-page-loader-track{width:100%;max-width:340px;height:3px;margin:16px auto 0;overflow:hidden;background:#283138;border-radius:3px}.hcf-page-loader-bar{width:34%;height:100%;background:#00b8f0;transform:translateX(-120%);animation:hcfLoad 1.5s linear infinite}' +
'.hcf-e{position:relative;overflow:hidden;border:1px solid rgba(0,184,240,.34);border-radius:22px;background:linear-gradient(180deg,rgba(0,184,240,.04),transparent 28%),rgba(18,22,28,.97);box-shadow:0 24px 70px rgba(0,0,0,.42),0 0 28px rgba(0,184,240,.08);text-align:left}.hcf-e:before{content:"";position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,#00b8f0,transparent);box-shadow:0 0 18px rgba(0,184,240,.72)}' +
'.hcf-eb{display:flex;align-items:center;gap:13px;padding:17px 19px;border-bottom:1px solid rgba(0,184,240,.16);background:rgba(8,12,16,.34)}.hcf-el{width:45px;height:45px;flex:0 0 45px;object-fit:contain;border-radius:50%;filter:drop-shadow(0 0 8px rgba(0,184,240,.35))}.hcf-ebt{margin:0;color:#00b8f0;font-size:20px;font-weight:800;line-height:1.1}.hcf-ebs{margin:4px 0 0;color:#9cb7c2;font:700 10px/1.35 "Courier New",monospace;letter-spacing:.13em;text-transform:uppercase}' +
'.hcf-ec{padding:clamp(28px,6vw,50px);text-align:center}.hcf-ep{display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:6px 11px;border:1px solid rgba(0,184,240,.42);border-radius:999px;background:rgba(0,184,240,.08);color:#eefcff;font:800 11px/1 "Courier New",monospace;letter-spacing:.1em;text-transform:uppercase}.hcf-ed{width:7px;height:7px;border-radius:50%;background:#00b8f0;box-shadow:0 0 10px #00b8f0}' +
'.hcf-e[data-t="403"] .hcf-ep{border-color:rgba(255,180,84,.48);background:rgba(255,180,84,.10)}.hcf-e[data-t="403"] .hcf-ed{background:#ffb454;box-shadow:0 0 10px #ffb454}.hcf-e[data-t="500"] .hcf-ep{border-color:rgba(255,107,107,.48);background:rgba(255,107,107,.10)}.hcf-e[data-t="500"] .hcf-ed{background:#ff6b6b;box-shadow:0 0 10px #ff6b6b}.hcf-e[data-t="503"] .hcf-ep{border-color:rgba(255,209,102,.48);background:rgba(255,209,102,.10)}.hcf-e[data-t="503"] .hcf-ed{background:#ffd166;box-shadow:0 0 10px #ffd166}' +
'.hcf-en{margin:18px 0 2px;color:#00b8f0;font-size:clamp(70px,17vw,118px);font-weight:900;line-height:.9;letter-spacing:-.06em;text-shadow:2px 2px 0 #000,4px 4px 0 rgba(0,184,240,.16),0 0 24px rgba(0,184,240,.18)}.hcf-et{margin:18px 0 0;color:#eefcff;font-size:clamp(24px,5vw,35px);line-height:1.15}.hcf-em{max-width:590px;margin:14px auto 0;color:#9cb7c2;font-size:clamp(14px,2.4vw,17px);line-height:1.7}.hcf-ex{max-width:620px;margin:22px auto 0;padding:12px 14px;border:1px solid rgba(0,184,240,.16);border-radius:12px;background:#0c1015;color:#c8dde4;font:600 12px/1.55 "Courier New",monospace;text-align:left;overflow-wrap:anywhere}.hcf-ex strong{color:#00b8f0}' +
'.hcf-ea{display:flex;justify-content:center;flex-wrap:wrap;gap:11px;margin-top:27px}.hcf-btn{display:inline-flex;align-items:center;justify-content:center;min-width:150px;min-height:45px;padding:10px 17px;border:1px solid rgba(0,184,240,.58);border-radius:11px;color:#00b8f0;background:rgba(0,184,240,.08);font:800 14px/1.2 Arial,sans-serif;text-decoration:none;cursor:pointer;appearance:none;-webkit-appearance:none}.hcf-btn.p{border-color:#00b8f0;background:#00b8f0;color:#061013}.hcf-btn:focus-visible{outline:2px solid #00ffff;outline-offset:3px}' +
'.hcf-ef{display:flex;justify-content:space-between;gap:14px;padding:14px 19px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(0,184,240,.14);background:rgba(7,10,14,.38);color:#78939d;font:700 10px/1.4 "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase}.hcf-ef a{color:#00b8f0;text-decoration:none}' +
'@keyframes hcfLoad{to{transform:translateX(315%)}}@media(hover:hover){.hcf-btn:hover{transform:translateY(-1px);border-color:#00ffff;background:rgba(0,184,240,.14);box-shadow:0 8px 22px rgba(0,184,240,.11)}.hcf-btn.p:hover{background:#00ffff;color:#061013}}' +
'@media(max-width:767.98px){[data-hcf-fof-import-root]{margin:12px auto;padding:17px 14px}.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}[data-hcf-fof-import-root][data-hcf-error]{padding:0}.hcf-e{border-radius:17px}.hcf-eb{padding:14px}.hcf-el{width:40px;height:40px;flex-basis:40px}.hcf-ebt{font-size:18px}.hcf-ec{padding:28px 18px 30px}.hcf-en{font-size:clamp(64px,25vw,96px)}.hcf-ea{flex-direction:column}.hcf-btn{width:100%}.hcf-ef{flex-direction:column;align-items:center;text-align:center}}@media(prefers-reduced-motion:reduce){.hcf-page-loader-bar{width:100%;transform:none;animation:none;opacity:.72}}';
(doc.head||doc.documentElement).appendChild(s);
}
function emit(name,detail){try{win.dispatchEvent(new win.CustomEvent(name,{detail:detail}));}catch(e){}}
function loading(){
installUI();
root.setAttribute('aria-busy','true');
['data-hcf-error','data-hcf-error-code','data-hcf-error-template','data-hcf-loaded'].forEach(function(a){root.removeAttribute(a);});
root.innerHTML='<div class="hcf-page-import-status">Loading page…</div><div class="hcf-page-import-subtext">Harley\'s Clan Forum</div><div class="hcf-page-loader-track" aria-hidden="true"><div class="hcf-page-loader-bar"></div></div>';
}
function showError(type,extra){
installUI(); removeAssets();
type=ERR[type]?type:'unavailable';
var c=ERR[type], status=extra&&Number(extra.status), display=(status>=400&&status<=599)?status:c.tpl;
var ref=c.ref+(type==='upstream-error'&&status?'-'+status:'');
root.setAttribute('aria-busy','false'); root.setAttribute('data-hcf-error',type); root.setAttribute('data-hcf-error-code',ref); root.setAttribute('data-hcf-error-template',String(c.tpl)); root.removeAttribute('data-hcf-loaded');
root.innerHTML='<section class="hcf-e" data-t="'+c.tpl+'" role="alert" aria-labelledby="hcf-et"><header class="hcf-eb"><img class="hcf-el" alt="" aria-hidden="true"><div><p class="hcf-ebt">Harley\'s Clan Forum</p><p class="hcf-ebs">Forum Network // Error Handler</p></div></header><div class="hcf-ec"><div class="hcf-ep"><span class="hcf-ed"></span><span class="hcf-pt"></span></div><div class="hcf-en" aria-hidden="true"></div><h2 class="hcf-et" id="hcf-et"></h2><p class="hcf-em"></p><div class="hcf-ex"><strong></strong><span></span></div><div class="hcf-ea"><button class="hcf-btn p" type="button" data-r>Retry Page</button><button class="hcf-btn" type="button" data-b>Go Back</button><a class="hcf-btn" href="https://forum.harleytg.com/p/17-support">Get Support</a></div></div><footer class="hcf-ef"><span></span><a href="https://forum.harleytg.com/">forum.harleytg.com</a></footer></section>';
var q=function(x){return root.querySelector(x);};
q('.hcf-el').src=LOGO; q('.hcf-pt').textContent=c.pill; q('.hcf-en').textContent=String(display); q('.hcf-et').textContent=c.title; q('.hcf-em').textContent=c.msg; q('.hcf-ex strong').textContent=ref;
var details=[]; if(key)details.push('Route: /p/'+key); if(status)details.push('Upstream HTTP: '+status); if(extra&&extra.source)details.push('Source: '+extra.source); q('.hcf-ex span').textContent=details.length?' // '+details.join(' // '):''; q('.hcf-ef span').textContent='Harley\'s Clan Forum // Flarum 1.x // Loader '+BUILD;
q('[data-r]').addEventListener('click',function(){this.disabled=true;this.textContent='Retrying…';try{win.location.reload();}catch(e){this.disabled=false;this.textContent='Retry Page';}});
q('[data-b]').addEventListener('click',function(){try{if(win.history.length>1)win.history.back();else win.location.href=win.location.origin+'/';}catch(e){try{win.location.href='/';}catch(_){} }});
emit('hcf:fof-page:error',{build:BUILD,id:id,slug:slug,key:key,type:type,code:ref,template:c.tpl,status:status||null,source:extra&&extra.source?extra.source:null});
}
function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function options(accept){var o={method:'GET',cache:'no-store',credentials:'omit',headers:{Accept:accept}};if(controller)o.signal=controller.signal;return o;}
function classify(s){if(s===403)return'forbidden';if(s===404)return'not-found';if(s===429)return'rate-limited';if(s>=500||s>=400)return'upstream-error';return'unavailable';}
async function getText(url,accept){
if(win.navigator&&win.navigator.onLine===false)return{ok:false,type:'offline',status:0,source:url};
try{
var r=await fetch(url+(url.indexOf('?')<0?'?':'&')+'hcf='+Date.now(),options(accept||'text/html,text/plain;q=0.9,*/*;q=0.1'));
if(!r.ok)return{ok:false,type:classify(r.status),status:r.status,source:url};
var t=await r.text(); if(!t||!t.trim())return{ok:false,type:'empty-file',status:r.status,source:url};
return{ok:true,text:t,status:r.status,source:url};
}catch(e){if(timedOut||(e&&e.name==='AbortError'))return{ok:false,type:'timeout',status:0,source:url};if(win.navigator&&win.navigator.onLine===false)return{ok:false,type:'offline',status:0,source:url};return{ok:false,type:'network-error',status:0,source:url};}
}
function best(a,b){var r={'offline':100,'timeout':95,'rate-limited':90,'forbidden':85,'network-error':80,'upstream-error':70,'empty-file':60,'render-failed':55,'not-found':10,'unavailable':0};if(!a)return b;if(!b)return a;return(r[b.type]||0)>(r[a.type]||0)?b:a;}
async function direct(){var name=ROUTE_FILES[key]||(key+'.html'),url=CDN+encodeURIComponent(name),r=await getText(url);return r.ok?{result:{html:r.text,url:url,file:name,sourceKind:'cdn'},error:null}:{result:null,error:r};}
async function discover(){
var d=await getText(API,'application/vnd.github+json,application/json;q=0.9,*/*;q=0.1'); if(!d.ok)return{result:null,error:d};
var entries;try{entries=JSON.parse(d.text);}catch(e){return{result:null,error:{type:'upstream-error',status:200,source:API}};} if(!Array.isArray(entries))return{result:null,error:{type:'upstream-error',status:200,source:API}};
var files=entries.filter(function(e){return e&&e.type==='file'&&/\.html$/i.test(e.name||'')&&e.download_url;});
var ns=normalize(slug),prefix=id+'-',found=null,score=-1;
files.forEach(function(e){var n=String(e.name||''),stem=n.replace(/\.html$/i,''),sn=normalize(stem),s=-1;if(n===key+'.html')s=1000;else if(n.indexOf(prefix)===0&&normalize(stem.slice(prefix.length))===ns)s=900;else if(sn===ns)s=600;else if(sn.slice(-(ns.length+1))==='-'+ns)s=500;if(s>score){found=e;score=s;}});
if(!found||score<0)return{result:null,error:{type:'not-found',status:404,source:API}};
var f=await getText(found.download_url);return f.ok?{result:{html:f.text,url:found.download_url,file:found.name,sourceKind:'github'},error:null}:{result:null,error:f};
}
function resolve(v,base){if(!v)return v;try{return new URL(v,base).href;}catch(e){return v;}}
function cdnize(url){try{var u=new URL(url);if(u.hostname!=='raw.githubusercontent.com')return u.href;var p=u.pathname.split('/').filter(Boolean);if(p.length<4)return u.href;return'https://cdn.jsdelivr.net/gh/'+p.shift()+'/'+p.shift()+'@'+p.shift()+'/'+p.join('/');}catch(e){return url;}}
function fixAssets(parsed,base){Array.prototype.forEach.call(parsed.querySelectorAll('[src]'),function(e){var v=e.getAttribute('src');if(v)e.setAttribute('src',resolve(v,base));});Array.prototype.forEach.call(parsed.querySelectorAll('[poster]'),function(e){var v=e.getAttribute('poster');if(v)e.setAttribute('poster',resolve(v,base));});Array.prototype.forEach.call(parsed.querySelectorAll('[href]'),function(e){var v=e.getAttribute('href');if(!v||v.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(v))return;e.setAttribute('href',resolve(v,base));});}
function removeAssets(){Array.prototype.forEach.call(doc.querySelectorAll('[data-hcf-fof-import-asset]'),function(n){n.remove();});}
function styles(parsed,base){Array.prototype.forEach.call(parsed.querySelectorAll('style'),function(o){var s=doc.createElement('style');s.setAttribute('data-hcf-fof-import-asset',key);s.textContent=o.textContent||'';(doc.head||doc.documentElement).appendChild(s);o.remove();});Array.prototype.forEach.call(parsed.querySelectorAll('link[rel="stylesheet"]'),function(o){var h=resolve(o.getAttribute('href'),base);if(!h)return;var l=doc.createElement('link');l.rel='stylesheet';l.href=cdnize(h);l.setAttribute('data-hcf-fof-import-asset',key);(doc.head||doc.documentElement).appendChild(l);o.remove();});}
function runScript(o,base){return new Promise(function(done){var s=doc.createElement('script'),src=o.getAttribute('src');Array.prototype.forEach.call(o.attributes||[],function(a){if(a.name.toLowerCase()!=='src')s.setAttribute(a.name,a.value);});s.setAttribute('data-hcf-fof-import-asset',key);if(!src){s.textContent=o.textContent||'';(doc.head||doc.documentElement).appendChild(s);s.remove();done(true);return;}var r=cdnize(resolve(src,base));if(/\/hcf-page\.js(?:\?|$)/i.test(r))r='https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/pages/fof-pages/hcf-page.js?v=1.4.1';if(doc.querySelector('script[src="'+r.replace(/"/g,'\\"')+'"]')){if(/\/hcf-page\.js(?:\?|$)/i.test(r)&&win.HCFPageRuntime&&typeof win.HCFPageRuntime.refresh==='function'){try{win.HCFPageRuntime.refresh();}catch(e){}}done(true);return;}s.src=r;s.async=false;s.onload=function(){done(true);};s.onerror=function(){console.warn('[HCF FoF Bootstrap] Optional page script failed:',r);done(false);};(doc.head||doc.documentElement).appendChild(s);});}
async function render(r){
var parsed=new DOMParser().parseFromString(r.html,'text/html'); if(!parsed||!parsed.body){var e=new Error('parse');e.hcfType='render-failed';throw e;}
fixAssets(parsed,r.url); var scripts=Array.prototype.slice.call(parsed.querySelectorAll('script'));scripts.forEach(function(s){s.remove();});removeAssets();styles(parsed,r.url);
var nodes=Array.prototype.slice.call(parsed.body.childNodes).map(function(n){return doc.importNode(n,true);});if(!nodes.some(function(n){return n.nodeType===1||(n.nodeType===3&&String(n.textContent||'').trim());})){var x=new Error('empty');x.hcfType='empty-file';throw x;}
root.replaceChildren.apply(root,nodes);['data-hcf-error','data-hcf-error-code','data-hcf-error-template'].forEach(function(a){root.removeAttribute(a);});root.setAttribute('data-hcf-source-file',r.file);root.setAttribute('data-hcf-source-url',r.url);root.setAttribute('data-hcf-source-kind',r.sourceKind||'unknown');root.setAttribute('data-hcf-loaded','true');root.setAttribute('aria-busy','false');
var failed=0;for(var i=0;i<scripts.length;i++)if(!(await runScript(scripts[i],r.url)))failed++;emit('hcf:fof-page:loaded',{build:BUILD,id:id,slug:slug,file:r.file,source:r.url,sourceKind:r.sourceKind||'unknown',scriptWarnings:failed});
}
async function start(){
var token=++runToken;if(!id||!slug){showError('invalid-route');return;}
if(timeoutId)win.clearTimeout(timeoutId);if(controller){try{controller.abort();}catch(e){}}
controller=typeof AbortController==='function'?new AbortController():null;timedOut=false;root.setAttribute('data-hcf-page',key);loading();
timeoutId=win.setTimeout(function(){timedOut=true;if(controller){try{controller.abort();}catch(e){}}},LOAD_TIMEOUT);
var err=null;
try{var d=await direct();if(token!==runToken)return;if(d.result){await render(d.result);return;}err=best(err,d.error);if(!timedOut&&d.error&&d.error.type!=='offline'){var f=await discover();if(token!==runToken)return;if(f.result){await render(f.result);return;}err=best(err,f.error);}if(token===runToken)showError(timedOut?'timeout':(err&&err.type)||'unavailable',err);}catch(e){if(token===runToken)showError(e&&e.hcfType?e.hcfType:'render-failed');console.error('[HCF FoF Bootstrap]',e);}finally{if(timeoutId){win.clearTimeout(timeoutId);timeoutId=0;}}
}
start().finally(function(){if(!root.hasAttribute('data-hcf-error')){try{frame.remove();}catch(e){}}});
})();
