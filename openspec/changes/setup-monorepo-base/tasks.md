# Tasks

## 1. Monorepo y herramientas de calidad

- [x] 1.1 Crear `package.json` raíz (`packageManager: pnpm`, `engines.node: 24`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `e2e`), `.nvmrc`, `.gitignore`, `.editorconfig` y verificar que `pnpm install` termina sin errores
- [x] 1.2 Configurar `turbo.json` con las tareas `dev`, `build`, `lint`, `typecheck`, `test` y `test:e2e` (`dependsOn: ["^build"]`) y verificar con `pnpm turbo run build --dry-run`
- [x] 1.3 Crear `packages/config` con ESLint flat config (base, react, nest), Prettier y tsconfig base/react/node, y verificar que `pnpm lint` pasa en el paquete
- [x] 1.4 Configurar Husky + lint-staged + commitlint (conventional) y verificar que un commit con el mensaje `foo` es rechazado y uno con `chore: test` es aceptado
- [x] 1.5 Crear `.env.example` con todas las variables (BD, JWT, Turnstile, admin inicial, orígenes, puertos) con valores ficticios y verificar que `.env` está en `.gitignore`

## 2. Paquete compartido

- [x] 2.1 Crear `packages/shared` con build tsup (ESM + CJS + d.ts) y verificar que `pnpm --filter @tamila/shared build` genera `dist/`
- [x] 2.2 Definir los esquemas Zod `loginSchema`, `authResponseSchema`, `adminProfileSchema` y `envSchema` con mensajes en español, y verificar con tests Vitest de casos válidos e inválidos

## 3. Tema y UI compartida

- [x] 3.1 Crear `packages/ui` con `theme.css` (Tailwind v4 `@theme`, paleta brand/ink y tokens semánticos para claro y `.dark`) según D5, y verificar que web y admin lo importan sin errores
- [x] 3.2 Implementar `ThemeProvider`, `useTheme` y `ThemeToggle` con persistencia en `localStorage` y fallback a `prefers-color-scheme`, y verificar con tests Vitest (sin preferencia → sistema; elección → persiste)
- [x] 3.3 Agregar el script inline anti-parpadeo (en `root.tsx` de web y en `index.html` de admin) y verificar en el navegador que recargar en modo claro no muestra antes el modo oscuro
- [x] 3.4 Inicializar shadcn/ui en `packages/ui` (Button, Input, Label, Card, Spinner/Skeleton) usando los tokens, y verificar que un test de contraste automático (texto/fondo de cada par de tokens ≥ 4.5:1) pasa en ambos modos
- [x] 3.5 Crear los componentes `<Turnstile>`, `<RouteError>` (mensaje + reintentar), `<PageLoader>` y `<NotFound>` en español, y verificar con tests Vitest que renderizan

## 4. App web (sitio público)

- [x] 4.1 Generar `apps/web` con `pnpm create react-router@latest apps/web` (modo framework, SSR, TS, Tailwind v4), adaptarlo al monorepo (`@tamila/web`, config compartida, `lang="es"`, estructura por features dentro de `app/`) y verificar que `pnpm --filter @tamila/web dev` levanta en el puerto 5173 y que la respuesta HTML ya trae el contenido renderizado
- [x] 4.2 Definir las rutas en `app/routes.ts` (home de ejemplo + 404 con status 404), con `meta` y `ErrorBoundary` que usa `<RouteError>`, y verificar en el build que cada ruta genera un chunk separado
- [x] 4.3 Agregar un componente pesado de ejemplo cargado con `React.lazy` + `Suspense` y verificar que su chunk solo se pide al mostrarlo
- [x] 4.4 Configurar la regla ESLint de límites entre features y verificar que importar un archivo interno de otro feature falla el lint
- [x] 4.5 Configurar Vitest + Testing Library y verificar que `pnpm --filter @tamila/web test` pasa

## 5. API (NestJS)

- [x] 5.1 Crear `apps/api` con NestJS + TS + ESLint compartido, prefijo `/api`, Helmet y CORS restringido a los orígenes configurados, y verificar que arranca en el puerto 3000
- [x] 5.2 Validar el entorno con `envSchema` al arrancar y verificar que sin `JWT_ACCESS_SECRET` el proceso termina con un error que nombra la variable
- [x] 5.3 Configurar `nestjs-pino` con redacción de `authorization`, `cookie` y `password`, y el filtro global de excepciones `{ statusCode, message, path }`, y verificar con un test e2e que un error 500 no expone el stack
- [x] 5.4 Crear el `ZodValidationPipe` propio (400 con campos inválidos) y Swagger solo fuera de producción, y verificar que `/api/docs` responde en dev y 404 con `NODE_ENV=production`
- [x] 5.5 Configurar Prisma con PostgreSQL, los modelos `AdminUser` y `RefreshToken` y la migración inicial, y verificar que `prisma migrate dev` aplica sin errores
- [x] 5.6 Implementar `/api/health` con terminus + check de Prisma y verificar con test e2e las respuestas 200 (BD arriba) y 503 (BD caída)
- [x] 5.7 Crear el seed idempotente del admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` con hash argon2id y verificar que ejecutarlo dos veces deja un único usuario

## 6. Autenticación y Turnstile en la API

- [x] 6.1 Implementar `TurnstileGuard` + `@RequireTurnstile()` con timeout y falla cerrada, y verificar con tests unitarios: token válido pasa; token ausente, inválido o error de red → 403
- [x] 6.2 Implementar `POST /api/auth/login` (Turnstile + throttler 5/min + error genérico) que emite el access JWT y la cookie refresh, y verificar con tests e2e: éxito, 401 genérico para email o contraseña incorrectos, 429 al sexto intento
- [x] 6.3 Implementar `POST /api/auth/refresh` con rotación y detección de reutilización por `familyId`, y verificar con tests e2e: la rotación funciona y reutilizar un token → 401 + todas las sesiones revocadas
- [x] 6.4 Implementar `POST /api/auth/logout` y `GET /api/auth/me` (protegido por JWT guard, sin `passwordHash`), y verificar con tests e2e: tras el logout el refresh falla; `/me` sin token → 401
- [x] 6.5 Verificar con una búsqueda en el código que no existe ningún endpoint de registro de usuarios

## 7. App admin

- [x] 7.1 Generar `apps/admin` con `pnpm create vite apps/admin --template react-ts`, agregar Tailwind v4, tema, React Router en modo data con rutas `lazy` y 404, el puerto 5174 y el proxy `/api` de Vite, y verificar que levanta y muestra el toggle de tema
- [x] 7.2 Implementar el feature `auth`: store Zustand del access token, cliente fetch con refresh automático ante un 401 y bootstrap de sesión al cargar, y verificar con tests Vitest del cliente (reintento tras refresh; logout si el refresh falla)
- [x] 7.3 Crear la página de login (React Hook Form + `loginSchema` + `<Turnstile>`, envío deshabilitado sin token, errores en español) y verificar con tests Vitest
- [x] 7.4 Crear un layout protegido con redirección al login y un dashboard vacío con botón de logout, y verificar que una ruta interna sin sesión redirige a `/login`

## 8. Docker

- [x] 8.1 Instalar el plugin `docker compose` v2 en la máquina de desarrollo y verificar con `docker compose version`
- [x] 8.2 Crear `docker/compose.dev.yml` (postgres, api, web, admin con bind mounts, volúmenes de node_modules y migraciones al arrancar) y verificar que un solo comando levanta todo y que editar un archivo recarga la app
- [x] 8.3 Crear los Dockerfiles multi-stage de `api` (con `pnpm deploy --prod`), `web` (build SSR + `react-router-serve`) y `caddy` (compila el admin y sirve sus estáticos), y verificar que `docker build` de los tres termina y que las imágenes no contienen devDependencies
- [x] 8.4 Crear `docker/compose.prod.yml` (postgres, migrate one-shot, api, web, caddy) y un `Caddyfile` (dominio → web SSR, admin.dominio → estáticos con SPA fallback, `/api/*` → api en ambos), y verificar el stack prod localmente con `localhost` (health 200, web y admin cargan)
- [x] 8.5 Agregar un script `pnpm dev:up`/`dev:down` en la raíz y documentar el arranque en el `README.md`, y verificar siguiendo el README desde un clon limpio

## 9. Pruebas E2E

- [ ] 9.1 Crear el workspace `e2e/` con Playwright configurado contra el stack local y las claves de prueba de Turnstile, y verificar que `pnpm test:e2e` ejecuta
- [ ] 9.2 Escribir los tests E2E: login y logout del admin, redirección sin sesión, toggle de tema persistente, 404 en web y admin, y chunk de ruta descargado solo al navegar; verificar que todos pasan

## 10. CI/CD y ramas

- [ ] 10.1 Crear `.github/workflows/ci.yml` (install congelado, lint, typecheck, test y build con cache de Turbo + job E2E con Postgres de servicio) para PRs a `develop`/`main`, y verificar que corre en verde en un PR de prueba
- [x] 10.2 Crear `.github/workflows/deploy.yml` (build y push de imágenes a GHCR con tag SHA; en la VPS por SSH: pull → migrate → up → check de health; abortar si migrate falla), y verificar su sintaxis con `actionlint`
- [ ] 10.3 Hacer el commit inicial en `main`, crear la rama `develop` y hacer push de ambas a `origin` (con confirmación del usuario), y verificar con `git ls-remote origin`
- [x] 10.4 Documentar en el README los pasos manuales: protección de ramas en GitHub, secrets requeridos y preparación de la VPS; verificar que la lista de secrets coincide con `.env.example`

## 11. Cierre

- [ ] 11.1 Ejecutar `pnpm turbo run lint typecheck test build` y `pnpm test:e2e` desde la raíz y verificar que todo pasa
- [x] 11.2 Reindexar el repo en codebase-memory y guardar en engram las convenciones establecidas (estructura por features, tokens, auth)
