# dev-infrastructure Specification

## Purpose
Garantiza que cualquier desarrollador levante el proyecto con un solo comando, que el código pase controles automáticos antes de integrarse y que `main` se despliegue en la VPS de forma reproducible.

## Requirements

### Requirement: Entorno local con un comando
El proyecto SHALL poder levantarse en local (web, admin, API y PostgreSQL) con un único comando de Docker Compose, con recarga automática al editar código.

#### Scenario: Primer arranque
- **WHEN** un desarrollador clona el repo, copia `.env.example` a `.env` y ejecuta el comando de arranque
- **THEN** web, admin, API y base de datos quedan accesibles en sus puertos documentados, con las migraciones aplicadas

#### Scenario: Recarga automática
- **WHEN** el desarrollador edita un archivo de cualquier app
- **THEN** el cambio se refleja sin reiniciar los contenedores

### Requirement: Controles de calidad antes del commit
Cada commit MUST pasar el formateo y el lint de los archivos modificados, y su mensaje MUST seguir Conventional Commits.

#### Scenario: Mensaje inválido
- **WHEN** un desarrollador hace un commit con un mensaje fuera del formato Conventional Commits
- **THEN** el commit se rechaza

### Requirement: Integración continua
Cada pull request hacia `develop` o `main` SHALL ejecutar lint, verificación de tipos, tests unitarios, tests E2E y build de todas las apps. Un PR con cualquiera de esos pasos fallando MUST NOT poder integrarse.

#### Scenario: Test fallido
- **WHEN** un PR tiene un test que falla
- **THEN** el check de CI queda en rojo y el PR no se puede mergear

### Requirement: Despliegue a producción
Cada push a `main` SHALL construir imágenes de producción y desplegarlas en la VPS, aplicando las migraciones pendientes antes de dar tráfico a la nueva versión. Todo el tráfico público MUST servirse por HTTPS.

#### Scenario: Merge a main
- **WHEN** se mergea un PR a `main` con CI en verde
- **THEN** la nueva versión queda desplegada en la VPS y `/api/health` responde 200

#### Scenario: Migración fallida
- **WHEN** una migración falla durante el despliegue
- **THEN** el despliegue se aborta y la versión anterior sigue sirviendo tráfico

### Requirement: Secretos fuera del repositorio
Ningún secreto (claves JWT, credenciales de BD, secret key de Turnstile, claves SSH) MUST versionarse. El repositorio SHALL incluir un `.env.example` con todas las variables necesarias y valores ficticios.

#### Scenario: Revisión del repo
- **WHEN** se inspecciona el contenido versionado
- **THEN** no hay archivos `.env` reales ni secretos, y `.env.example` lista todas las variables
