# Ritmo — planificador semanal

Organizá tu semana hora por hora (00:00 a 23:00, los 7 días), marcá cada tarea como
hecha o no realizada (con motivo), y seguí el porcentaje de cumplimiento del día.
Si un día no llega al 70%, la app te avisa para que todavía puedas recuperarlo.

Es una aplicación web estática: HTML, CSS y JavaScript sin frameworks ni paso de
build. No necesita Node para funcionar ni para desplegarse.

## Estructura

```
index.html        estructura de la página
styles.css         estilos, paleta de colores y tema claro/oscuro
js/dates.js        helpers de fechas y semanas
js/storage.js       capa de persistencia (hoy: localStorage)
js/main.js          estado de la app, render y eventos
manifest.json       metadata para "agregar a pantalla de inicio" en el celular
icon.svg             ícono de la app
_devserver.ps1       servidor local mínimo para probar en tu PC (no hace falta para el deploy)
```

## Probarla en tu computadora

Como no tenés Node ni Python instalados, el repo incluye un servidor local muy
simple hecho en PowerShell (los módulos de JavaScript no funcionan abriendo el
`index.html` directamente con doble clic, por eso hace falta un servidor).

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File _devserver.ps1
```

Después abrí `http://localhost:5500` en el navegador. Si en algún momento instalás
Node, cualquier servidor estático (`npx serve`, `npx vite preview`, etc.) también
sirve — no hay nada específico de PowerShell en el resto del proyecto.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Primera versión de Ritmo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## Desplegar en Vercel

1. Entrá a vercel.com, "Add New Project" e importá el repo de GitHub.
2. Framework Preset: elegí **"Other"** (es sitio estático, no necesita build command
   ni output directory especiales).
3. Deploy. Cada push a `main` vuelve a desplegar automáticamente.

## Cómo funciona el aviso del 70%

- Mientras la pestaña esté abierta, si activás el recordatorio en Ajustes (ícono de
  engranaje) y llega la hora elegida sin haber llegado al 70% del día, aparece un
  modal con las tareas pendientes y, si diste permiso, una notificación del
  navegador.
- Esto es un recordatorio "en pestaña abierta", no una notificación push real en
  segundo plano: los navegadores no permiten avisos verdaderamente en background sin
  un service worker + servidor push, algo que solo tiene sentido agregar si el
  proyecto pasa a tener backend (ver Supabase abajo).
- Además, mientras estás en el día de hoy, si vas por debajo del 70% siempre ves un
  aviso fijo arriba de la lista de tareas con cuántas te faltan.

## Sumar usuarios y sincronización (Supabase)

Hoy todos los datos viven en `localStorage` del navegador, a través de `TaskStore`
en [`js/storage.js`](js/storage.js). Para pasar a Supabase cuando haya usuarios:

1. Crear un proyecto en Supabase y una tabla `tasks` con columnas equivalentes a
   las del objeto actual: `id, date, hour, title, status, reason, created_at, user_id`.
2. Agregar el cliente de Supabase vía `<script type="module">` con el paquete
   `@supabase/supabase-js` (tiene build ESM que se puede importar por URL de CDN,
   sin necesidad de Node) o migrar el proyecto a un build real (Next.js/Vite) si
   preferís manejar variables de entorno de forma más prolija.
3. Reemplazar las funciones de `TaskStore` (`list`, `add`, `update`, `remove`,
   `restore`) por las llamadas equivalentes a Supabase, manteniendo la misma forma
   de objeto `task`. El resto de `main.js` no necesita cambios porque ya trata todo
   como asíncrono.
4. Sumar autenticación (Supabase Auth) y filtrar tareas por `user_id`.

## Paleta y tipografía

- Tipografía de títulos: **Fraunces** (serif con carácter). Tipografía de
  interfaz/cuerpo: **Work Sans**. Ambas cargadas desde Google Fonts.
- Colores: fondo marfil cálido, verde bosque como color principal, terracota como
  acento cálido y mostaza para detalles — con variante oscura completa (se adapta
  al tema del sistema o se puede forzar con el botón de sol/luna).
- Sin emojis: los íconos son SVG lineales dibujados a mano para la propia app.
