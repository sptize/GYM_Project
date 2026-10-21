// Capa IndexedDB: stores catalog, athletes, sessions, kv
const DB=(()=>{let d;const S=['catalog','athletes','sessions','kv'];
const open=()=>d?Promise.resolve(d):new Promise((ok,no)=>{const r=indexedDB.open('bpgym',1);
r.onupgradeneeded=()=>{S.forEach(s=>{if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:s==='kv'?'k':'id'})})};
r.onsuccess=()=>{d=r.result;ok(d)};r.onerror=()=>no(r.error)});
const rq=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const st=async(s,m='readonly')=>(await open()).transaction(s,m).objectStore(s);
return{all:async s=>rq((await st(s)).getAll()),get:async(s,k)=>rq((await st(s)).get(k)),
put:async(s,v)=>rq((await st(s,'readwrite')).put(v)),del:async(s,k)=>rq((await st(s,'readwrite')).delete(k)),
// Restauración atómica: si algo falla, la transacción se aborta y no cambia nada
async replaceAll(data){const x=await open();return new Promise((ok,no)=>{const t=x.transaction(S,'readwrite');
S.forEach(s=>t.objectStore(s).clear());S.forEach(s=>(data[s]||[]).forEach(v=>t.objectStore(s).put(v)));
t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})}}})();
