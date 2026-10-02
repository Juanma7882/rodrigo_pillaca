# Tasks

> Requiere `sitio-publico-servicios` implementado (modelo de contenido, `storeImage`, API pública).

## 1. Esquemas compartidos

- [x] 1.1 Crear `packages/shared/src/admin/` con los esquemas de entrada (settings, servicio, trabajo, paso, pregunta, reorder, media update y query de listado) según D2, exportarlos desde `index.ts` y verificar con tests Vitest: WhatsApp `+54 11…` inválido y `""` válido, slug con acentos/mayúsculas inválido, red vacía → `null`, texto con espacios se recorta, campo extra rechazado por `.strict()`
- [x] 1.2 Definir los esquemas de respuesta del admin (`adminSettings`, `adminService`, `adminProject`, `adminProcessStep`, `adminFaq`, `adminMedia` con `usages[]`, `paginated()`) y verificar con tests de casos válidos e inválidos; `pnpm --filter @tamila/shared build` sin errores

## 2. Base del módulo admin

- [x] 2.1 Crear `AdminContentModule` en `apps/api/src/admin-content/`, registrarlo en `AppModule`, con `JwtAuthGuard` + `@ApiBearerAuth()` por controlador y `Cache-Control: no-store`, y verificar con un e2e que `GET /api/admin/settings` responde 401 sin token y 200 con token
- [x] 2.2 Agregar en `common/` los helpers `prismaConflict()` (P2002 → 409 en español), `assertMediaExists(ids, field)` (400 con el campo/índice) y `reorder()` / `compactAfterDelete()` en dos pasadas (D4), y verificar con tests unitarios que el reordenamiento respeta la unicidad de `order` y rechaza listas incompletas o con repetidos

## 3. Configuración del sitio

- [x] 3.1 Implementar `GET` y `PATCH /api/admin/settings` (incluye `heroImageId` y `ogImageId`), y verificar con e2e: cambio de WhatsApp reflejado en `GET /api/public/site`, 400 con `whatsappNumber` inválido y 400 con `heroImageId` inexistente

## 4. Servicios

- [x] 4.1 Implementar listado (todos, en orden), detalle por id y creación (al final del orden, slug único) y verificar con e2e: 201 con servicio no publicado que no aparece en `/api/public/services`, 409 con slug `durlock`
- [x] 4.2 Implementar `PATCH` con portada, galería ordenada (`imageIds`) y `featuredProjectId` validado contra el servicio, y verificar con e2e: galería queda en el orden enviado, 400 si el destacado es de otro rubro, 400 si una imagen no existe, despublicar renumera los capítulos públicos sin huecos
- [x] 4.3 Implementar `PUT /api/admin/services/order` y `DELETE` (409 si tiene trabajos, 204 y compactación si no), y verificar con e2e: `pintura` primero pasa a ser capítulo 1, 400 con 7 de 8 ids, 409 al borrar `durlock` con trabajos

## 5. Trabajos

- [x] 5.1 Implementar listado (filtro `serviceId`), detalle, creación y `PATCH` con antes/después y galería, limpiando el destacado del servicio anterior al cambiar `serviceId`, y verificar con e2e: 201 con antes/después visible en `/api/public/projects`, 400 con `serviceId` inexistente, 400 con año fuera de rango, el servicio anterior queda sin destacado
- [x] 5.2 Implementar `PUT /api/admin/projects/order` y `DELETE` con compactación, y verificar con e2e el nuevo orden en la API pública y 404 con id inexistente

## 6. Pasos y preguntas frecuentes

- [x] 6.1 Implementar CRUD + reorder de `process-steps` y verificar con e2e: crear queda último, borrar el tercero de 5 deja órdenes 1..4 consecutivos
- [x] 6.2 Implementar CRUD + reorder de `faqs` y verificar con e2e: pregunta con `published: false` aparece en el admin y no en `/api/public/site`, 400 con pregunta vacía

## 7. Imágenes

- [x] 7.1 Agregar a `MediaAsset` `originalPath String?` y `encodingVersion Int @default(1)` con una migración aditiva, sumar `MEDIA_ORIGINALS_DIR` al esquema de env y a `.env.example`, y el volumen `media-originals` solo en el servicio api de `compose.dev.yml` y `compose.prod.yml`; verificar que `prisma migrate dev` aplica, que la API no arranca si `MEDIA_ORIGINALS_DIR` queda dentro de `MEDIA_DIR` (la variable tiene valor por defecto `./media-originals`, como `MEDIA_DIR`, para no romper CI ni los `.env` existentes) y que Caddy no monta el volumen
- [x] 7.2 Reescribir `processImage()` con presupuesto por variante garantizado en AVIF y calidad adaptativa (WebP 78→70→62→55, AVIF 50→44→38→32), AVIF `effort: 3`, WebP `smartSubsample` + `effort: 5`, nombres `<hash>-v<N>-<ancho>.<ext>` y bytes por variante (D7), y verificar con tests unitarios: la foto más pesada del seed termina con AVIF 1600 ≤ 250 KB y menor que su WebP, y con WebP por debajo de la calidad inicial; una imagen lisa conserva la calidad inicial; una imagen de ruido queda en el piso y se informa en `overBudget`; y los tests existentes de `media-processor.spec.ts` actualizados pasan
- [x] 7.3 Hacer que `storeImage()` guarde el original en `MEDIA_ORIGINALS_DIR` y registre `originalPath` y `encodingVersion`, y verificar con un test que el original existe, que no está bajo `MEDIA_DIR` y que volver a correr el seed de contenido lo registra para las 24 fotos sin duplicar `MediaAsset`
- [x] 7.4 Verificar con un test unitario que las variantes generadas no conservan EXIF/GPS de una imagen de entrada que sí los tiene
- [x] 7.5 Implementar `POST /api/admin/media` con el `FileInterceptor` de Nest (archivo en memoria, sin importar `multer`), límite de 10 MB → 413, validación de formato por contenido con `sharp` (`limitInputPixels`) y `storeImage()`, devolviendo `sizes` y `totalBytes`, y verificar con e2e: JPEG 4000×3000 → 201 con ancho 1600, bytes por variante y variantes servidas en `/media`, PDF renombrado → 400, 15 MB → 413, sin `alt` → 400, mismo archivo dos veces → mismo id
- [x] 7.6 Implementar `mediaUsages()` y `GET /api/admin/media` paginado (más nuevas primero, filtro `unused`, con `sizes` y `totalBytes`), y verificar con e2e: la portada de `durlock` figura como `serviceCover`, `unused=true` no la incluye y `/api/public/services` sigue sin exponer bytes
- [x] 7.7 Implementar `PATCH /api/admin/media/:id` (alt, crédito) y `DELETE` (409 con usos, 204 borrando variantes y original), y verificar con e2e: el nuevo `alt` aparece en `/api/public/services`, borrar la imagen del hero → 409, borrar una sin uso → 204, su variante responde 404 en `/media` y el original ya no existe en disco
- [x] 7.8 Implementar el script `media:reoptimize` (`src/scripts/reoptimize-media.ts`, con `--force`) según D7, y verificar con un e2e: una imagen v1 usada como portada conserva su id y su uso, sus URLs cambian a `-v2-`, las URLs viejas responden 404, una imagen sin original aparece en el resumen como omitida y una segunda corrida no procesa nada

## 8. Documentación y cierre

- [x] 8.1 Documentar todos los endpoints en Swagger (body, respuestas y errores 400/401/404/409/413) y verificar que aparecen en `/api/docs` agrupados por recurso con el candado de Bearer
- [x] 8.2 Actualizar el README con la sección de la API de administración, el presupuesto de peso de las imágenes, `MEDIA_ORIGINALS_DIR` y el paso post-deploy (seed de contenido + `media:reoptimize`), y verificar que `pnpm lint`, `pnpm typecheck`, `pnpm test` y los e2e de API pasan en local y en CI
