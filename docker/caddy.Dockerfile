# Proxy reverso + estáticos del admin. Contexto de build: raíz del monorepo.
FROM node:24-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
ENV CI=true
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@tamila/admin..."
# La site key de Turnstile es pública: se embebe en el build del admin.
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
RUN pnpm --filter @tamila/shared build && pnpm --filter @tamila/admin build

FROM caddy:2-alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/admin/dist /srv/admin
