# Proposal

## Why

TAMILA necesita un sitio público que presente sus servicios de construcción y reformas y convierta visitas en consultas por WhatsApp. El diseño toma la estética de una revista editorial (índice numerado, "páginas de capítulo" por servicio, grillas asimétricas) para diferenciarse de los sitios genéricos de contratistas. Como el negocio depende de búsquedas locales, el sitio tiene que ser indexable por Google.

## What Changes

- Barra de navegación y footer comunes a todo el sitio.
- Página de inicio de una sola columna narrativa, con estas secciones:
  - **Hero**: título centrado, subtítulo y llamado a WhatsApp.
  - **Índice de servicios**: lista numerada al estilo "Contenido" de revista, con una imagen que rota entre servicios y reacciona al mouse.
  - **Capítulos de servicio**: una "página de capítulo" por servicio, con número grande, nombre, bajada, descripción, qué incluye, fotos y trabajo destacado. El diseño alterna entre servicios pares e impares.
  - **Cómo trabajamos**: pasos numerados.
  - **Trabajos realizados**: galería con comparador antes/después.
  - **Preguntas frecuentes**.
- Página propia por servicio (`/servicios/<slug>`) para SEO, con el mismo diseño de capítulo y los trabajos de ese rubro.
- Contacto exclusivamente por WhatsApp: botón flotante, llamados en hero, capítulos y footer, con mensajes precargados según el servicio. No hay formulario.
- Servicios iniciales: Durlock, Steelframe, Pintura, Colocación de piso flotante y de madera, Pulido de piso, Plomería, Electricidad y Gas. Instalación de aire **no** se carga por ahora.
- Todo el contenido (textos, servicios, trabajos, pasos, preguntas, datos de contacto) se guarda en la base de datos y se expone mediante endpoints públicos de solo lectura. Se carga con un seed de contenido de ejemplo e **imágenes de muestra**, porque todavía no hay fotos reales.
- SEO local: metadatos por página, datos estructurados de negocio local, `sitemap.xml` y `robots.txt`.

Fuera de alcance: la edición de todo este contenido y la subida de imágenes desde el admin (próximo change, `admin-gestion-contenido`), testimonios, zona de cobertura, "sobre nosotros" y formulario de contacto.

## Capabilities

### New Capabilities
- `site-layout`: barra de navegación y footer del sitio público.
- `home-sections`: hero, cómo trabajamos, trabajos realizados y preguntas frecuentes.
- `service-catalog`: índice de servicios con imagen rotativa, capítulos de servicio en el inicio y página por servicio.
- `whatsapp-contact`: llamados a WhatsApp con mensajes precargados.
- `public-content-api`: modelo de contenido, endpoints públicos de lectura, medios y seed de contenido de ejemplo.
- `seo`: metadatos, datos estructurados, sitemap y robots.

### Modified Capabilities
<!-- Ninguna: las capabilities de la base (setup-monorepo-base) no cambian sus requisitos. -->

## Impact

- **Depende de** `setup-monorepo-base`: monorepo, `apps/web` con SSR, API, Prisma y tema.
- `apps/web`: nuevos features (`layout`, `hero`, `services`, `process`, `projects`, `faq`, `whatsapp`, `seo`) y rutas `/`, `/servicios/:slug`, `/sitemap.xml` y `/robots.txt`.
- `apps/api`: módulo de contenido público, nuevos modelos Prisma con su migración, entrega de imágenes y seed de contenido.
- `packages/shared`: esquemas Zod del contenido público.
- `packages/ui`: tipografías de la marca y componentes editoriales (número de capítulo, rótulos, separadores).
- Infraestructura: volumen persistente para imágenes y ruta `/media/*` en Caddy.
- Dependencias nuevas: `sharp` (variantes de imagen en el seed) y `@fontsource` (tipografías locales).
