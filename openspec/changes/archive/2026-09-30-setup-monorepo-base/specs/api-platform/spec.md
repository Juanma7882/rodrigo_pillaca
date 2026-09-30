# Spec Delta

## Purpose

Define el comportamiento transversal de la API: verificación de salud, errores uniformes, validación de configuración y entradas, y documentación.

## ADDED Requirements

### Requirement: Endpoint de salud
La API SHALL exponer `GET /api/health`, que responde 200 cuando la API y la base de datos están disponibles y 503 cuando la base de datos no responde.

#### Scenario: Todo disponible
- **WHEN** se llama a `/api/health` con la base de datos accesible
- **THEN** responde 200 con el estado de cada dependencia

#### Scenario: Base de datos caída
- **WHEN** se llama a `/api/health` y la base de datos no responde
- **THEN** responde 503

### Requirement: Formato de error uniforme
Todos los errores de la API SHALL responder con un JSON que incluya `statusCode`, `message` (en español) y `path`. Los errores internos MUST NOT exponer stack traces ni detalles internos.

#### Scenario: Error inesperado
- **WHEN** ocurre una excepción no controlada
- **THEN** la API responde 500 con un mensaje genérico y el detalle solo queda en los logs

### Requirement: Validación de entradas
La API MUST validar el cuerpo, los parámetros y la query de cada endpoint y rechazar con 400 los datos inválidos o los campos no permitidos, indicando qué campos fallaron.

#### Scenario: Cuerpo inválido
- **WHEN** se envía un login sin email
- **THEN** la API responde 400 indicando que el email es obligatorio

### Requirement: Configuración validada al arrancar
La API MUST validar sus variables de entorno al iniciar y MUST negarse a arrancar si falta alguna obligatoria o tiene un valor inválido, indicando cuál.

#### Scenario: Falta el secreto JWT
- **WHEN** la API arranca sin la variable del secreto JWT
- **THEN** el proceso termina con un error que nombra la variable faltante

### Requirement: Documentación de la API
La API SHALL publicar documentación OpenAPI (Swagger) en desarrollo. En producción la documentación MUST NOT estar expuesta públicamente.

#### Scenario: Swagger en producción
- **WHEN** se solicita la ruta de documentación en producción
- **THEN** la API responde 404

### Requirement: CORS restringido
La API MUST aceptar solicitudes con credenciales solo desde los orígenes configurados para web y admin.

#### Scenario: Origen no permitido
- **WHEN** un navegador hace una solicitud desde un origen no configurado
- **THEN** la respuesta no incluye los encabezados CORS que la permitirían
