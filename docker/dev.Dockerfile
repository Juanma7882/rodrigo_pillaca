# Imagen base de desarrollo: Node 24 + pnpm. El código se monta como bind mount.
FROM node:24-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
ENV PNPM_HOME=/pnpm CI=true COREPACK_HOME=/pnpm/corepack
# Los volúmenes de node_modules heredan este dueño: el contenedor corre con el usuario del host
# (uid 1000 por defecto) para no dejar archivos de root en el repo.
RUN mkdir -p /pnpm/store /pnpm/corepack /data/media /app/node_modules \
    /app/apps/api/node_modules /app/apps/web/node_modules /app/apps/admin/node_modules \
    /app/packages/config/node_modules /app/packages/shared/node_modules \
    /app/packages/ui/node_modules /app/e2e/node_modules \
  && cp -r /root/.cache/node/corepack/. /pnpm/corepack/ 2>/dev/null || true \
  && chown -R node:node /pnpm /app /data
WORKDIR /app
