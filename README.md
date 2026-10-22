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

## Mis días (rutina semanal)
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 4827af80917331043a039e1ff63f48d18c1e08f3
Pestaña *Mis días*: elige cuántos días entrenas (1–7) y añade/ordena/elimina los ejercicios de cada día. Se guarda solo. En *Inicio* aparecen únicamente esos días; al entrar se marca el que toca (el siguiente al último que hiciste o saltaste). Al tocar un día: **Listo. ¡Vamos allá!** abre sus ejercicios (con tus pesos de la última vez en gris) y **Paso de hoy** lo salta y pasa al siguiente.

## Hidratación
Dentro de cada día abierto (después de *Listo. ¡Vamos allá!*): escribe la cantidad en ml o pomos y toca + para sumarla (500 ml + 500 ml …). Forma parte de la sesión y sale en resumen, exportaciones y Guardado General.
<<<<<<< HEAD
=======
=======
Pestaña *Mis días*: elige cuántos días entrenas (1–7) y añade/ordena/elimina los ejercicios de cada día. Se guarda solo. En *Inicio* aparecen únicamente esos días; al entrar se marca el que toca (el siguiente al último que hiciste o saltaste). Al tocar un día: **Listo** abre sus ejercicios (con tus pesos de la última vez en gris) y **Paso** lo salta y pasa al siguiente.

## Hidratación
En *Inicio*, campo diario en pomos o ml. Se incluye en el Guardado General y en las exportaciones.
>>>>>>> 361c7ffecdca13e6cfcdc2a0bb043d56da82e1d9
>>>>>>> 4827af80917331043a039e1ff63f48d18c1e08f3

## General
Datos personales, Creación y edición de catálogo y Guardado General son desplegables.

## Borrar datos
<<<<<<< HEAD
General → *Borrar datos / empezar de cero*: «Borrar historial» (sesiones y medidas) o «Borrar todo» (deja la app como nueva). Pide escribir BORRAR para confirmar.
=======
<<<<<<< HEAD
General → *Borrar datos / empezar de cero*: «Borrar historial» (sesiones y medidas) o «Borrar todo» (deja la app como nueva). Pide escribir BORRAR para confirmar.
=======
General → *Borrar datos / empezar de cero*: «Borrar historial» (sesiones, medidas, hidratación) o «Borrar todo» (deja la app como nueva). Pide escribir BORRAR para confirmar.
>>>>>>> 361c7ffecdca13e6cfcdc2a0bb043d56da82e1d9
>>>>>>> 4827af80917331043a039e1ff63f48d18c1e08f3
