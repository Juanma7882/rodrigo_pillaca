# Proposal

## Why

Todo el contenido del sitio público (textos, servicios, trabajos, pasos, preguntas, datos de contacto e imágenes) ya vive en la base, pero solo se puede cambiar corriendo el seed. Para que TAMILA cargue su WhatsApp real, corrija textos y reemplace las fotos de muestra por trabajos reales sin tocar código, la API necesita endpoints de escritura protegidos que después va a consumir el panel admin.

## What Changes

- Endpoints de administración bajo `/api/admin/*`, todos protegidos con el access token JWT del admin (`JwtAuthGuard`):
  - **Configuración del sitio**: leer y actualizar `SiteSettings` (hero, imagen del hero, WhatsApp, redes, horario, footer, SEO, imagen OG).
  - **Servicios**: listar (incluye no publicados), ver, crear, editar, publicar/despublicar, reordenar y borrar; asignar portada, galería ordenada y trabajo destacado.
  - **Trabajos**: listar, ver, crear, editar, publicar/despublicar, reordenar y borrar; fotos antes/después y galería ordenada.
  - **Pasos del proceso** y **preguntas frecuentes**: CRUD y reordenamiento.
  - **Imágenes**: subida de archivos (JPEG, PNG, WebP, AVIF) que genera las variantes AVIF/WebP con la misma función que usa el seed, listado paginado con indicación de dónde se usa cada una, edición de texto alternativo y crédito, y borrado (bloqueado si la imagen está en uso).
- **Optimización de imágenes**: cada variante tiene un presupuesto de peso y la calidad baja de a pasos hasta entrar en el límite (hoy hay WebP de 1600 px de casi 600 KB); AVIF con mayor esfuerzo de compresión; el peso de cada variante se informa al admin. Los originales se guardan en un almacenamiento privado y un comando `media:reoptimize` regenera las variantes existentes (incluidas las del seed) con URLs nuevas para no chocar con la caché inmutable.
- Las respuestas del admin devuelven el modelo completo para edición (ids, `order`, `published`, imágenes como `MediaAsset`), distinto del formato público.
- Esquemas Zod de entrada y salida del admin en `@tamila/shared`, para que el panel admin los reutilice.
- Los cambios se ven en el sitio público dentro de la ventana de caché existente (≈60 s), sin redeploy.

Fuera de alcance: las pantallas del panel admin (change siguiente, `admin-gestion-contenido`), historial/versionado de cambios, borradores con vista previa, múltiples roles de admin y redirecciones automáticas al cambiar el slug de un servicio.

## Capabilities

### New Capabilities
- `admin-content-api`: endpoints protegidos para leer y editar configuración del sitio, servicios, trabajos, pasos y preguntas frecuentes, incluido el orden y la publicación.
- `admin-media-api`: subida, optimización de peso, listado, edición de metadatos, re-optimización y borrado seguro de imágenes.

### Modified Capabilities
<!-- Ninguna: admin-auth y api-platform no cambian sus requisitos; los nuevos endpoints los cumplen tal como están. -->

## Impact

- **Depende de** `sitio-publico-servicios` (modelo de contenido, `MediaAsset`, `storeImage`, capability `public-content-api`), que hay que archivar antes o junto con este change.
- `apps/api`: nuevo módulo `admin-content` (controladores por recurso + servicios) y endpoints de subida; cambios en `media/` (codificación con presupuesto, versión de codificación en los nombres de archivo, guardado de originales) y script `media:reoptimize`. Prisma: `MediaAsset` suma `originalPath` y `encodingVersion` (migración aditiva).
- Configuración: nueva variable `MEDIA_ORIGINALS_DIR` y volumen `media-originals` montado solo en la API (nunca en Caddy).
- `packages/shared`: esquemas `admin/*` (inputs de creación/edición, reordenamiento y respuestas).
- Dependencias: ninguna nueva. La subida usa el `FileInterceptor` de `@nestjs/platform-express` (que trae `multer`) sin importar `multer` directamente: con pnpm no es una dependencia de la API y `node` no la resolvería en producción.
- Infraestructura: el proxy (Caddy) debe permitir cuerpos de hasta el límite de subida definido (10 MB).
- Tests e2e nuevos en `apps/api/test/`.
