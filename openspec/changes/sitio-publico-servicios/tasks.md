# Tasks

> Requiere `setup-monorepo-base` implementado.

## 1. Modelo de contenido y esquemas

- [x] 1.1 Agregar a Prisma los modelos `SiteSettings`, `MediaAsset`, `Service`, `ServiceImage`, `Project`, `ProjectImage`, `ProcessStep` y `Faq` (D1), crear la migración y verificar que `prisma migrate dev` aplica sin errores
- [x] 1.2 Definir en `@tamila/shared` los esquemas Zod de las respuestas públicas (`siteContent`, `serviceSummary`, `serviceDetail`, `project`, `mediaAsset`) y verificar con tests Vitest de casos válidos e inválidos

## 2. Medios

- [x] 2.1 Implementar en `apps/api/src/media` la función que genera variantes AVIF/WebP 480/960/1600 con `sharp`, nombres con hash y el `MediaAsset` correspondiente, y verificar con un test unitario que genera 6 archivos y registra dimensiones correctas
- [x] 2.2 Servir `/media/*` en dev con `@nestjs/serve-static` y en prod desde Caddy con caché inmutable, con un volumen `media` en ambos compose, y verificar que una imagen sigue disponible después de `docker compose up -d --force-recreate`

## 3. Seed de contenido

- [x] 3.1 Seleccionar y guardar en `apps/api/prisma/seed-media/` imágenes de licencia libre (3 por servicio + hero/OG + trabajos de ejemplo) con `CREDITS.md`, y verificar que cada archivo tiene su crédito listado
- [x] 3.2 Escribir el seed idempotente `seed:content` (configuración, 5 pasos, 6 preguntas, 8 servicios con textos e imágenes; trabajos de ejemplo solo si `SEED_SAMPLE_PROJECTS=true`) y verificar que ejecutarlo dos veces deja 8 servicios y ninguno de aire acondicionado

## 4. API pública

- [x] 4.1 Implementar `PublicContentModule` con `GET /api/public/site`, `/services`, `/services/:slug` y `/projects` (solo publicados, ordenados, con headers de caché), y verificar con tests e2e: 200 con el contenido, 404 para un slug no publicado, y 404/405 para POST
- [x] 4.2 Documentar los endpoints en Swagger y verificar que aparecen en `/api/docs` en dev

## 5. Base editorial en `packages/ui` y web

- [x] 5.1 Agregar Montserrat (800/900) e Inter (400/500/600) con `@fontsource` (subset latino), tokens tipográficos y preload del peso de títulos, y verificar en DevTools que no hay requests a dominios de fuentes externos
- [x] 5.2 Crear los componentes `ChapterNumber`, `Eyebrow`, `Rule`, `PullQuote` y `ResponsiveImage` (con `<picture>`, `srcset`, `width`/`height`, lazy y grayscale→color al hover), y verificar con tests Vitest y revisión visual en claro y oscuro
- [x] 5.3 Crear en web el cliente de la API para loaders (usa `API_INTERNAL_URL` en el servidor) y el `loader` de `root` con la configuración del sitio, y verificar que un error de la API muestra el `ErrorBoundary` con el botón de WhatsApp de fallback

## 6. Layout y WhatsApp

- [x] 6.1 Implementar `buildWhatsAppUrl`, `WhatsAppButton` (no renderiza sin número) y `FloatingWhatsApp`, y verificar con tests Vitest la URL codificada, el mensaje por servicio y el caso sin número
- [x] 6.2 Implementar la `Navbar` (logo, enlaces `/#seccion`, toggle de tema, CTA; se oculta al bajar y reaparece al subir) y el `MobileMenu` accesible (Escape, foco atrapado, cierre al elegir), y verificar con tests Vitest y a mano en 375 px
- [x] 6.3 Implementar el `Footer` (logo, servicios publicados, WhatsApp, redes configuradas, horario, año) y verificar con un test que una red vacía no se renderiza

## 7. Inicio

- [x] 7.1 Implementar la ruta `/` con un `loader` que pide `/site`, `/services` y `/projects` en paralelo, más `meta`, y verificar con `curl` que el HTML del servidor contiene el título del hero y los nombres de los servicios
- [x] 7.2 Implementar el `Hero` a pantalla completa con título centrado, subtítulo y CTA, y verificar a 375 px y 1440 px que todo es visible sin scroll
- [x] 7.3 Implementar `ServicesIndex` ("CONTENIDO", dos columnas numeradas, clic → `#servicio-<slug>`) y `RotatingCover` (4 s, crossfade, pausa con hover/foco, sin rotación con movimiento reducido o pestaña oculta), y verificar con tests Vitest usando timers falsos
- [x] 7.4 Implementar `ServiceChapter` con la disposición editorial de D5 (espejada en pares, una columna en celulares, bloque de trabajo destacado opcional, CTA por servicio), y verificar visualmente en claro y oscuro a 375, 768 y 1440 px
- [x] 7.5 Implementar `ProcessSteps` numerados y verificar el orden con un test
- [x] 7.6 Implementar `ProjectsGallery` y `BeforeAfter` (cargado con `React.lazy`, operable con mouse, táctil y flechas; sección oculta sin trabajos), y verificar con tests Vitest y que el chunk de `BeforeAfter` solo se pide al llegar a la sección
- [x] 7.7 Implementar `FaqAccordion` accesible (`aria-expanded`, teclado) y verificar con un test
- [x] 7.8 Agregar las animaciones de entrada con `IntersectionObserver`, desactivadas con `prefers-reduced-motion` (sin `content-visibility`: rompía la navegación a secciones, ver design), y verificar que con movimiento reducido no hay transiciones

## 8. Página por servicio

- [x] 8.1 Implementar `/servicios/:slug` con `loader` (404 real si no existe), capítulo completo, trabajos del rubro, anterior/siguiente y CTA, y verificar con `curl` el status 200 para `durlock` y 404 para `no-existe`

## 9. SEO

- [x] 9.1 Implementar `buildMeta` (título, descripción, canonical con `PUBLIC_SITE_URL`, Open Graph) en `/` y `/servicios/:slug`, y verificar que el HTML del servidor trae las etiquetas correctas
- [x] 9.2 Agregar JSON-LD `HomeAndConstructionBusiness` en el inicio y `Service` en cada servicio, y verificar con el validador de schema.org
- [x] 9.3 Implementar las resource routes `/sitemap.xml` y `/robots.txt` (dinámicas, caché de 1 h), y verificar que un servicio despublicado desaparece del sitemap

## 10. Pruebas y cierre

- [x] 10.1 Escribir los tests E2E con Playwright: navegación de la navbar a secciones (desktop y móvil), clic en el índice → capítulo, hover en el índice cambia la imagen, enlaces de WhatsApp con el mensaje correcto, página de servicio y 404; verificar que todos pasan
- [ ] 10.2 Correr Lighthouse en el inicio (móvil) y verificar Performance ≥ 90, Accessibility ≥ 95 y SEO ≥ 95; corregir lo que falte
- [x] 10.3 Ejecutar `pnpm turbo run lint typecheck test build` y `pnpm test:e2e`, verificar que todo pasa, reindexar en codebase-memory y guardar en engram las convenciones editoriales y del modelo de contenido
