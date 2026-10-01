# Design

## Context

- El modelo de contenido (`SiteSettings`, `Service`, `ServiceImage`, `Project`, `ProjectImage`, `ProcessStep`, `Faq`, `MediaAsset`) ya existe y fue pensado para que el admin lo edite sin cambiar el esquema (ver `sitio-publico-servicios/design.md`, D1).
- `apps/api/src/media/media-store.ts` tiene `storeImage()` (idempotente por hash, genera AVIF/WebP 480/960/1600 con `sharp`) y `toMediaDto()`. Hoy solo los usa el seed.
- `processImage()` codifica con calidad fija (WebP 78, AVIF 50 con `effort: 2`), no guarda el original y nombra los archivos `<hash>-<ancho>.<ext>`. Medido sobre las 24 fotos del seed: WebP 1600 promedio 178 KB pero máximo 579 KB; WebP 960 máximo 278 KB.
- El volumen `media` se monta en la API (`/data/media`) y en Caddy (`/srv/media`, solo lectura): todo lo que esté en él es público.
- Auth: `JwtAuthGuard` valida el access token Bearer; hay un único rol de admin. `ZodValidationPipe` responde 400 con `{ message, errors: [{ field, message }] }` y `AllExceptionsFilter` da el formato uniforme (incluye 413).
- Web lee el contenido por SSR con caché en memoria de 60 s; los endpoints públicos mandan `Cache-Control: max-age=60`.
- El admin llama a `/api/*` en su mismo origen (Caddy hace proxy), así que no hay CORS de por medio en producción.
- `ProcessStep.order` y `Faq.order` tienen `@unique`; `Service.order` y `Project.order` no.

## Goals / Non-Goals

**Goals:**
- Un contrato REST estable y tipado (esquemas en `@tamila/shared`) que el change `admin-gestion-contenido` pueda consumir sin tocar la API.
- Que ninguna operación del admin deje el sitio público en un estado roto (imágenes faltantes, destacados de otro rubro, huecos de orden).

**Non-Goals:**
- Invalidación activa de la caché de web (alcanza con la ventana de 60 s).
- Control de concurrencia entre varias sesiones del admin (hay un solo administrador).
- Recorte o edición de imágenes en el servidor.

## Decisions

### D1. Rutas y módulos
Módulo nuevo `AdminContentModule` en `apps/api/src/admin-content/`, con un controlador por recurso y `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` a nivel de clase. Un interceptor (o `@Header`) pone `Cache-Control: no-store` en todo `/api/admin`.

| Recurso | Endpoints |
| --- | --- |
| Configuración | `GET /admin/settings` · `PATCH /admin/settings` |
| Servicios | `GET /admin/services` · `GET /admin/services/:id` · `POST /admin/services` · `PATCH /admin/services/:id` · `DELETE /admin/services/:id` · `PUT /admin/services/order` |
| Trabajos | `GET /admin/projects?serviceId=` · `GET /admin/projects/:id` · `POST` · `PATCH /:id` · `DELETE /:id` · `PUT /admin/projects/order` |
| Pasos | `GET /admin/process-steps` · `POST` · `PATCH /:id` · `DELETE /:id` · `PUT /admin/process-steps/order` |
| Preguntas | `GET /admin/faqs` · `POST` · `PATCH /:id` · `DELETE /:id` · `PUT /admin/faqs/order` |
| Imágenes | `POST /admin/media` (multipart) · `GET /admin/media?page=&pageSize=&unused=` · `PATCH /admin/media/:id` · `DELETE /admin/media/:id` |

- Se edita por **id**, no por slug: el slug es un campo editable más.
- `PATCH` es parcial; los campos `null` borran opcionales. Galerías (`imageIds: string[]`) e `includes` se reemplazan completos.
- `PUT …/order` recibe `{ ids: string[] }`. Se declara antes de `:id` en el controlador para que Express no lo tome como id.
- La subida vive en el mismo `AdminContentModule` (controlador `admin-media`) para no mezclar el `MediaModule`, que hoy solo sirve archivos estáticos; la lógica de procesamiento sigue en `apps/api/src/media/`.
- *Alternativa:* un único `PUT /admin/content` con todo el sitio. Se descarta: payloads grandes, conflictos al editar, y errores de validación difíciles de ubicar en la UI.

### D2. Esquemas compartidos
En `packages/shared/src/admin/` se definen con Zod:
- Inputs: `settingsUpdateSchema`, `serviceCreateSchema`/`serviceUpdateSchema` (`.partial()` del create), `projectCreate/Update`, `processStepCreate/Update`, `faqCreate/Update`, `reorderSchema`, `mediaUpdateSchema`, `mediaListQuerySchema`.
- Outputs: `adminSettingsSchema`, `adminServiceSchema`, `adminProjectSchema`, `adminProcessStepSchema`, `adminFaqSchema`, `adminMediaSchema` (`mediaAssetSchema` + `createdAt` + `usages[]` + `sizes: [{ width, avifBytes, webpBytes }]` + `totalBytes`) y `paginated(schema)`. El `mediaAssetSchema` público no cambia: los bytes se guardan en el JSON `variants` y `toMediaDto()` no los expone.
- Reglas comunes: `z.string().trim()` con `.min(1)` en obligatorios y `.max()` por campo (nombres 80, bajadas 160, resúmenes/SEO 300, descripciones 5000); slug `^[a-z0-9]+(?:-[a-z0-9]+)*$` (máx. 60); WhatsApp `^$|^\d{8,15}$`; redes `z.url({ protocol: /^https$/ })` y `""` → `null`; ids `z.uuid()`; `.strict()` para rechazar campos no permitidos (requisito de api-platform).
- Los outputs se usan en Swagger con `z.toJSONSchema` como en `PublicContentController`, y los tests e2e parsean las respuestas con ellos.

### D3. Integridad referencial en el servicio, no solo en la base
Las relaciones de Prisma tienen `onDelete: Cascade/SetNull` pensadas para el seed; el admin necesita errores claros antes de llegar a la base:
- **Ids de imágenes** (hero, OG, portada, antes/después, galerías): se verifica con un `findMany({ where: { id: { in } } })` que existan todas; si falta alguna → 400 en el campo correspondiente (`imageIds.2`).
- **Destacado**: `featuredProjectId` debe tener `serviceId` igual al servicio → si no, 400. Al cambiar el `serviceId` de un trabajo o borrarlo, se limpia `featuredProjectId` del servicio anterior dentro de la misma transacción (el `SetNull` de Prisma cubre el borrado; el cambio de servicio hay que hacerlo explícito).
- **Borrar servicio con trabajos** → 409 (evita el `Cascade` que borraría trabajos en silencio).
- **Slug duplicado**: se captura `P2002` de Prisma y se traduce a 409 con un mensaje en español. Se agrega un helper `prismaConflict()` en `common/`.
- **Imagen en uso** → 409 con la lista de usos (mismo cálculo que el listado, D5).

### D4. Orden
- Crear: `order = max(order) + 1`.
- Reordenar: se validan los ids contra los existentes (mismo conjunto, sin repetidos) y se aplica en una `$transaction`. Como `ProcessStep.order` y `Faq.order` son únicos, se hace en dos pasadas: primero a valores negativos (`-(i+1)`) y después a los definitivos `1..n`. Se usa el mismo helper para los cuatro recursos.
- Borrar paso/pregunta: se borra y se compactan los siguientes (`order - 1`) en la misma transacción, también en dos pasadas por la restricción única.
- Servicios y trabajos se compactan igual al borrar, para mantener un único criterio.

### D5. Imágenes
- **Recepción:** `FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } })`. El exceso de tamaño de multer (`LIMIT_FILE_SIZE`) se traduce a 413. Campos de texto (`alt`, `credit`) se validan con `ZodValidationPipe`.
- **Validación del formato:** `sharp(buffer).metadata()` y se acepta solo `format ∈ {jpeg, png, webp, heif(avif)}`; cualquier error de `sharp` → 400 "El archivo no es una imagen válida". No se confía en `mimetype` ni en la extensión. Se agrega `limitInputPixels` (≈ 40 MP) para evitar bombas de descompresión.
- **Procesamiento:** se reutiliza `storeImage()`, con el encoder optimizado de D7. `sharp` ya descarta EXIF por defecto al re-codificar (solo se aplica `rotate()` según la orientación), así que la ubicación GPS no llega a las variantes. El original se guarda tal cual en el almacenamiento privado (D7).
- **Duplicados:** `storeImage()` ya es idempotente por hash; se responde 201 en ambos casos (el cliente no necesita distinguirlos).
- **Usos:** una función `mediaUsages(ids)` consulta en paralelo `SiteSettings` (hero/OG), `Service` (portada), `ServiceImage`, `Project` (antes/después) y `ProjectImage`, y devuelve por imagen `[{ kind: 'hero' | 'og' | 'serviceCover' | 'serviceGallery' | 'projectBefore' | 'projectAfter' | 'projectGallery', id, label }]`. El listado la llama para la página actual; `unused=true` filtra con `where` sobre las relaciones vacías (`serviceCovers: { none: {} }`, etc.).
- **Borrado:** si hay usos → 409; si no, se borra la fila y después los archivos de `variants` y el original con `rm({ force: true })`. Si falla el borrado de archivos, se loguea y no se revierte (quedan huérfanos inofensivos).

### D6. Caché del sitio público
No se agrega invalidación: los cambios se ven en ≤ 60 s (caché de web) + `stale-while-revalidate`. Las imágenes nuevas tienen URLs nuevas (hash), así que no hay problemas con la caché inmutable de `/media`. Si más adelante se quiere inmediatez, se puede agregar un endpoint interno de purga en web sin cambiar este contrato.

### D7. Optimización y re-optimización de imágenes
- **Presupuesto por variante** (constante `MEDIA_BUDGET` junto a `MEDIA_WIDTHS`): 40 / 120 / 250 KB para 480 / 960 / 1600 px. Se **garantiza en AVIF** (lo que descarga más del 95 % de los navegadores), que además nunca puede pesar más que la WebP del mismo ancho. La WebP de respaldo lo usa como objetivo pero puede quedar por encima en el piso de calidad. El presupuesto se escala por la superficie cuando la imagen es más chica que el ancho nominal.
  - *Medición que lo motivó:* con la foto más pesada del seed (pisos-flotantes-y-madera-3, 1600 px), la WebP pesa 576 KB a calidad 78, 422 KB a 55 y todavía 352 KB a 40: con fotos muy detalladas la WebP no entra en 250 KB solo bajando la calidad. La AVIF sí: 295 KB a 50 y 220 KB a 44.
  - *Alternativa descartada:* achicar el ancho de la variante grande cuando no entra; cumple el tope en ambos formatos, pero resta resolución en pantallas grandes justo en las fotos con más detalle.
- **Calidad adaptativa:** por cada ancho se codifica primero la WebP (78 → 70 → 62 → 55) y después la AVIF (50 → 44 → 38 → 32) con presupuesto `min(MEDIA_BUDGET, peso de la WebP)`. Se queda con el primer resultado que entra; si en el piso todavía se pasa, se guarda el del piso y se loguea un `warn` con el hash, el formato y el peso. Como máximo son 4 codificaciones por formato y variante, y en la práctica la mayoría entra en la primera.
  - *Alternativa:* búsqueda binaria de calidad. Se descarta porque con 4 escalones el costo ya es acotado y el resultado es más predecible.
- **AVIF `effort: 3`** (antes 2). Medido en la máquina de desarrollo con la foto más pesada: effort 2 tarda 1,5 s y pesa 314 KB, effort 3 tarda 2,2 s y pesa 295 KB, y effort 4 tarda 13,4 s y pesa lo mismo que el 3. WebP suma `smartSubsample: true` y `effort: 5`.
- **Versión de codificación en el nombre:** los archivos pasan a llamarse `<hash>-v<N>-<ancho>.<ext>`, con `MEDIA_ENCODING_VERSION = 2` como constante. Subir esa constante y correr `media:reoptimize` genera URLs nuevas, así la caché `immutable` de `/media` nunca sirve una versión vieja. `MediaAsset` suma `encodingVersion Int @default(1)` (las del seed actual quedan en 1).
- **Bytes por variante:** `processImage()` devuelve `{ width, avif, webp, avifBytes, webpBytes }` y se guarda así en `variants`.
- **Originales privados:** se guardan en `MEDIA_ORIGINALS_DIR` (`/data/media-originals` en Docker, `./media-originals` en dev), como `<hash>.<ext según formato detectado>`, en un volumen nuevo `media-originals` montado **solo** en la API. `MediaAsset` suma `originalPath String?`. El seed también guarda el original, así sus fotos quedan re-optimizables.
- **Comando `pnpm --filter @tamila/api media:reoptimize`** (`src/scripts/reoptimize-media.ts`): recorre los `MediaAsset` con `encodingVersion < MEDIA_ENCODING_VERSION` (o todos con `--force`), y para cada uno lee el original, genera las variantes nuevas, actualiza `variants`, `path`, `width`, `height` y `encodingVersion` en la fila (mismo id, así no cambia ningún uso) y recién después borra los archivos viejos. Los que no tienen original se omiten y se listan en el resumen final. Procesa de a una imagen para no saturar la CPU de la VPS. Es idempotente: una segunda corrida no hace nada.

### D8. Tests
- Unitarios (`*.spec.ts`): helper de reordenamiento, `mediaUsages`, validación de formato de imagen, esquemas de `@tamila/shared` (WhatsApp, slug, redes vacías → null, `.strict()`), y el encoder con presupuesto: una imagen de ruido (difícil de comprimir) termina bajo el presupuesto o en el piso con `warn`, y una imagen lisa conserva la calidad inicial.
- E2E (`apps/api/test/admin-*.e2e-spec.ts`) con `createTestApp` + `resetAdmin` + login: 401 sin token en todos los recursos, un caso feliz por endpoint y cada 400/404/409/413 de los specs. Para la subida se generan imágenes con `sharp({ create })` y `MEDIA_DIR` apunta a un directorio temporal.

## Risks / Trade-offs

- **[Cambiar el slug de un servicio rompe URLs indexadas en Google]** → El esquema lo permite, pero la respuesta de `PATCH` no avisa; queda documentado para que la UI del admin muestre una advertencia. Las redirecciones 301 quedan fuera de alcance.
- **[Procesar imágenes grandes bloquea la API unos segundos]** → `sharp` trabaja en su pool de libuv, no bloquea el event loop; el límite de 10 MB y `limitInputPixels` acotan el costo. Hay un solo admin, así que no se agrega cola.
- **[La calidad adaptativa multiplica el tiempo de procesamiento (peor caso 4× por formato y variante)]** → una foto pesada puede tardar 10–20 s en la VPS; la respuesta es síncrona y la UI del admin debe mostrar progreso. Si molesta, se baja `effort` sin cambiar el contrato.
- **[La WebP de respaldo puede superar el presupuesto en fotos muy detalladas]** → solo la descargan los navegadores sin AVIF (menos del 5 %); queda en el log para revisarla.
- **[Calidad 55/32 puede notarse en fotos con mucho detalle]** → es el piso: por debajo no se baja aunque se pase del presupuesto. Los números se ajustan mirando las fotos reales.
- **[Los originales ocupan disco (hasta 10 MB c/u)]** → para un sitio con decenas o pocos cientos de fotos son unos GB como mucho; se borran junto con la imagen.
- **[Imágenes del seed ya cargadas no tienen original]** → al volver a correr el seed se registra el original (mismo hash) y después `media:reoptimize` las pasa a la versión 2.
- **[Fotos HEIC de iPhone]** → `sharp` precompilado no decodifica HEIC; Safari suele convertirlas a JPEG al elegirlas desde el navegador. Si llega una HEIC, responde 400 con un mensaje que sugiere exportarla como JPEG.
- **[Archivos en memoria (memoryStorage) hasta 10 MB]** → aceptable con un único usuario y una imagen por solicitud.
- **[Borrado de archivos tras borrar la fila puede dejar huérfanos]** → impacto solo de disco; se puede agregar más adelante un script de limpieza que compare `MEDIA_DIR` con la tabla.
- **[Sin control de concurrencia, dos pestañas pueden pisarse cambios]** → un solo administrador; `updatedAt` en las respuestas permite agregar control optimista después sin romper el contrato.
- **[`PATCH` con `.strict()` rechaza campos de solo lectura que la UI reenvíe (`id`, `updatedAt`)]** → la UI debe mandar solo los campos editables; los esquemas compartidos lo dejan explícito.

## Migration Plan

- Migración aditiva de Prisma: `MediaAsset.originalPath String?` y `MediaAsset.encodingVersion Int @default(1)`. No toca datos existentes.
- Despliegue: agregar el volumen `media-originals` a `compose.prod.yml` y `compose.dev.yml` (solo en el servicio api) y `MEDIA_ORIGINALS_DIR` al esquema de env y a `.env.example`. Verificar que `media` sigue montado con escritura en la API y que Caddy no monta `media-originals`.
- Después del primer deploy: correr el seed de contenido (registra los originales del seed) y luego `media:reoptimize` para pasar las 24 fotos a la versión 2.
- Rollback: volver a la imagen anterior de la API. Las columnas nuevas son opcionales o tienen valor por defecto, y las variantes v2 siguen siendo rutas válidas en `/media`, así que el sitio sigue funcionando.

## Open Questions

- Límites exactos de longitud por campo: se toman los de D2 y se ajustan cuando la UI del admin muestre los textos reales del seed.
