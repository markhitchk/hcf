import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function patch(path, before, after, label) {
  const file = resolve(repositoryRoot, path);
  let source = readFileSync(file, "utf8");
  if (source.includes(after)) return;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${path}: expected one ${label} target, found ${count}`);
  source = source.replace(before, after);
  writeFileSync(file, source);
}

patch(
  "v1.x/core/header.html",
`    while(dateKey(high)===current){
      high+=6*60*60*1000;
    }`,
`    while(dateKey(high)===current&&high<start+(48*60*60*1000)){
      high+=6*60*60*1000;
    }`,
  "birthday midnight search bound"
);

patch(
  "v1.x/core/footer.html",
`    function queueIdentityRefresh(){
        if(identityRefreshQueued||document.hidden||!footerVisible){return}
        identityRefreshQueued=true;`,
`    function queueIdentityRefresh(){
        if(identityRefreshQueued||document.hidden||!footerVisible){return}
        if(!identityObserver){initIdentityObserver()}
        identityRefreshQueued=true;`,
  "identity observer retry"
);

patch(
  "v1.x/core/footer.html",
`        window.addEventListener("hcf:fof-page:loaded",queueIdentityRefresh);
        window.addEventListener("pageshow",queueIdentityRefresh,{passive:true});`,
`        window.addEventListener("hcf:fof-page:loaded",queueIdentityRefresh);
        window.addEventListener("hcf:core-fragment:loaded",queueIdentityRefresh);
        window.addEventListener("pageshow",queueIdentityRefresh,{passive:true});`,
  "core fragment identity event"
);
