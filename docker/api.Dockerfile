# API NestJS de producción. Contexto de build: raíz del monorepo.
FROM node:24-bookworm-slim AS base
# openssl: Prisma lo detecta al instalar para elegir el motor de migraciones correcto.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
ENV CI=true
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter "@tamila/api..."
RUN pnpm --filter @tamila/shared build && pnpm --filter @tamila/api generate && pnpm --filter @tamila/api build
# Copia autocontenida de la API solo con dependencias de producción.
RUN pnpm --filter @tamila/api deploy --prod /out

FROM node:24-bookworm-slim AS runtime
# openssl: lo necesita el motor de migraciones de Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production MEDIA_DIR=/data/media MEDIA_ORIGINALS_DIR=/data/media-originals
# Los volúmenes de imágenes y originales heredan este dueño la primera vez que se montan.
RUN mkdir -p /data/media /data/media-originals \
  && chown node:node /data/media /data/media-originals
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
EXPOSE 3000
CMD ["node", "dist/src/main"]
