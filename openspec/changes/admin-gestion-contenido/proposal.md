# Proposal

## Why

La API de administración (`admin-api-contenido`) ya permite editar todo el contenido del sitio, pero el panel admin solo tiene el login y un panel vacío. Hace falta la interfaz para que TAMILA cargue su WhatsApp real, corrija los textos de muestra y reemplace las fotos de ejemplo por trabajos reales sin pedirle nada a un desarrollador, en lo posible desde el celular, apenas termina una obra.

## What Changes

- **Navegación del panel** pensada primero para el celular: barra inferior con las secciones principales y un menú "Más" en el celular, y menú lateral en la compu. El inicio del panel pasa a tener accesos a cada sección y un link "Ver el sitio".
- **Pantallas de edición** que usan `/api/admin/*`:
  - **Configuración del sitio**: hero (textos y foto), WhatsApp, redes, horario, footer y SEO.
  - **Servicios**: lista con estado y número de capítulo, creación, edición (textos, "qué incluye", SEO, portada, galería, trabajo destacado), publicar o despublicar y borrar.
  - **Trabajos**: lista filtrable por servicio, creación, edición (datos, antes/después, galería), publicar o despublicar y borrar.
  - **Cómo trabajamos** y **preguntas frecuentes**: edición en línea, alta, baja y publicación.
- **Reordenar arrastrando y soltando** servicios, trabajos, pasos y preguntas, con el dedo, el mouse o el teclado.
- **Biblioteca de imágenes**: subir fotos desde la galería o la cámara del celular, ver el peso y dónde se usa cada imagen, editar el texto alternativo y el crédito, y borrar las que no se usan. Las fotos se suben enteras, sin recortar. Las muy grandes se achican en el navegador antes de subir, sin cambiar su encuadre.
- **Selector de imágenes** reutilizable en los formularios: elegir de la biblioteca o subir una nueva sin salir del formulario.
- **Experiencia de edición**: validación con los mismos esquemas que la API, errores de la API mostrados en cada campo, aviso al salir con cambios sin guardar, confirmación antes de borrar, mensajes de éxito o error, y aviso de que el sitio se actualiza en hasta un minuto.

Fuera de alcance: recorte o edición de fotos, vista previa del sitio antes de guardar, historial de cambios, varios usuarios o roles, y edición desde el sitio público.

## Capabilities

### New Capabilities
- `admin-navigation`: estructura y navegación del panel admin (celular y compu), inicio del panel y acceso al sitio público.
- `admin-content-editing`: pantallas para editar configuración, servicios, trabajos, pasos y preguntas frecuentes, incluidos el orden, la publicación, el borrado y el manejo de errores y cambios sin guardar.
- `admin-media-library`: biblioteca de imágenes, subida desde el celular o la compu y selector de imágenes para los formularios.

### Modified Capabilities
<!-- Ninguna: admin-auth y frontend-shell no cambian sus requisitos; las rutas nuevas son protegidas y se cargan de forma diferida como ya exigen. -->

## Impact

- **Depende de** `admin-api-contenido` (archivado): consume `/api/admin/*` y los esquemas de `@tamila/shared` (`packages/shared/src/admin`).
- `apps/admin`: features nuevos (`settings`, `services`, `projects`, `sections`, `media` y `content` con las piezas de edición compartidas), el inicio del panel y el layout reescritos, y rutas nuevas con carga diferida.
- `packages/ui`: componentes nuevos de shadcn (Textarea, Switch, Dialog, AlertDialog, Sheet, Badge, Sonner, etc.) agregados con su CLI oficial.
- Dependencias nuevas en `apps/admin`: `@dnd-kit/core`, `@dnd-kit/sortable` y `@dnd-kit/utilities` (reordenar), y `sonner` (vía shadcn).
- Configuración: variable nueva `VITE_PUBLIC_SITE_URL` en el build del admin (link "Ver el sitio"), en `.env.example`, `caddy.Dockerfile`, `compose.prod.yml` y el workflow de deploy, más una variable de GitHub `PUBLIC_SITE_URL`.
- Tests: Vitest + Testing Library en `apps/admin` y flujos de Playwright en `e2e/tests/admin`.
