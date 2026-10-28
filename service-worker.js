// Sube V al cambiar archivos. Solo cachés: la base IndexedDB nunca se toca aquí.
const V='gymrat-v20',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// Caché primero: la app abre al instante aunque la conexión sea lenta. En segundo plano se refresca la caché;
// las versiones nuevas llegan al subir V (el navegador reinstala todo y la app se recarga sola).
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
e.respondWith(caches.open(V).then(c=>c.match(e.request,{ignoreSearch:true})).then(hit=>{
const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>hit||caches.match('index.html'));
if(hit){e.waitUntil(net.catch(()=>{}));return hit}return net}))});
