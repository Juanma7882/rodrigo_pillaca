# Spec Delta

## Purpose

Da a web y admin una identidad visual común basada en la marca TAMILA (amarillo, blanco y negro), con modo claro y oscuro elegibles por el usuario.

## ADDED Requirements

### Requirement: Paleta de marca compartida
Web y admin SHALL usar el mismo conjunto de tokens de color derivados de la marca: amarillo como color de acento, negro y blanco (con sus neutros) para fondos y textos. Ningún componente MUST definir colores de marca fuera de esos tokens.

#### Scenario: Mismo acento en ambas apps
- **WHEN** se renderiza un botón primario en web y en admin
- **THEN** ambos usan el mismo color amarillo de acento definido en los tokens

### Requirement: Contraste accesible
Todas las combinaciones de texto sobre fondo definidas por el tema MUST cumplir un contraste WCAG 2.1 AA (4.5:1 para texto normal) en ambos modos. El texto amarillo MUST NOT usarse sobre fondo blanco.

#### Scenario: Botón primario en modo claro
- **WHEN** se muestra un botón primario con fondo amarillo en modo claro
- **THEN** su texto es negro/oscuro y el contraste es de al menos 4.5:1

### Requirement: Modo claro y oscuro
Las apps SHALL ofrecer modo claro y oscuro. Si el usuario no eligió nada, el modo inicial MUST seguir la preferencia del sistema operativo. La elección manual del usuario MUST persistir entre visitas en el mismo navegador.

#### Scenario: Primera visita sin preferencia guardada
- **WHEN** un usuario con el sistema en modo oscuro entra por primera vez
- **THEN** la app se muestra en modo oscuro

#### Scenario: Elección persistida
- **WHEN** el usuario cambia a modo claro y recarga la página
- **THEN** la app se muestra en modo claro sin mostrar antes el modo oscuro

### Requirement: Interfaz en español
Todos los textos de interfaz de web y admin SHALL estar en español y el documento MUST declarar `lang="es"`.

#### Scenario: Idioma del documento
- **WHEN** se carga cualquier página de web o admin
- **THEN** el elemento raíz del documento tiene `lang="es"`
