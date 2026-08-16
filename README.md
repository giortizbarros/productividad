# Ritmo — planificador semanal

Organiza tu semana hora por hora (00:00 a 23:00, los 7 días), marca cada tarea como
hecha o no realizada (con motivo), y sigue el porcentaje de cumplimiento del día.
Si un día no llega al 70%, la app muestra un aviso para poder recuperarlo todavía.

Es una aplicación web estática: HTML, CSS y JavaScript sin frameworks ni paso de
build. No necesita Node para funcionar ni para desplegarse.

## Estructura

```
index.html        estructura de la página
styles.css         estilos, paleta de colores y tema claro/oscuro
js/dates.js        helpers de fechas y semanas
js/storage.js       capa de persistencia (hoy: localStorage)
js/main.js          estado de la app, render y eventos
manifest.json       metadata para "agregar a pantalla de inicio" en el teléfono
icon.svg             ícono de la app
_devserver.ps1       servidor local mínimo para pruebas en la computadora (no hace falta para el deploy)
```

## Cómo probarla en la computadora

Como no hay Node ni Python instalados, el repositorio incluye un servidor local muy
simple hecho en PowerShell (los módulos de JavaScript no funcionan al abrir el
`index.html` directamente con doble clic, por eso hace falta un servidor).

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File _devserver.ps1
```

Después se abre `http://localhost:5500` en el navegador. Si en algún momento se
instala Node, cualquier servidor estático (`npx serve`, `npx vite preview`, etc.)
también sirve — no hay nada específico de PowerShell en el resto del proyecto.

## Cómo subir cambios a GitHub

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

## Despliegue en Vercel

1. En vercel.com, "Add New Project" e importar el repositorio de GitHub.
2. Framework Preset: seleccionar **"Other"** (es un sitio estático, no necesita build
   command ni output directory especiales).
3. Deploy. Cada push a `main` se despliega automáticamente.

## Cómo funciona el aviso del 70%

- Mientras la pestaña esté abierta, si el recordatorio está activado en Ajustes
  (ícono de engranaje) y llega la hora elegida sin haber alcanzado el 70% del día,
  aparece un modal con las tareas pendientes y, si se otorgó el permiso, una
  notificación del navegador.
- Este es un recordatorio "con la pestaña abierta", no una notificación push real en
  segundo plano: los navegadores no permiten avisos verdaderamente en segundo plano
  sin un service worker y un servidor push, algo que solo tiene sentido agregar si el
  proyecto pasa a tener backend (ver Supabase más abajo).
- Además, al ver el día de hoy, si el cumplimiento está por debajo del 70% siempre se
  muestra un aviso fijo arriba de la lista de tareas con cuántas faltan.

## Cómo sumar usuarios y sincronización (Supabase)

Hoy todos los datos viven en `localStorage` del navegador, a través de `TaskStore`
en [`js/storage.js`](js/storage.js). Para pasar a Supabase cuando haya usuarios:

1. Crear un proyecto en Supabase y una tabla `tasks` con columnas equivalentes a
   las del objeto actual: `id, date, hour, title, status, reason, created_at, user_id`.
2. Agregar el cliente de Supabase vía `<script type="module">` con el paquete
   `@supabase/supabase-js` (tiene build ESM que se puede importar por URL de CDN,
   sin necesidad de Node) o migrar el proyecto a un build real (Next.js/Vite) si se
   prefiere manejar variables de entorno de forma más prolija.
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
