#!/bin/sh
# Crea la base de datos de pruebas (tests e2e de la API) junto a la principal.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE DATABASE "${POSTGRES_DB}_test" OWNER "$POSTGRES_USER";
SQL
