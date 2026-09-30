# admin-auth Specification

## Purpose
Protege el panel de administración: solo los administradores registrados pueden entrar y las sesiones se manejan con JWT de corta duración y refresh token rotativo.

## Requirements

### Requirement: Sin registro público
El sistema MUST NOT exponer un registro de usuarios. Las cuentas de administrador SHALL crearse solo mediante el proceso de seed o de administración del servidor.

#### Scenario: No existe endpoint de registro
- **WHEN** un cliente intenta crear un usuario mediante la API pública
- **THEN** no existe ningún endpoint que lo permita

### Requirement: Inicio de sesión
Un administrador SHALL poder iniciar sesión con email y contraseña válidos y un token de Turnstile válido. Al tener éxito, el sistema MUST devolver un access token JWT de corta duración y establecer un refresh token en una cookie `HttpOnly`, `Secure` y `SameSite=Strict`. Las credenciales inválidas MUST devolver un error genérico que no revele si el email existe.

#### Scenario: Credenciales válidas
- **WHEN** el administrador envía email, contraseña y token de Turnstile correctos
- **THEN** recibe un access token y la cookie con el refresh token, y el panel lo redirige al inicio del admin

#### Scenario: Credenciales inválidas
- **WHEN** se envía un email inexistente o una contraseña incorrecta
- **THEN** la API responde 401 con el mismo mensaje genérico en ambos casos

### Requirement: Limitación de intentos
El endpoint de login MUST limitar los intentos fallidos por IP y responder 429 al superar el límite.

#### Scenario: Demasiados intentos
- **WHEN** una misma IP supera el límite de intentos de login en la ventana configurada
- **THEN** la API responde 429 hasta que termine la ventana

### Requirement: Renovación de sesión
El sistema SHALL emitir un nuevo access token a partir de un refresh token válido y MUST rotar el refresh token en cada uso. Reutilizar un refresh token ya rotado MUST invalidar todas las sesiones de ese administrador.

#### Scenario: Access token vencido
- **WHEN** el access token venció y el panel usa el refresh token vigente
- **THEN** recibe un nuevo access token y un nuevo refresh token, y el usuario sigue trabajando sin volver a iniciar sesión

#### Scenario: Reutilización de refresh token
- **WHEN** se presenta un refresh token que ya fue rotado
- **THEN** la API responde 401 y revoca todas las sesiones activas de ese administrador

### Requirement: Cierre de sesión
El administrador SHALL poder cerrar sesión. El sistema MUST revocar el refresh token y borrar la cookie.

#### Scenario: Logout
- **WHEN** el administrador cierra sesión
- **THEN** su refresh token queda revocado y no sirve para obtener nuevos access tokens

### Requirement: Rutas protegidas
Todas las rutas del panel admin, excepto el login, y todos los endpoints de administración de la API MUST requerir un access token válido.

#### Scenario: Acceso sin sesión al panel
- **WHEN** un usuario sin sesión abre una ruta interna del admin
- **THEN** es redirigido al login

#### Scenario: Endpoint admin sin token
- **WHEN** se llama a un endpoint de administración sin access token o con un token inválido o vencido
- **THEN** la API responde 401

### Requirement: Almacenamiento seguro de contraseñas
Las contraseñas MUST guardarse solo como hash con un algoritmo lento y resistente (argon2id) y MUST NOT aparecer nunca en respuestas ni en logs.

#### Scenario: Consulta del perfil
- **WHEN** el administrador autenticado consulta su perfil
- **THEN** la respuesta no incluye la contraseña ni su hash
