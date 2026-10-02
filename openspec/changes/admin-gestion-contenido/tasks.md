# Tasks

> Requiere `admin-api-contenido` (archivado): API `/api/admin/*` y esquemas de `@tamila/shared`.

## 1. Base de UI y configuración

- [x] 1.1 Agregar con `pnpm dlx shadcn@latest add` en `packages/ui` los componentes `textarea`, `switch`, `dialog`, `alert-dialog`, `sheet`, `badge`, `select`, `tabs`, `sonner`, `progress` y `dropdown-menu`, exportarlos desde `index.ts`, y verificar que `pnpm --filter @tamila/ui test` (incluido el contraste AA) y `typecheck` pasan
- [x] 1.2 Agregar `@dnd-kit/core`, `@dnd-kit/sortable` y `@dnd-kit/utilities` a `apps/admin`, y `VITE_PUBLIC_SITE_URL` a `vite-env.d.ts`, `.env.example`, `docker/caddy.Dockerfile`, `compose.prod.yml` y `deploy.yml`; verificar que `pnpm dev:install` sincroniza los contenedores y que `docker compose -f docker/compose.prod.yml config` es válido

## 2. Navegación y layout

- [x] 2.1 Crear `nav-items.ts` y reescribir `AdminLayout` con la barra inferior + `Sheet` "Más" en el celular y el menú lateral en la compu (D2), con `NavLink` y `aria-current`, y verificar con tests de Vitest que cada navegación (menú lateral y barra inferior, mostradas por breakpoint de CSS) tiene los ítems correctos, que "Más" abre y cierra y que la sección actual queda marcada
- [x] 2.2 Registrar en `router.tsx` las rutas lazy de todas las secciones (D1) con su `PageLoader`, montar `<Toaster />` de sonner y verificar en un test que navegar a una sección carga su página

## 3. Piezas de edición compartidas (`features/content`)

- [x] 3.1 Implementar `applyApiErrors` (400 por campo con índices, 409 del slug al campo `slug`, el resto a toast) y `slugify`, y verificar con tests unitarios los casos `imageIds.2` → `imageIds`, `Instalación de aire` → `instalacion-de-aire` y errores de red
- [x] 3.2 Implementar `FormActions` (fija al pie en el celular, deshabilitada mientras guarda) y `useUnsavedChanges` con `useBlocker` + `beforeunload` y su `AlertDialog`, y verificar con tests que navegar con cambios pide confirmación, que cancelar conserva lo escrito y que después de guardar no pide nada
- [x] 3.3 Implementar `SortableList<T>` con asa, sensores de puntero, táctil (delay 150 ms) y teclado, y anuncios en español (D6), y verificar con un test de teclado (Espacio, flecha, Espacio) que `onReorder` recibe el nuevo orden y que se anuncia la posición
- [x] 3.4 Implementar `ConfirmDialog` y `PublishSwitch`, y un hook `useReorder(queryKey, mutationFn)` con actualización optimista, cola y rollback (D3), y verificar con tests que ante un error de la API la lista vuelve al orden anterior y se muestra el toast

## 4. Imágenes (`features/media`)

- [x] 4.1 Implementar `shrinkImage(file)` (lado mayor > 3200 px o > 8 MB → JPEG 3200 px, calidad 0,9, respetando la orientación EXIF; si no puede decodificar, devuelve el archivo tal cual) y `uploadImage()` con `XMLHttpRequest`, progreso y renovación del token ante un 401 (D7), y verificar con tests unitarios (con `createImageBitmap` y XHR simulados) el achicado, el progreso, el reintento tras el 401 y el error de red
- [x] 4.2 Implementar la cola de subida (pide el texto alternativo, sube de a una, estados con reintento) y la página `/imagenes` con grilla paginada, filtro "Sin usar", peso, usos con links, edición de alt/crédito y borrado (409 con usos), y verificar con tests que subir tres fotos las muestra al principio, que un error permite reintentar y que borrar una imagen en uso muestra dónde se usa
- [x] 4.3 Implementar `ImagePicker` y `GalleryField` (diálogo a pantalla completa en el celular con biblioteca + pestaña "Subir", vaciar campo, ordenar la galería con `SortableList`) y exportarlos desde `features/media/index.ts`, y verificar con tests que subir desde el selector deja la imagen elegida sin perder el resto del formulario

## 5. Configuración del sitio

- [x] 5.1 Implementar `/configuracion` con secciones (Hero, Contacto y redes, Footer, SEO), ayuda de formato para el WhatsApp, `ImagePicker` para hero y OG, y envío solo de los campos modificados, y verificar con tests que guarda el WhatsApp, muestra el error de formato junto al campo, enfoca el primer error y avisa que el sitio se actualiza en hasta un minuto

## 6. Servicios

- [x] 6.1 Implementar `/servicios` con la lista ordenable (nombre, capítulo, estado, portada, cantidad de trabajos), `PublishSwitch` y acceso a crear y editar, y verificar con tests el reordenamiento optimista y que despublicar actualiza el estado
- [x] 6.2 Implementar el formulario de servicio (crear y editar): textos, "Qué incluye" con `useFieldArray` ordenable, SEO, portada, galería, trabajo destacado (solo trabajos del servicio), slug sugerido y advertencia al cambiarlo, y borrado con confirmación (el 409 ofrece despublicar); verificar con tests el slug sugerido, el 409 del slug en su campo, la advertencia de cambio de slug y la oferta de despublicar

## 7. Trabajos

- [x] 7.1 Implementar `/trabajos` con la lista ordenable, filtro por servicio (sincronizado con `?servicio=`), miniatura y estado, y verificar con tests que el filtro muestra solo los trabajos del servicio elegido
- [x] 7.2 Implementar el formulario de trabajo (datos, servicio, antes/después con `ImagePicker`, galería, publicación y borrado) y verificar con tests que crear un trabajo envía las imágenes elegidas y que un año fuera de rango muestra el error en su campo

## 8. Cómo trabajamos y preguntas frecuentes

- [x] 8.1 Implementar `/como-trabajamos` y `/preguntas` con edición en línea por fila, alta al final, borrado con confirmación, `PublishSwitch` (solo preguntas) y orden por arrastre, y verificar con tests que agregar una pregunta la deja última y que editar una fila envía solo esa fila

## 9. Inicio del panel

- [x] 9.1 Reemplazar `DashboardPage` por el resumen (servicios y trabajos publicados, imágenes sin uso), los accesos a cada sección y "Ver el sitio" (oculto si no hay `VITE_PUBLIC_SITE_URL`), y verificar con tests los números calculados y el link con `target="_blank"` y `rel="noopener"`

## 10. End-to-end y cierre

- [x] 10.1 Organizar los flujos del admin en una suite serial que inicia sesión una sola vez y reutiliza la página (un `storageState` compartido no sirve: la API rota y detecta la reutilización del refresh token), con las pruebas de celular en la misma sesión vía `setViewportSize` (Pixel 7); verificar que la suite nueva hace un solo login
- [ ] 10.2 Escribir los flujos e2e: editar el WhatsApp y verlo en el sitio (restaurando el valor), crear, reordenar con teclado y borrar una pregunta, subir y borrar una foto, y en celular la barra inferior sin scroll horizontal y el inicio sin descargar el chunk de dnd-kit; verificar que pasan en CI
- [ ] 10.3 Actualizar el README (uso del panel, `VITE_PUBLIC_SITE_URL` y la variable de GitHub `PUBLIC_SITE_URL`) y verificar que `pnpm lint`, `pnpm typecheck`, `pnpm test` y los e2e pasan en local y en CI
