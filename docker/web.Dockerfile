# Sitio público (React Router SSR). Contexto de build: raíz del monorepo.
FROM node:24-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
ENV CI=true
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter "@tamila/web..."
# Número público de respaldo para la página de error: se embebe en el build.
ARG VITE_WHATSAPP_FALLBACK
ENV VITE_WHATSAPP_FALLBACK=${VITE_WHATSAPP_FALLBACK}
RUN pnpm --filter @tamila/shared build && pnpm --filter @tamila/web build
RUN pnpm --filter @tamila/web deploy --prod /out

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
EXPOSE 3000
CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]
