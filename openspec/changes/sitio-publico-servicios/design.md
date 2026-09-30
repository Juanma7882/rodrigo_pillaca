# Design

## Context

Este change se construye sobre `setup-monorepo-base`: `apps/web` en React Router con SSR, API NestJS + Prisma y tema con tokens en `packages/ui`. Todavía no hay fotos reales ni datos de contacto definitivos, así que todo sale de un seed reemplazable. La edición desde el admin llega en el próximo change, por eso el modelo de datos ya queda pensado para eso.

Referencias visuales del usuario: una página "CONTENT" (título enorme, índice numerado en dos columnas, foto en blanco y negro) y una doble página "CHAPTER PAGE 01" (número gigante con trazo diagonal, bajada en mayúsculas, cita, grilla asimétrica de fotos, bloque de proyecto con año y nombre).

## Goals / Non-Goals

**Goals:**
- Un inicio que se lea como una revista y lleve a WhatsApp desde cualquier punto.
- El HTML completo en el servidor para SEO local.
- Un modelo de contenido listo para que el admin lo edite sin cambiar el esquema.

**Non-Goals:**
- CRUD de contenido y subida de imágenes desde el admin (change `admin-gestion-contenido`).
- Analytics y píxeles de seguimiento.
- Blog o noticias.

## Decisions

### D1. Modelo de contenido (Prisma)
- **`SiteSettings`** (fila única, `id = 1`):
  - Hero: `heroTitle`, `heroSubtitle`.
  - WhatsApp: `whatsappNumber` (formato internacional sin `+`), `whatsappDefaultMessage`.
  - Redes y horario: `instagramUrl?`, `facebookUrl?`, `tiktokUrl?`, `businessHours?`.
  - Textos y SEO: `footerText?`, `seoTitle`, `seoDescription`, `ogImageId?`.
- **`MediaAsset`**: `id`, `path` (original), `alt`, `width`, `height`, `variants` (JSON: ancho → rutas avif/webp), `credit?`, `createdAt`.
- **`Service`**:
  - Identidad y orden: `id`, `slug` único, `name`, `order`, `published`.
  - Textos: `tagline` (bajada), `summary` (texto del índice/SEO), `description`, `includes` (`String[]`), `seoTitle?`, `seoDescription?`.
  - Imágenes: `coverImageId` (portada del índice) e imágenes del capítulo vía `ServiceImage (serviceId, mediaId, order)`.
  - `featuredProjectId?`.
- **`Project`**:
  - Datos: `id`, `title`, `year?`, `location?`, `description`, `order`, `published`.
  - `serviceId`.
  - Imágenes: `beforeImageId?`, `afterImageId?` y galería vía `ProjectImage`.
- **`ProcessStep`**: `id`, `order`, `title`, `description`.
- **`Faq`**: `id`, `order`, `question`, `answer`, `published`.

El número del capítulo (01, 02…) **no se guarda**: se calcula del orden de los servicios publicados, así ocultar un servicio no deja huecos en la numeración.

### D2. API pública
Módulo `PublicContentModule` con controladores de solo GET bajo `/api/public`:
- `GET /site`: configuración + pasos + preguntas publicadas.
- `GET /services`: lista resumida (slug, nombre, bajada, resumen, portada).
- `GET /services/:slug`: detalle completo (capítulo + trabajos del rubro + slugs anterior/siguiente).
- `GET /projects`: trabajos publicados.

Las respuestas se validan contra esquemas Zod de `@tamila/shared` (también los usa web para tipar los loaders). Llevan `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- *Alternativa:* un único endpoint `/home` con todo. Se descarta porque la página de servicio y el sitemap necesitan subconjuntos distintos, y endpoints por recurso son los mismos que el admin va a editar.

### D3. Imágenes
- **Almacenamiento:** volumen Docker `media` montado en la API (`/data/media`) y en Caddy (solo lectura). Caddy sirve `/media/*` con `Cache-Control: public, max-age=31536000, immutable`; los nombres de archivo llevan hash de contenido. En dev la API las sirve con `@nestjs/serve-static` y Vite hace de proxy de `/media`.
- **Variantes:** con `sharp` se generan AVIF + WebP en 480/960/1600 px. En este change se usa desde el seed; en el siguiente, desde la subida del admin, con la misma función de `apps/api/src/media`.
- **Web:** un componente `<ResponsiveImage>` en `packages/ui` arma el `<picture>` con `srcset`/`sizes`, `width`/`height`, `loading="lazy"` y `fetchpriority="high"` solo en la imagen de arriba.
- **Tratamiento visual:** las fotos se muestran en escala de grises por CSS (`grayscale`) y recuperan el color al hacer hover. Queda alineado con la marca negro/blanco/amarillo y con las referencias.
- **Imágenes de muestra:** fotos de licencia libre (Unsplash/Pexels) guardadas en `apps/api/prisma/seed-media/` con un `CREDITS.md`. Sus `MediaAsset` llevan `credit`, para distinguirlas cuando se reemplacen por fotos reales.

### D4. Estructura de `apps/web`
```
app/
  root.tsx                 layout, fuentes, tema, navbar, footer, botón flotante
  routes.ts                / · /servicios/:slug · /sitemap.xml · /robots.txt · * (404)
  routes/                  módulos de ruta delgados (loader + meta + composición)
  features/
    layout/                Navbar, MobileMenu, Footer
    hero/                  Hero
    services/              ServicesIndex, RotatingCover, ServiceChapter, ServicePager
    process/               ProcessSteps
    projects/              ProjectsGallery, BeforeAfter (lazy)
    faq/                   FaqAccordion
    whatsapp/              buildWhatsAppUrl, WhatsAppButton, FloatingWhatsApp
    seo/                   buildMeta, jsonLd, sitemap
  shared/api/              cliente de la API para loaders (usa API_INTERNAL_URL en el servidor)
```
- El loader de `/` pide `/site`, `/services` (con detalle de capítulos) y `/projects` en paralelo; el de `/servicios/:slug` pide el detalle y lanza un `Response` 404 si la API responde 404.
- La configuración del sitio se carga en el `loader` de `root` para que navbar, footer y botón flotante la tengan en todas las páginas.

### D5. Lenguaje visual editorial
- **Tipografías** (self-hosted con `@fontsource`, sin llamadas a Google): **Montserrat** 800/900 para títulos y números, **Inter** 400/500/600 para el texto. Los títulos van en mayúsculas con tracking negativo; los rótulos, en versalitas de 11–12 px con tracking amplio ("PÁG. 06 · SERVICIOS").
- **Grilla:** 12 columnas con márgenes generosos y separadores de 1 px. Componentes editoriales en `packages/ui`:
  - `ChapterNumber`: número gigante con trazo diagonal en `brand-500`.
  - `Eyebrow`: rótulo chico.
  - `Rule`: línea separadora.
  - `PullQuote`: cita destacada.
- **Capítulo** (desktop, doble página):
  - Página izquierda: rótulo, nombre, línea, número + trazo, bajada a la derecha, cita/descripción y foto.
  - Página derecha: foto horizontal grande, dos fotos abajo (una vertical), bloque de trabajo destacado y "Qué incluye" con viñetas.
  - En los capítulos pares se espeja la disposición (`order` en la grilla).
  - En celulares todo va en una columna: rótulo → número + nombre → foto → texto → incluye → CTA.
- **Índice:** "CONTENIDO" enorme con una línea debajo y dos columnas de `NN · Nombre` con los números en `brand-800`/`brand-500` según el modo. La imagen rotativa va debajo en celulares y a la derecha en desktop.
- **Amarillo como acento:** solo en números, trazos, botones y estados activos. Nunca como fondo de grandes superficies.
- **Animaciones:** reveal suave con `IntersectionObserver` + transiciones CSS (sin librería de animación), desactivadas con `prefers-reduced-motion`.

### D6. Imagen rotativa del índice
Un componente cliente mantiene el índice activo:
- Intervalo de 4 s y crossfade CSS de 600 ms entre dos capas `<img>`.
- Pausa en `mouseenter`/`focusin` del índice y reanuda en `mouseleave`/`focusout`.
- Sin intervalo si `prefers-reduced-motion` o si la pestaña está oculta (`visibilitychange`).
- Precarga la portada siguiente. En SSR se renderiza la primera portada, para que sin JS haya imagen.

### D7. WhatsApp
`buildWhatsAppUrl(number, message)` genera `https://wa.me/<number>?text=<encodeURIComponent(message)>`. El mensaje por servicio es una plantilla fija: `Hola, quiero consultar por ${service.name}`. Los enlaces usan `target="_blank" rel="noopener"`. Si `whatsappNumber` está vacío, `WhatsAppButton` no renderiza nada.
- *Alternativa descartada:* un formulario que arme el mensaje. El usuario eligió WhatsApp directo y sin formularios.

### D8. Navegación a secciones
Las secciones del inicio tienen ids estables (`#servicios`, `#como-trabajamos`, `#trabajos`, `#preguntas`, `#servicio-<slug>`). Los enlaces de la navbar son `/#id`; React Router maneja el scroll al hash, con `scroll-margin-top` igual a la altura de la navbar. La navbar se oculta al bajar y reaparece al subir (umbral de 8 px). En desktop no se oculta mientras el menú tenga foco.

### D9. SEO
- Una función `buildMeta()` centraliza título, descripción, canonical (`PUBLIC_SITE_URL` + ruta) y Open Graph/Twitter.
- JSON-LD inyectado desde `meta` o un `<script type="application/ld+json">` en la ruta.
- `sitemap.xml` y `robots.txt` son resource routes de React Router que consultan la API en cada request, con caché de 1 h. Así un servicio publicado aparece sin redesplegar.

### D10. Contenido del seed
Textos en español rioplatense, tono profesional y cercano:
- 8 servicios con bajada, descripción, 4–6 ítems de "Qué incluye" y 3 imágenes cada uno.
- 5 pasos: Contacto → Visita y medición → Presupuesto → Ejecución → Entrega y limpieza.
- 6 preguntas: presupuesto sin cargo, garantía, materiales, tiempos, gasista matriculado, formas de pago.
- 4 trabajos de ejemplo, 2 con antes/después.

El seed es idempotente: hace upsert por `slug` / `order` / hash de archivo. Los datos de contacto de `SiteSettings` quedan como valores de ejemplo, que se reemplazan por variables de entorno del seed (`SEED_WHATSAPP_NUMBER`, etc.) o, más adelante, desde el admin.

## Risks / Trade-offs

- **[Imágenes de muestra que no representan trabajos reales]** → se marcan con `credit` y el admin del próximo change permite reemplazarlas. No se deben presentar como "trabajos realizados" reales en producción: el seed de trabajos de ejemplo solo corre si `SEED_SAMPLE_PROJECTS=true`, que en producción está en `false`.
- **[Página larga: 8 capítulos + secciones]** → lazy loading de imágenes, `content-visibility: auto` en capítulos fuera de pantalla, y el comparador antes/después cargado con `React.lazy`.
- **[SSR depende de la API: si la API cae, el sitio cae]** → el loader muestra un `ErrorBoundary` amable con el botón de WhatsApp (el número va como fallback en una variable de entorno de web). Las respuestas se cachean 60 s.
- **[Los datos de contacto del negocio todavía no están definidos]** → quedan como variables del seed; el sitio no muestra lo que esté vacío.
- **[Tipografías pesadas]** → solo se incluyen los pesos y el subset latino necesarios, con `font-display: swap` y preload del peso de títulos.

## Migration Plan

Nueva migración Prisma aditiva (tablas nuevas). En el deploy:
1. `migrate`.
2. Seed de contenido una única vez en la VPS (`pnpm --filter @tamila/api seed:content`).
3. Crear el volumen `media` antes del primer `up`.

Rollback: el redeploy de la versión anterior ignora las tablas nuevas.

## Open Questions

- Número de WhatsApp, redes, horario y nombre comercial definitivos: se cargan por variables del seed o desde el admin, sin cambiar el código.
- Textos finales de cada servicio: el seed trae una primera versión que el cliente puede corregir desde el admin.
