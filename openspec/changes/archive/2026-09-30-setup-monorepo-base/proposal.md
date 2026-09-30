# Proposal

## Why

El proyecto TAMILA arranca desde cero y necesita una base técnica común antes de construir cualquier funcionalidad de negocio: un monorepo con el sitio público, el panel de administración y la API, un tema visual coherente con la marca, autenticación para el admin, protección contra bots y un camino claro de desarrollo local → CI → despliegue en la VPS. Definirlo ahora evita que cada app crezca con convenciones distintas.

## What Changes

- Crear un monorepo con pnpm workspaces + Turborepo:
  - `apps/web`: sitio público (React Router en modo framework + Vite + TypeScript + Tailwind) con renderizado en el servidor (SSR) para SEO, sin login.
  - `apps/admin`: panel de administración separado (SPA con React + Vite + TypeScript + Tailwind), con login.
  - `apps/api`: API REST en NestJS + Prisma + PostgreSQL.
  - `packages/shared` (tipos y esquemas Zod compartidos), `packages/ui` (tokens de tema y componentes base), `packages/config` (ESLint, Prettier y tsconfig compartidos).
- Estructura por features en los frontends, con lazy loading por ruta y por componente.
- Tema visual con la paleta de la marca (amarillo, blanco y negro), modo claro y oscuro, e interfaz solo en español.
- Autenticación del admin solo con JWT (access token + refresh token rotativo), sin registro público: el primer administrador se crea con un seed.
- Validación de Cloudflare Turnstile en el login del admin, en un guard reutilizable (el sitio público no tiene formularios: los pedidos llegan por WhatsApp).
- API con endpoint de salud, formato de errores consistente, validación de variables de entorno al arrancar y documentación Swagger fuera de producción.
- Docker: `docker-compose` de desarrollo (hot reload + PostgreSQL) y de producción (imágenes multi-stage + proxy reverso con HTTPS) para la VPS.
- Calidad: ESLint, Prettier, Husky + lint-staged, Conventional Commits; tests con Vitest (frontends), Jest + Supertest (API) y Playwright (E2E en el navegador).
- GitHub Actions: CI en PRs a `develop` y `main`; despliegue a la VPS al hacer push a `main`. Ramas: `main` = producción, `develop` = desarrollo.

Fuera de alcance (va en cambios de negocio posteriores): edición de imágenes y textos del sitio desde el admin, almacenamiento de archivos, contenido y páginas reales del sitio público.

## Capabilities

### New Capabilities
- `ui-theme`: paleta de marca, modo claro/oscuro con preferencia persistente, compartidos por web y admin.
- `frontend-shell`: renderizado en el servidor del sitio público, navegación con carga diferida por ruta y por componente, estados de carga y página 404 en web y admin.
- `admin-auth`: login, refresh, logout y protección de rutas del panel admin mediante JWT.
- `bot-protection`: verificación de Cloudflare Turnstile en el servidor para los formularios protegidos.
- `api-platform`: comportamiento transversal de la API (salud, errores, configuración, documentación).
- `dev-infrastructure`: entorno local con Docker, pipeline de CI y despliegue a la VPS.

### Modified Capabilities
<!-- Ninguna: el proyecto no tiene specs previas. -->

## Impact

- Código nuevo en todo el repositorio (`apps/*`, `packages/*`, `docker/`, `.github/workflows/`).
- Dependencias principales: React, Vite, Tailwind, React Router, TanStack Query, NestJS, Prisma, PostgreSQL, Vitest, Jest, Playwright, Turborepo.
- Servicios externos: Cloudflare Turnstile (site key + secret key), GitHub Actions y la VPS (acceso SSH y secrets).
- El entorno local requiere Node 24, pnpm y Docker con Compose.
