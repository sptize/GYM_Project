# GYM RAT APP
PWA offline (HTML/CSS/JS + IndexedDB). Sin servidores ni CDN.
## Probar en local
VS Code → extensión *Live Server* → "Go Live". (No abras index.html con doble clic: no funciona el service worker.)
## Publicar en GitHub Pages
Sube estos archivos a un repositorio → Settings → Pages → rama `main`, carpeta `/ (root)`. URL: `https://USUARIO.github.io/REPO/`. Todas las rutas son relativas.
## Instalar en Android
Abre la URL en Chrome, espera a que cargue, Menú ⋮ → *Instalar aplicación*. Luego activa modo avión y ábrela para comprobar que funciona offline.
## Actualizar
Cambia `V` en `service-worker.js` (p. ej. `bpgym-v2`) y vuelve a subir. La base de datos no se toca.
## Copias
General → Exportación → Guardado General (guárdalo fuera del teléfono). La app ya no importa copias. El historial completo y cada sesión/día también se exportan en TXT y PDF (sin CSV).

## WhatsApp
En el primer inicio (o en General → Datos personales) guarda tu código de país y tu número de 8 dígitos. El botón verde *Exportar como mensaje a WhatsApp* abre tu chat con el resultado de la sesión ya escrito; tú pulsas enviar. Necesita internet.
