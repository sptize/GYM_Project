// Sube V al cambiar archivos. Solo cachés: la base IndexedDB nunca se toca aquí.
<<<<<<< HEAD
const V='gymrat-v12',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
=======
<<<<<<< HEAD
const V='gymrat-v13',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
=======
<<<<<<< HEAD
const V='gymrat-v12',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
=======
const V='gymrat-v11',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
>>>>>>> 361c7ffecdca13e6cfcdc2a0bb043d56da82e1d9
>>>>>>> 25b98f5b2dfc6fa5e4264590912cab1ce94cd12d
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
>>>>>>> 4827af80917331043a039e1ff63f48d18c1e08f3
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// Red primero (siempre la versión más nueva si hay internet); sin conexión usa la caché
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})
.catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))))});
