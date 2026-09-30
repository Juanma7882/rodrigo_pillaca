# Design

## Context

El repositorio está vacío (solo OpenSpec y git con `origin` apuntando a GitHub). Las decisiones de stack ya las tomó el usuario (ver proposal.md). Restricciones del entorno:

- Node 24 LTS y pnpm 12 en la máquina de desarrollo (WSL2).
- Docker: el engine es Docker Desktop (Windows) con integración WSL y `docker compose` responde v5.5.1. Se usa siempre `docker compose` (con espacio).
- Producción en una única VPS con Docker.
- Único idioma: español. Sin pagos. El único login es el del admin.

## Goals / Non-Goals

**Goals:**
- Esqueleto funcional de extremo a extremo: web con home de ejemplo, admin con login → dashboard vacío → logout, y API con health y auth.
- Convenciones fijadas desde el día uno (estructura por features, tokens de tema, validación compartida) para que los cambios de negocio solo agreguen features.
- Pipeline completo: desarrollo local → CI → despliegue en la VPS.

**Non-Goals:**
- Gestión de contenido (imágenes y textos editables desde el admin) y almacenamiento de archivos: próximo cambio de negocio.
- Varios administradores con roles: por ahora hay un solo rol, "admin".
- Recuperación de contraseña por email (no hay servicio de email todavía; se resetea con el seed/CLI).
- Monitoreo externo y backups automatizados de la BD (se definen al cerrar la infraestructura de la VPS).

## Decisions

### D1. Estructura del monorepo
```
apps/
  web/        React Router v8 modo framework + Vite, con SSR (sitio público; se genera con `pnpm create react-router`)
  admin/      React + Vite SPA (panel; se genera con `pnpm create vite --template react-ts`)
  api/        NestJS
packages/
  shared/     esquemas Zod + tipos (build con tsup → ESM + CJS)
  ui/         tokens de tema (CSS), ThemeProvider, componentes shadcn/ui base
  config/     eslint (flat config), prettier, tsconfig base
e2e/          Playwright (workspace propio)
docker/       Dockerfiles, compose de dev/prod, Caddyfile
```
Scope de paquetes: `@tamila/*`. Turborepo orquesta `lint`, `typecheck`, `test`, `build` y `dev`, con `dependsOn: ["^build"]` para que `shared` se compile antes que sus consumidores.
- *Alternativa:* Nx. Se descarta por ser más pesado y opinado de lo que necesita un proyecto de 3 apps.
- *Por qué se compila `shared`:* NestJS compila con `tsc`/CommonJS y no puede consumir TypeScript crudo de un workspace; Vite sí podría, pero un único formato de consumo evita diferencias entre apps.

### D2. Estructura por features en los frontends
```
src/
  app/          providers, router, layouts
  features/
    <feature>/  components/ hooks/ api/ pages/ index.ts (API pública del feature)
  shared/       ui/, lib/, hooks/ específicos de la app
```
Regla: un feature no importa internals de otro, solo su `index.ts`. La capa de rutas (`app/` fuera de `features/`) además puede importar `<feature>/pages/*` para cargarlas de forma diferida. Se hace cumplir con una regla propia de ESLint (`tamila/feature-boundaries`, en `packages/config`).

### D3. Router, SSR y lazy loading
- **Web (SSR):** React Router v8 en modo framework, con Vite por debajo y renderizado en el servidor (`ssr: true`). Las rutas se declaran en `app/routes.ts`; cada módulo de ruta se divide automáticamente en su propio chunk y se hidrata solo cuando se navega a él. Los datos se piden en el `loader` del servidor, que llama a la API por la red interna de Docker (`API_INTERNAL_URL`), así el HTML llega completo para Google. Cada ruta define `meta` (título y descripción) y un `ErrorBoundary` con reintento. La estructura por features (D2) vive dentro de `app/`: `app/routes/` solo tiene módulos de ruta delgados que componen features.
- **Admin (SPA):** React Router v8 en modo data (`createBrowserRouter`) con la propiedad `lazy` y un `errorElement` por ruta. No necesita SEO.
- **Ambas apps:** los componentes pesados usan `React.lazy` + `Suspense` con un fallback de `packages/ui`.
- *Alternativa descartada para web:* SPA + prerender. Obliga a regenerar el sitio en cada cambio de contenido del admin y no permite metadatos dinámicos por servicio.
- *Alternativa descartada:* TanStack Router/Start. React Router es más conocido y alcanza para este alcance.

### D4. Validación compartida con Zod
Los esquemas viven en `@tamila/shared` (Zod 4). El frontend los usa con React Hook Form (`zodResolver`). La API usa un `ZodValidationPipe` propio, aplicado por parámetro (`@Body(new ZodValidationPipe(schema))`), que responde 400 con la lista de campos inválidos. Swagger documenta los cuerpos con `z.toJSONSchema(schema)` en `@ApiBody`. Se usa NestJS 12: `nestjs-zod` solo soporta Nest 11, y el resto del ecosistema (`@nestjs/swagger`, `serve-static`, `testing`) ya exige 12. La configuración de entorno se valida con un esquema Zod en el bootstrap.
- *Alternativa:* class-validator en la API. Se descarta porque duplica las reglas que ya existen en el frontend.

### D5. Tema y paleta
Tailwind v4 con tokens CSS en `packages/ui/src/theme.css` (bloque `@theme`), importado por web y admin. Tokens semánticos (`--background`, `--foreground`, `--surface`, `--primary`, `--primary-foreground`, `--accent-text`, `--border`, `--ring`) con valores distintos bajo `.dark`.

Paleta base (tomada del logo TAMILA; ajustar si hay un manual de marca):

| Token | Valor | Uso |
|---|---|---|
| `brand-500` | `#F5C518` | Amarillo de marca: fondos de botones y acentos |
| `brand-700` | `#A87F06` | Hover en modo claro |
| `brand-800` | `#7A5C08` | Texto de acento sobre blanco (≥ 4.5:1) |
| `ink-950` | `#121212` | Fondo en oscuro / texto en claro |
| `ink-900` | `#1C1C1C` | Superficie en oscuro (fondo del logo) |
| `ink-300` | `#D4D4D4` | Texto secundario en oscuro (gris del logotipo) |
| `white` | `#FFFFFF` | Fondo en claro |

Regla de contraste: sobre amarillo siempre va texto `ink-950`; nunca hay texto amarillo sobre blanco (en modo claro se usa `brand-800`).

Modo oscuro por clase (`.dark` en `<html>`). Un script inline en el `<head>` (en web, el `Layout` de `root.tsx`, con `suppressHydrationWarning` en `<html>`; en admin, `index.html`) lee `localStorage` y `prefers-color-scheme` antes del primer render para evitar el parpadeo (FOUC). El `ThemeProvider` expone el toggle y persiste la elección.

### D6. Autenticación JWT
- Access token: JWT HS256, 15 min. Se guarda solo en memoria en el admin (store Zustand) y viaja en `Authorization: Bearer`.
- Refresh token: valor aleatorio opaco (32 bytes), 7 días, en una cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`. En la BD se guarda solo su hash SHA-256, con `familyId` para detectar reutilización: un token ya rotado revoca toda la familia y todas las sesiones del admin.
- Al cargar el admin se llama a `POST /api/auth/refresh` para recuperar la sesión. Un interceptor de TanStack Query / fetch reintenta una vez tras un 401 haciendo refresh.
- Hash de contraseñas con argon2id (`argon2`).
- Rate limit con `@nestjs/throttler` en login: 5 intentos/min por IP. La IP real se toma de `CF-Connecting-IP` / `X-Forwarded-For` con `trust proxy` configurado solo para el proxy local.
- Modelos Prisma: `AdminUser (id, email único, passwordHash, timestamps)` y `RefreshToken (id, adminUserId, tokenHash único, familyId, expiresAt, revokedAt, replacedById, createdAt)`.
- Seed idempotente que crea o actualiza el admin desde `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- *Alternativa:* refresh JWT en lugar de token opaco. Se descarta porque el opaco con hash permite revocarlo y detectar reutilización sin complejidad extra.

### D7. Mismo origen vía proxy
En producción Caddy hace proxy de `dominio` al servidor SSR de web, sirve `admin.dominio` → estáticos del admin, y en ambos hosts enruta `/api/*` a la API. Así el admin llama a su propio origen y la cookie `SameSite=Strict` funciona sin configurar CORS en el flujo normal. CORS igual queda restringido a los orígenes configurados (spec api-platform). En desarrollo, el dev server de Vite (web y admin) hace de proxy de `/api` hacia la API.

### D8. Turnstile
Un decorador `@RequireTurnstile()` + un guard leen el token del header `cf-turnstile-response` y lo verifican con `https://challenges.cloudflare.com/turnstile/v0/siteverify` (secret + remoteip, timeout de 5 s). Si falla o no hay respuesta, rechaza (falla cerrada). En el frontend hay un componente `<Turnstile>` en `packages/ui` (`@marsidev/react-turnstile`). Por ahora solo se usa en el login del admin: el sitio público no tiene formularios (los pedidos van por WhatsApp). En dev/test se usan las claves de prueba oficiales de Cloudflare (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

### D9. Transversales de la API
Prefijo global `/api`. `nestjs-pino` para logs JSON, que redacta `authorization`, `cookie` y `password`. Un filtro de excepciones global produce `{ statusCode, message, path }`. `@nestjs/terminus` + un check de Prisma para `/api/health`. Swagger se monta solo si `NODE_ENV !== 'production'`. Helmet activado.

### D10. Docker
- **Dev** (`docker/compose.dev.yml`): `postgres:17-alpine`, más `api`, `web` y `admin` sobre `node:24-alpine` con pnpm (corepack), el repo montado como bind mount y `node_modules` en volúmenes nombrados. Al arrancar, la API ejecuta `prisma migrate dev`. El archivo usa solo la sintaxis del Compose Spec, compatible con v2; v1 queda solo como best effort.
- **Prod** (`docker/compose.prod.yml`):
  - `postgres` con volumen persistente.
  - `migrate`: servicio one-shot que corre `prisma migrate deploy`.
  - `api`: imagen multi-stage con `pnpm deploy --prod`.
  - `web`: imagen multi-stage con el build SSR de React Router, servida con `react-router-serve` (Node).
  - `caddy`: imagen multi-stage que compila el admin, sirve sus estáticos y hace de proxy reverso hacia web y api, con HTTPS automático.
- **Puertos en dev:** web 4173, admin 4174, API 3000, Postgres 5435. En esta máquina Windows reserva los rangos 5151–5350 (Hyper-V), así que no se pueden usar los puertos por defecto de Vite (5173/5174); el 5432 y el 5434 los usan otros proyectos.

### D11. Tests
- **Unitarios en frontends:** Vitest + Testing Library (jsdom).
- **API:** Jest (unitarios) + Jest/Supertest (e2e de la API contra un Postgres real de pruebas).
- **Navegador:** Playwright en `e2e/`, contra el stack levantado. Cubre el login del admin, el toggle de tema, la 404 y el lazy loading (verificando las requests de chunks).

### D12. Calidad y CI/CD
- **Calidad local:** Husky con `pre-commit` (lint-staged: prettier + eslint) y `commit-msg` (commitlint con config conventional).
- **CI** (`.github/workflows/ci.yml`): se ejecuta en PRs a `develop`/`main`. Hace `pnpm install --frozen-lockfile` y `turbo run lint typecheck test build`. Un job E2E aparte levanta un Postgres de servicio + API + builds y ejecuta Playwright.
- **CD** (`.github/workflows/deploy.yml`): se ejecuta en push a `main`.
  1. Construye las imágenes `api`, `web` y `caddy` con tag igual al SHA y las publica en GHCR.
  2. Por SSH en la VPS: `docker compose pull` y `docker compose run --rm migrate`. Si la migración falla, se aborta y la versión anterior sigue sirviendo.
  3. Hace `docker compose up -d` y comprueba `/api/health`.
  4. Rollback: volver a desplegar el tag del SHA anterior.

## Risks / Trade-offs

- **[docker-compose v1.29 no soporta todo el Compose Spec]** (por ejemplo `depends_on.condition: service_completed_successfully`) → instalar el plugin `docker compose` v2 en la máquina de dev. La VPS se instala directamente con v2.
- **[Hot reload lento o que no detecta cambios en WSL2]** si el repo está en `/mnt/c` → el repo ya vive en el filesystem de Linux (`/home/juan/...`). Si aun así falla, activar `usePolling` en Vite y `--watch` con polling en Nest.
- **[Access token en memoria: se pierde al recargar la página]** → se recupera con `/api/auth/refresh` al iniciar. Es un costo aceptado a cambio de no exponer tokens a XSS en `localStorage`.
- **[La cookie `SameSite=Strict` depende del mismo origen]** → D7 garantiza el mismo origen. Si en el futuro la API pasa a otro dominio, habrá que revisar SameSite y CORS.
- **[Paleta derivada del logo a ojo]** → los valores quedan centralizados en `theme.css`: cambiarlos es editar un solo archivo.
- **[Un solo servidor: la BD y las apps comparten la VPS]** → aceptable para el tamaño actual. Los backups se definen aparte (Non-Goal).
- **[Cloudflare delante de la VPS puede ocultar la IP real]** → el rate limit usa `CF-Connecting-IP` solo si la conexión viene del proxy de confianza.

## Migration Plan

Proyecto nuevo, no hay migración de datos.

**Primer despliegue:**
1. Preparar la VPS: Docker + Compose v2, usuario de deploy con clave SSH y DNS apuntando a la VPS.
2. Cargar en GitHub los secrets de la VPS (host, usuario, clave SSH) y la site key de Turnstile. Los secretos de la app (JWT, BD, Turnstile secret, admin inicial) viven solo en el `.env` de la VPS.
3. Crear la rama `develop` desde `main` y configurar la protección de ramas: CI obligatorio en `main` y `develop`.
4. Mergear a `main`, lo que dispara el despliegue.
5. Ejecutar el seed del admin una sola vez en la VPS.

**Rollback:** redeploy del tag anterior. Las migraciones se escriben siempre de forma compatible hacia atrás (expand/contract).

## Open Questions

- Dominio definitivo y si el DNS pasa por el proxy de Cloudflare (nube naranja). Solo cambia valores en el Caddyfile y los secrets, no la arquitectura.
- Proveedor y tamaño de la VPS.
- Valores exactos de la paleta si existe un manual de marca con códigos oficiales.
