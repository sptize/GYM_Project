// Sube V al cambiar archivos. Solo cachés: la base IndexedDB nunca se toca aquí.
<<<<<<< HEAD
const V='gymrat-v12',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
=======
const V='gymrat-v11',F=['./','index.html','styles.css','app.js','db.js','manifest.webmanifest','icon-192.png','icon-512.png'];
>>>>>>> 361c7ffecdca13e6cfcdc2a0bb043d56da82e1d9
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).catch(()=>caches.match('index.html'))))});
