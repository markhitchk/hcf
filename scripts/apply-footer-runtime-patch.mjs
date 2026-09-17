import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const footerPath = resolve(repositoryRoot, "v1.x/core/footer.html");
let source = readFileSync(footerPath, "utf8");

function replaceOnce(before, after, label) {
  const count = source.split(before).length - 1;
  if (count === 0) {
    if (source.includes(after)) return;
    throw new Error(`Footer patch target missing: ${label}`);
  }
  if (count !== 1) throw new Error(`Footer patch target is ambiguous (${count} matches): ${label}`);
  source = source.replace(before, after);
}

replaceOnce(
`    var clockTimer=0;
    var identityTimer=0;
    var footerVisible=false;`,
`    var clockTimer=0;
    var identityTimer=0;
    var identityObserver=null;
    var identityRefreshQueued=false;
    var footerVisible=false;`,
"identity runtime state"
);

replaceOnce(
`    function refreshIdentity(){
        var username=getIdentity();

        if(!username){
            text(identity,"GUEST_PROTOCOL");
            return;
        }

        identity.textContent="";
        var link=document.createElement("a");
        link.href="/u/"+encodeURIComponent(username);
        link.textContent="@"+username;
        identity.appendChild(link);
    }

    function updateClock(){`,
`    function refreshIdentity(){
        var username=getIdentity();

        if(!username){
            text(identity,"GUEST_PROTOCOL");
            return;
        }

        identity.textContent="";
        var link=document.createElement("a");
        link.href="/u/"+encodeURIComponent(username);
        link.textContent="@"+username;
        identity.appendChild(link);
    }

    function queueIdentityRefresh(){
        if(identityRefreshQueued||document.hidden||!footerVisible){return}
        identityRefreshQueued=true;
        var run=function(){
            identityRefreshQueued=false;
            refreshIdentity();
        };

        if("requestAnimationFrame" in window){window.requestAnimationFrame(run)}
        else{window.setTimeout(run,0)}
    }

    function initIdentityObserver(){
        if(identityObserver||!("MutationObserver" in window)){return}
        var host=document.querySelector(".App-header,.Header-secondary");
        if(!host){return}
        identityObserver=new MutationObserver(queueIdentityRefresh);
        identityObserver.observe(host,{
            childList:true,
            subtree:true,
            characterData:true
        });
    }

    function updateClock(){`,
"identity observer functions"
);

replaceOnce(
`        if(!identityTimer){
            identityTimer=window.setInterval(refreshIdentity,15000);
        }`,
`        if(!identityTimer){
            identityTimer=window.setInterval(function(){
                if(!document.hidden){refreshIdentity()}
            },60000);
        }`,
"identity fallback interval"
);

replaceOnce(
`    function initLiveUpdates(){
        document.addEventListener("visibilitychange",syncLiveUpdates);

        if(!("IntersectionObserver" in window)){`,
`    function initLiveUpdates(){
        document.addEventListener("visibilitychange",syncLiveUpdates);
        window.addEventListener("hcf:fof-page:loaded",queueIdentityRefresh);
        window.addEventListener("pageshow",queueIdentityRefresh,{passive:true});
        initIdentityObserver();

        if(!("IntersectionObserver" in window)){`,
"identity event hooks"
);

writeFileSync(footerPath, source);
