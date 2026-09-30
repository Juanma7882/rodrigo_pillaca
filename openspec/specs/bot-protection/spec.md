# bot-protection Specification

## Purpose
Evita que los bots usen los formularios protegidos, verificando en el servidor un desafío de Cloudflare Turnstile antes de procesar la solicitud.

## Requirements

### Requirement: Verificación en el servidor
Todo endpoint marcado como protegido SHALL verificar el token de Turnstile contra Cloudflare antes de ejecutar su lógica. Una solicitud sin token o con un token inválido, vencido o ya usado MUST rechazarse con 403, sin ejecutar la lógica del endpoint.

#### Scenario: Token válido
- **WHEN** una solicitud a un endpoint protegido incluye un token de Turnstile válido
- **THEN** la solicitud continúa con normalidad

#### Scenario: Token ausente o inválido
- **WHEN** una solicitud a un endpoint protegido no incluye token o Cloudflare lo rechaza
- **THEN** la API responde 403 y no procesa la solicitud

### Requirement: Falla cerrada
Si no se puede contactar a Cloudflare para verificar el token, el endpoint protegido MUST rechazar la solicitud en lugar de dejarla pasar.

#### Scenario: Cloudflare no responde
- **WHEN** la verificación con Cloudflare da error o supera el tiempo de espera
- **THEN** la API rechaza la solicitud y registra el incidente en los logs

### Requirement: Widget en formularios protegidos
Los formularios del frontend que llaman a endpoints protegidos SHALL mostrar el widget de Turnstile y MUST impedir el envío hasta obtener un token.

#### Scenario: Envío antes de completar el desafío
- **WHEN** el usuario intenta enviar el formulario de login antes de que Turnstile entregue un token
- **THEN** el botón de envío está deshabilitado

### Requirement: Claves de prueba fuera de producción
Los entornos de desarrollo y prueba SHALL poder usar las claves de prueba de Cloudflare para que los tests automatizados funcionen sin intervención humana. Producción MUST usar claves reales.

#### Scenario: Test E2E del login
- **WHEN** Playwright ejecuta el flujo de login en el entorno de pruebas
- **THEN** el desafío de Turnstile se resuelve automáticamente con las claves de prueba
