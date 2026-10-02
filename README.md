# TAMILA

Sitio público de servicios de construcción y reformas, con panel de administración.

| App               | Stack                                                  | Dev                                             |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `apps/web`        | Sitio público: React Router (SSR) + Vite + Tailwind    | http://localhost:4173                           |
| `apps/admin`      | Panel de administración (SPA): React + Vite + Tailwind | http://localhost:4174                           |
| `apps/api`        | API REST: NestJS + Prisma + PostgreSQL                 | http://localhost:3000/api · docs en `/api/docs` |
| `packages/shared` | Esquemas Zod y tipos compartidos                       |                                                 |
| `packages/ui`     | Tema (paleta, modo claro/oscuro) y componentes base    |                                                 |
| `packages/config` | ESLint, Prettier y tsconfig compartidos                |                                                 |
| `e2e`             | Tests end-to-end con Playwright                        |                                                 |

## Requisitos

- Node 24 (`nvm use`) y pnpm 12 (`corepack enable`)
- Docker con Compose v2 (`docker compose version`)

## Primer arranque

```bash
pnpm install              # dependencias + hooks de git (husky)
cp .env.example .env      # completar valores si hace falta
pnpm dev:up               # postgres + api + web + admin con recarga automática
pnpm dev:logs             # ver logs
```

La primera vez, crear el administrador:

```bash
docker compose --env-file .env -f docker/compose.dev.yml exec api pnpm --filter @tamila/api seed:admin
```

Y cargar el contenido inicial del sitio (servicios, pasos, preguntas frecuentes e imágenes de muestra):

```bash
docker compose --env-file .env -f docker/compose.dev.yml exec api pnpm --filter @tamila/api seed:content
```

El seed de admin usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`. El de contenido es idempotente y no pisa lo que ya exista. Las fotos de muestra son de Wikimedia Commons (ver `apps/api/prisma/seed-media/CREDITS.md`).

Después de agregar dependencias, sincronizá los contenedores con `pnpm dev:install`. El login de desarrollo usa las claves de prueba de Cloudflare Turnstile, que siempre pasan.

Para apagar todo: `pnpm dev:down`.

### Puertos

| Servicio | Puerto | Nota                           |
| -------- | ------ | ------------------------------ |
| web      | 4173   |                                |
| admin    | 4174   |                                |
| api      | 3000   |                                |
| postgres | 5435   | Bases `tamila` y `tamila_test` |

Los puertos por defecto de Vite (5173/5174) no se usan porque en Windows + WSL suelen caer en rangos reservados por Hyper-V (`netsh interface ipv4 show excludedportrange protocol=tcp`).

## Comandos

```bash
pnpm lint          # ESLint en todo el monorepo
pnpm typecheck     # TypeScript
pnpm test          # tests unitarios (Vitest en frontends, Jest en la API)
pnpm build         # build de todo
pnpm test:e2e      # e2e: API (Jest + Supertest) y navegador (Playwright)
pnpm format        # Prettier
```

Base de datos (desde `apps/api`, con Postgres levantado):

```bash
pnpm db:migrate    # crea y aplica una migración nueva (prisma migrate dev)
pnpm db:deploy     # aplica migraciones pendientes
```

## Convenciones

- **Flujo de trabajo:** los cambios se planifican con OpenSpec (`openspec/`). Ver `CLAUDE.md`.
- **Estructura por features:**
  - `src/features/<feature>/` en admin y `app/features/<feature>/` en web.
  - Un feature solo importa el `index.ts` de otro feature; lo controla ESLint (`tamila/feature-boundaries`).
  - La capa de rutas puede cargar `pages/` de un feature de forma diferida.
- **Lazy loading:** cada ruta es un chunk propio, y los componentes pesados usan `React.lazy`.
- **Tema:**
  - Los tokens están en `packages/ui/src/theme.css`.
  - Sobre amarillo siempre va texto oscuro, y nunca hay texto amarillo sobre blanco (en modo claro se usa `brand-text`).
  - Un test verifica el contraste WCAG AA.
- **Validación:** los esquemas Zod de `@tamila/shared` se usan en el frontend (React Hook Form) y en la API (`ZodValidationPipe`).
- **Commits:** Conventional Commits (`feat: …`, `fix: …`). Husky corre lint-staged y commitlint.
- **Ramas:** `main` = producción, `develop` = desarrollo. Todo entra por PR con CI en verde.

## Panel admin

El panel (`apps/admin`) es donde TAMILA edita el sitio sin tocar código. Está pensado primero para el celular: abajo hay una barra con Inicio, Servicios, Trabajos, Imágenes y "Más" (Configuración, Cómo trabajamos, Preguntas frecuentes); en la compu, un menú lateral.

- **Editar:** cada pantalla valida con las mismas reglas que la API y muestra los errores junto a cada campo. Si salís con cambios sin guardar, pregunta antes de descartarlos.
- **Ordenar:** servicios, trabajos, pasos y preguntas se reordenan arrastrando desde el asa (con el dedo, el mouse o el teclado: Espacio, flechas y Espacio). El orden se guarda solo.
- **Publicar:** el interruptor "Publicado" oculta o muestra algo en el sitio sin borrarlo.
- **Fotos:** se suben desde la galería o la cámara, enteras, con su texto alternativo. Las muy grandes (más de 3200 px u 8 MB) se achican en el navegador antes de subir. Los formularios tienen un selector para elegir de la biblioteca o subir sin salir.
- **Ver el sitio:** el link usa `VITE_PUBLIC_SITE_URL`; sin esa variable no se muestra. Los cambios se ven en el sitio en hasta un minuto.

## API de administración

El panel admin edita todo el contenido del sitio público con los endpoints de `/api/admin/*`. Todos piden el access token del admin (`Authorization: Bearer …`), responden con `Cache-Control: no-store` y están documentados en Swagger (`/api/docs`, solo en desarrollo). Los esquemas de entrada y salida están en `@tamila/shared` (`packages/shared/src/admin`).

| Recurso       | Endpoints                                                             |
| ------------- | --------------------------------------------------------------------- |
| Configuración | `GET`/`PATCH /admin/settings`                                         |
| Servicios     | `/admin/services`: listar, ver, crear, editar, borrar y `PUT order`   |
| Trabajos      | `/admin/projects` (filtro `?serviceId=`): igual que servicios         |
| Pasos         | `/admin/process-steps`: listar, crear, editar, borrar y `PUT order`   |
| Preguntas     | `/admin/faqs`: listar, crear, editar, borrar y `PUT order`            |
| Imágenes      | `/admin/media`: subir (multipart), listar, editar alt/crédito, borrar |

- **Edición:** se edita por id; `PATCH` es parcial y las galerías (`imageIds`) se reemplazan completas. Para reordenar se manda la lista completa de ids en el orden deseado.
- **Integridad:** no se puede borrar un servicio con trabajos ni una imagen en uso (409). El trabajo destacado tiene que ser del mismo servicio.
- **Caché:** los cambios se ven en el sitio en hasta 60 s (la caché de web).

### Imágenes

- Se aceptan JPEG, PNG, WebP y AVIF de hasta 10 MB, validados por el contenido del archivo. Las fotos HEIC del iPhone hay que exportarlas como JPEG.
- Cada imagen se convierte a AVIF y WebP en 480, 960 y 1600 px, sin metadatos EXIF (ni ubicación GPS).
- **Presupuesto de peso:** 40 / 120 / 250 KB para 480 / 960 / 1600 px. La calidad baja de a pasos hasta entrar. El tope se garantiza en AVIF, que es lo que descarga casi todo el mundo; la WebP de respaldo puede pasarse en fotos muy detalladas y queda avisado en el log.
- **Originales:** se guardan en privado en `MEDIA_ORIGINALS_DIR`, que nunca se publica.
- **Re-optimizar:** si cambian los topes o la codificación, se sube `MEDIA_ENCODING_VERSION` en `apps/api/src/media/media-processor.ts` y se corre `media:reoptimize`. Las variantes nuevas tienen otras URLs, así la caché inmutable de `/media` no sirve las viejas. Con `--force` regenera todo, aunque ya esté en la versión vigente.

```bash
docker compose --env-file .env -f docker/compose.dev.yml exec api pnpm --filter @tamila/api media:reoptimize
```

## Despliegue (VPS)

Cada push a `main` ejecuta `.github/workflows/deploy.yml`:

1. Construye las imágenes `api`, `web` y `caddy` y las publica en GHCR con el SHA del commit.
2. Copia `docker/compose.prod.yml` a la VPS.
3. Por SSH descarga las imágenes y ejecuta las migraciones (si fallan, se aborta y sigue la versión anterior).
4. Levanta la nueva versión y espera a que `/api/health` responda.

**Rollback:** re-ejecutar el workflow de un commit anterior (Actions → Deploy → Run workflow) o, en la VPS:

```bash
IMAGE_PREFIX=ghcr.io/juanma7882/rodrigo_pillaca IMAGE_TAG=<sha-anterior> docker compose -f compose.prod.yml up -d --no-build
```

### 1. Preparar la VPS (una sola vez)

- Instalar Docker Engine + Compose v2.
- Crear un usuario de deploy con acceso por clave SSH y agregarlo al grupo `docker`.
- Apuntar el DNS de `SITE_DOMAIN` y `ADMIN_DOMAIN` a la VPS. Caddy obtiene los certificados HTTPS solo.
  - Si se usa el proxy de Cloudflare (nube naranja), configurar SSL en modo _Full (strict)_.
- Abrir los puertos 80 y 443.
- Crear el directorio de la app (por defecto `~/tamila`) con un `.env` de producción basado en `.env.example`:

| Variable                                                                                                    | Valor en producción                                                            |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`                                                         | Credenciales de la base (clave larga y aleatoria)                              |
| `DATABASE_URL`                                                                                              | La arma compose automáticamente: no hace falta                                 |
| `JWT_ACCESS_SECRET`                                                                                         | `openssl rand -base64 48`                                                      |
| `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS`                                                          | `900` y `7`                                                                    |
| `TURNSTILE_SECRET_KEY`                                                                                      | Secret key real de Cloudflare Turnstile                                        |
| `VITE_TURNSTILE_SITE_KEY`                                                                                   | No se usa en la VPS: va como variable de GitHub (`TURNSTILE_SITE_KEY`)         |
| `CORS_ORIGINS`                                                                                              | `https://<SITE_DOMAIN>,https://<ADMIN_DOMAIN>`                                 |
| `TRUST_PROXY_HOPS`                                                                                          | `1` (Caddy)                                                                    |
| `LOG_LEVEL`                                                                                                 | `info`                                                                         |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                                                             | Administrador inicial (solo para el seed)                                      |
| `MEDIA_DIR`                                                                                                 | No hace falta: compose lo fija en `/data/media` (volumen persistente)          |
| `MEDIA_ORIGINALS_DIR`                                                                                       | No hace falta: compose lo fija en `/data/media-originals` (volumen privado)    |
| `PUBLIC_SITE_URL`                                                                                           | `https://<SITE_DOMAIN>` (canonical, Open Graph y sitemap)                      |
| `SEED_WHATSAPP_NUMBER`, `SEED_INSTAGRAM_URL`, `SEED_FACEBOOK_URL`, `SEED_TIKTOK_URL`, `SEED_BUSINESS_HOURS` | Datos de contacto iniciales (formato de WhatsApp: internacional sin `+`)       |
| `SEED_SAMPLE_PROJECTS`                                                                                      | `false`                                                                        |
| `VITE_WHATSAPP_FALLBACK`                                                                                    | No se usa en la VPS: va como variable de GitHub (`WHATSAPP_FALLBACK`)          |
| `VITE_PUBLIC_SITE_URL`                                                                                      | No se usa en la VPS: va como variable de GitHub (`PUBLIC_SITE_URL`)            |
| `SITE_DOMAIN`, `ADMIN_DOMAIN`                                                                               | Dominios reales, sin `http://` (p. ej. `tamila.com.ar`, `admin.tamila.com.ar`) |
| `HTTP_PORT`, `HTTPS_PORT`                                                                                   | `80` y `443`                                                                   |
| `API_PORT`, `WEB_PORT`, `ADMIN_PORT`, `POSTGRES_PORT`, `DATABASE_URL_TEST`, `API_INTERNAL_URL`              | Solo desarrollo: no hacen falta                                                |

`IMAGE_PREFIX` e `IMAGE_TAG` no van en el `.env`: los define el workflow de deploy en cada despliegue.

Después del primer despliegue, crear el administrador:

```bash
docker compose -f compose.prod.yml run --rm api node dist/src/scripts/seed-admin
docker compose -f compose.prod.yml run --rm -e SEED_SAMPLE_PROJECTS=false api node dist/src/scripts/seed-content
```

En producción, `SEED_SAMPLE_PROJECTS` va siempre en `false`: los trabajos de ejemplo no son reales.

Si la base ya tenía imágenes de una versión anterior, después del seed de contenido (que registra los originales de las fotos de muestra) hay que pasarlas a la codificación vigente:

```bash
docker compose -f compose.prod.yml run --rm api node dist/src/scripts/reoptimize-media
```

### 2. Configurar GitHub (una sola vez)

En **Settings → Secrets and variables → Actions**, dentro del environment `production`:

| Tipo     | Nombre               | Valor                                                   |
| -------- | -------------------- | ------------------------------------------------------- |
| Secret   | `VPS_HOST`           | IP o dominio de la VPS                                  |
| Secret   | `VPS_USER`           | Usuario de deploy                                       |
| Secret   | `VPS_SSH_KEY`        | Clave privada SSH del usuario de deploy                 |
| Secret   | `VPS_PORT`           | Puerto SSH (opcional, por defecto 22)                   |
| Variable | `TURNSTILE_SITE_KEY` | Site key real de Turnstile (pública, va en el admin)    |
| Variable | `WHATSAPP_FALLBACK`  | WhatsApp para la página de error si la API no responde  |
| Variable | `PUBLIC_SITE_URL`    | URL pública del sitio (link "Ver el sitio" del admin)   |
| Variable | `VPS_APP_DIR`        | Directorio de la app (opcional, por defecto `~/tamila`) |

Los secretos de la aplicación (JWT, base de datos, Turnstile secret) viven solo en el `.env` de la VPS, nunca en el repositorio ni en GitHub.

### 3. Proteger las ramas

En **Settings → Branches**, agregar reglas para `main` y `develop`:

- _Require a pull request before merging_.
- _Require status checks to pass_: `Lint, tipos, tests y build` y `Tests end-to-end`.
- _Do not allow bypassing the above settings_.
