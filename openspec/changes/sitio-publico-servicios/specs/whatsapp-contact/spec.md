# Spec Delta

## Purpose

Convierte las visitas en consultas llevando al usuario a una conversación de WhatsApp con TAMILA, con un mensaje inicial acorde a lo que estaba mirando.

## ADDED Requirements

### Requirement: Enlaces a WhatsApp
Todos los llamados a la acción de contacto SHALL abrir una conversación de WhatsApp con el número configurado, en una pestaña nueva, con un mensaje inicial precargado. El sitio MUST NOT tener formularios de contacto.

#### Scenario: Botón del hero
- **WHEN** el usuario hace clic en el botón de WhatsApp del hero
- **THEN** se abre WhatsApp con el número configurado y el mensaje general precargado

### Requirement: Mensaje según el servicio
Los llamados dentro de un capítulo o de la página de un servicio SHALL precargar un mensaje que nombre ese servicio.

#### Scenario: Consulta desde Plomería
- **WHEN** el usuario hace clic en "Consultar" en el capítulo de Plomería
- **THEN** WhatsApp se abre con un mensaje del estilo "Hola, quiero consultar por Plomería"

### Requirement: Botón flotante
El sitio SHALL mostrar un botón flotante de WhatsApp visible en todas las páginas, que no tape contenido interactivo y tenga una etiqueta accesible.

#### Scenario: Scroll en cualquier página
- **WHEN** el usuario hace scroll por cualquier página
- **THEN** el botón flotante sigue visible en una esquina

### Requirement: Número no configurado
Si no hay número de WhatsApp configurado, los botones de WhatsApp MUST NOT mostrarse, en lugar de apuntar a un enlace roto.

#### Scenario: Sin número
- **WHEN** el número de WhatsApp está vacío en la configuración
- **THEN** no se muestra ningún botón de WhatsApp
