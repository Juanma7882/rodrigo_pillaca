# Design

## Context

- `apps/admin` es una SPA (Vite + React 19 + React Router 8 con `createBrowserRouter` y rutas `lazy`). Tiene el login, `RequireAuth`, `AdminLayout` (cabecera con tema y logout) y un `DashboardPage` vacío.
- Ya están instalados React Query, React Hook Form con `@hookform/resolvers` y zustand. `apiFetch()` (`features/auth/api/client.ts`) agrega el token, renueva la sesión ante un 401 y convierte los errores en `ApiError { status, message, errors[] }`.
- `packages/ui` tiene pocos componentes de shadcn (Button, Input, Label, Card y Skeleton) y está configurado para su CLI (`components.json`, estilo new-york).
- Convención de features: `src/features/<f>/`, y solo se importa el `index.ts` de otro feature (regla de ESLint `tamila/feature-boundaries`). La capa de rutas puede importar `pages/*`.
- La API (`/api/admin/*`) y sus esquemas en `@tamila/shared` están en los specs `admin-content-api` y `admin-media-api`. Los cambios se ven en el sitio en ≤ 60 s.
- Tests: Vitest + Testing Library con `mockFetch` (`src/test/fetch-mock.ts`). Playwright (`e2e/tests/admin`) corre contra el stack levantado; el login admite 5 intentos por minuto.

## Goals / Non-Goals

**Goals:**
- Que editar desde el celular sea cómodo: una columna, acciones al alcance del pulgar y fotos directo desde la cámara o la galería.
- Reutilizar los esquemas de `@tamila/shared` para que el panel y la API validen exactamente lo mismo.
- No perder trabajo: cambios sin guardar protegidos, errores en el campo correcto y reintentos de subida.

**Non-Goals:**
- Modo sin conexión o cola de cambios pendientes.
- Edición colaborativa o detección de cambios concurrentes.
- Vista previa del sitio antes de guardar (alcanza con "Ver el sitio" y la caché de 60 s).

## Decisions

### D1. Rutas y estructura
```
src/app/
  router.tsx            rutas lazy bajo AdminLayout
  layouts/AdminLayout   cabecera + navegación adaptable + <Outlet/>
  nav-items.ts          secciones (ruta, nombre, ícono, principal o "Más")
src/features/
  dashboard/            inicio con resumen y accesos
  settings/             /configuracion
  services/             /servicios, /servicios/nuevo, /servicios/:id
  projects/             /trabajos, /trabajos/nuevo, /trabajos/:id (?servicio=)
  sections/             /como-trabajamos, /preguntas
  media/                /imagenes, más ImagePicker, GalleryField y la subida (exportados por index.ts)
  content/              piezas compartidas de edición: SortableList, FormActions, ConfirmDialog,
                        useUnsavedChanges, applyApiErrors, PublishSwitch
```
- Las rutas en español coinciden con lo que ve el usuario. Cada página es un chunk. `SortableList` (con `@dnd-kit`) y el diálogo del selector de imágenes se cargan con `React.lazy`: si no, quedaban en chunks compartidos que también importa el inicio del panel. Mientras carga, la lista muestra filas esqueleto (sin campos, para que nadie escriba en una fila que se va a volver a montar).
- `content` es un feature "de soporte": los demás lo importan por su `index.ts`, igual que `media`, sin romper la regla de límites.

### D2. Navegación adaptable
- **Celular (< 768 px):** barra inferior fija con Inicio, Servicios, Trabajos, Imágenes y "Más". "Más" abre un `Sheet` de shadcn desde abajo con Configuración, Cómo trabajamos, Preguntas frecuentes, Ver el sitio, el tema y cerrar sesión. El contenido suma `pb` igual al alto de la barra más `env(safe-area-inset-bottom)`.
- **Compu (≥ 768 px):** menú lateral fijo con todas las secciones; la cabecera conserva el tema y cerrar sesión.
- La sección actual usa `NavLink` (`aria-current="page"`). Los ítems de la barra miden al menos 44 × 44 px.
- Las dos navegaciones se muestran u ocultan con los breakpoints de Tailwind (CSS), no con `matchMedia`: no hay parpadeo al cargar y los tests las ubican por su nombre accesible ("Menú principal" y "Secciones").
- *Alternativa:* menú hamburguesa en el celular. Se descarta porque esconde las secciones de uso diario detrás de un toque extra.

### D3. Datos con React Query
- Cada feature tiene `api.ts` con funciones tipadas sobre `apiFetch` que parsean la respuesta con los esquemas `admin*` de `@tamila/shared`, y hooks `useServices()`, `useService(id)`, `useSaveService()`, etc.
- Claves de query por recurso (`['services']`, `['services', id]`, `['media', {unused}]`). Las mutaciones invalidan la lista y el detalle; las de imágenes invalidan además `['media']`, porque cambian los usos.
- **Reordenar:** actualización optimista (`setQueryData` con el nuevo orden), `PUT …/order` y, en `onError`, se restaura el snapshot y se muestra un toast. Mientras hay un reordenamiento en curso, el siguiente espera al anterior (cola en la mutación con `scope`) para que no lleguen fuera de orden.
- *Alternativa:* `loader`/`action` de React Router. Se descarta porque React Query ya está en el proyecto y da caché, invalidación y estados de carga sin escribirlos a mano.

### D4. Formularios
- React Hook Form + `zodResolver` con los esquemas de **creación** de `@tamila/shared` (`serviceCreateSchema`, etc.). Al guardar una edición se envían solo los campos modificados (`dirtyFields`), validados con el esquema de edición: así un `PATCH` nunca pisa lo que no se tocó.
- `applyApiErrors(error, setError)`: los `errors[]` de un `ApiError` 400 van a cada campo (`imageIds.2` va al campo `imageIds`). El 409 del slug va al campo `slug`. El resto va a un toast (`sonner`) con el mensaje de la API.
- "Qué incluye" se edita con `useFieldArray` (agregar, quitar y reordenar con `SortableList`).
- Slug: en la creación se deriva del nombre (`normalize('NFD')`, sin diacríticos, minúsculas, guiones) mientras el usuario no lo toque. Al editar el slug de un servicio publicado, un `AlertDialog` advierte que la URL vieja deja de funcionar.
- Al guardar, el foco va al primer campo con error (`shouldFocusError`). El botón de guardar se deshabilita mientras `isSubmitting` (evita el doble envío).
- **Acciones al pie:** `FormActions` es una barra fija abajo en el celular, apoyada sobre la barra de navegación (que no se oculta, para no cambiar la navegación según la pantalla), y una fila normal en la compu.

### D5. Cambios sin guardar
`useUnsavedChanges(isDirty)` combina `useBlocker` de React Router (navegación interna, con un `AlertDialog` "¿Descartar los cambios?") y `beforeunload` (recarga o cierre de pestaña). Después de guardar con éxito se hace `reset(valoresGuardados)` para que `isDirty` vuelva a `false` antes de navegar.

### D6. Reordenar con dnd-kit
- `SortableList<T>` genérico sobre `@dnd-kit/core` + `@dnd-kit/sortable`, con asa visible (`GripVertical`) como único punto de arrastre: el resto de la fila deja desplazar la lista con el dedo.
- Sensores: `PointerSensor` (activación tras 4 px en mouse) y `TouchSensor` con `delay: 150, tolerance: 6`, para que un toque normal no empiece un arrastre, más `KeyboardSensor` con `sortableKeyboardCoordinates`.
- `announcements` en español para el lector de pantalla ("Tomaste Pintura. Está en la posición 3 de 8…").
- Se usa en las listas de servicios, trabajos, pasos y preguntas, en "Qué incluye" y en las galerías.
- *Alternativa:* flechas subir/bajar. El usuario eligió arrastrar.

### D7. Subida de imágenes
- `<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple>`. En iOS, al aceptar solo esos tipos, Safari convierte las HEIC a JPEG automáticamente. El selector del sistema ya ofrece la cámara y la galería, así que no se fuerza `capture`. En la compu también se aceptan archivos arrastrados sobre la zona de subida.
- **Achicar en el navegador:** si el lado mayor supera 3200 px o el archivo supera 8 MB, se decodifica con `createImageBitmap(file, { imageOrientation: 'from-image' })`, se dibuja en un `OffscreenCanvas` (o un `canvas` como respaldo) con el lado mayor en 3200 px y se exporta como JPEG de calidad 0,9. Así no se llega al límite de 10 MB y la subida por datos móviles es más corta. El original que guarda la API sigue superando los 1600 px que necesitan las variantes. Si el navegador no puede decodificar el archivo, se sube tal cual y la API decide.
- **Progreso:** `fetch` no informa el progreso de subida, así que `uploadImage()` usa `XMLHttpRequest` con `upload.onprogress`, el mismo token y el mismo manejo del 401 que `apiFetch` (renueva y reintenta una vez).
- **Cola:** las fotos se suben de a una (la API procesa cada imagen en varios segundos). Cada ítem tiene un estado: `pendiente`, `subiendo %`, `procesando`, `lista` o `error` con reintento. El texto alternativo se pide antes de subir, con el nombre del archivo como valor sugerido editable.
- *Alternativa:* subir en paralelo. Se descarta porque no acelera nada (el cuello de botella es el procesamiento en la API) y complica el reintento.

### D8. Selector y biblioteca
- `ImagePicker` (campo de una imagen) y `GalleryField` (varias, ordenables) abren un `Dialog` (pantalla completa en el celular) con la biblioteca paginada (`useInfiniteQuery`, de a 24), el filtro "Sin usar" y una pestaña "Subir" con la misma cola de D7. Lo que se sube queda seleccionado.
- El valor del campo es el id (o la lista de ids). La miniatura se muestra con los datos de la imagen ya cargados en caché, o pidiéndolos a la biblioteca.
- La biblioteca (`/imagenes`) muestra la grilla, el peso total formateado ("312 KB") y los usos como links a la pantalla correspondiente. El borrado de una imagen en uso muestra el 409 con los usos.
- Las miniaturas usan la variante de 480 px (`<picture>` con AVIF/WebP), con `loading="lazy"`.

### D9. Inicio del panel
Usa tres queries que ya existen: `GET /admin/services` (cuenta los publicados), `GET /admin/projects` y `GET /admin/media?unused=true&pageSize=1` (usa `total`). No hace falta un endpoint nuevo. "Ver el sitio" usa `import.meta.env.VITE_PUBLIC_SITE_URL`; si no está definida, el link no se muestra.

### D10. Componentes de UI
Con `pnpm dlx shadcn@latest add` en `packages/ui` se agregan `textarea`, `switch`, `dialog`, `alert-dialog`, `sheet`, `badge`, `select`, `tabs`, `sonner`, `progress` y `dropdown-menu`, y se exportan desde su `index.ts`. Se revisa que respeten los tokens del tema (amarillo solo con texto oscuro) y el test de contraste existente.

### D11. Tests
- **Unitarios (Vitest + Testing Library, `mockFetch`):** `slugify`, `applyApiErrors`, achicado de imágenes (con `createImageBitmap` simulado), `SortableList` con teclado, navegación adaptable (`matchMedia` simulado), y cada formulario: guarda solo lo modificado, muestra errores 400/409 en el campo, bloquea al salir con cambios y deshabilita el botón mientras guarda.
- **Playwright:** los flujos del admin corren en serie (`describe.serial`) sobre una sola página que inicia sesión una vez en `beforeAll`. No se usa `storageState` compartido: la API rota el refresh token en cada uso y detecta reutilizaciones, así que dos contextos con la misma cookie revocarían la sesión; además el login admite 5 intentos por minuto. Flujos: editar el WhatsApp y verlo en la API pública (restaurando el valor), crear una pregunta, reordenarla con el teclado y borrarla, y subir una foto a la biblioteca y borrarla. Cada test crea sus propios datos y los borra. La vista de celular se prueba en la misma sesión con `setViewportSize` (412 × 915, Pixel 7): barra inferior, menú "Más" y ausencia de scroll horizontal.

## Risks / Trade-offs

- **[Arrastrar en el celular puede competir con el scroll]** → solo se arrastra desde el asa, con un `delay` de 150 ms en touch; el resto de la fila desplaza la lista con normalidad.
- **[Achicar en el navegador re-comprime una foto que la API va a volver a comprimir]** → solo se hace con fotos de más de 3200 px o más de 8 MB, con JPEG de calidad 0,9; la pérdida no se nota en variantes de hasta 1600 px.
- **[`useBlocker` no cubre el botón "atrás" del celular si sale de la SPA]** → `beforeunload` lo cubre cuando sale del sitio; dentro del panel, `useBlocker` intercepta también el atrás del historial.
- **[Una subida larga se corta si la sesión vence (15 min)]** → `uploadImage` renueva el token ante el 401 y reintenta la foto completa una vez.
- **[Los tests de Playwright modifican la base de desarrollo]** → cada test crea sus propios datos con un sufijo único y los borra en `afterEach`; el único cambio de configuración (WhatsApp) se restaura al valor anterior.
- **[Más componentes de shadcn agrandan `packages/ui`]** → se importan por nombre y Vite separa el código en chunks por ruta; `@dnd-kit` y los diálogos no llegan al inicio del panel.

## Migration Plan

- Sin cambios en la base ni en la API.
- Agregar `VITE_PUBLIC_SITE_URL` a `.env.example`, al `ARG`/`ENV` de `docker/caddy.Dockerfile`, a los `build.args` del servicio caddy en `compose.prod.yml` y a los `build-args` del workflow de deploy. El admin se compila en GitHub Actions, así que necesita una variable de GitHub nueva (`PUBLIC_SITE_URL`, con el mismo valor que la del `.env` de la VPS, que hoy solo lee web al ejecutarse). Documentarla en la sección de configuración de GitHub del README.
- Rollback: volver a la imagen anterior de Caddy (que contiene el admin); el contenido editado sigue siendo válido.

## Open Questions

- Textos de ayuda finales de cada campo (por ejemplo, cuánto texto conviene en la bajada de un servicio): se ajustan con el cliente usando el panel, sin cambiar el comportamiento.
