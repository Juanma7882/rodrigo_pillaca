# home-sections Specification

## Purpose
Define las secciones de la página de inicio que acompañan al catálogo de servicios: la portada (hero), el proceso de trabajo, los trabajos realizados y las preguntas frecuentes, con estética de revista editorial.

## Requirements

### Requirement: Hero
La página de inicio SHALL abrir con una portada que ocupa el alto de la pantalla, con el título principal centrado, un subtítulo y un botón para consultar por WhatsApp. El título y el subtítulo MUST provenir del contenido configurable.

#### Scenario: Primera carga del inicio
- **WHEN** el usuario entra al inicio
- **THEN** ve el título centrado, el subtítulo y el botón de WhatsApp sin hacer scroll

#### Scenario: Foto de fondo
- **WHEN** hay una imagen de portada configurada
- **THEN** se muestra de fondo a pantalla completa, cubierta por una capa oscura que mantiene el contraste AA del texto, y se descarga con prioridad por ser la primera imagen visible

#### Scenario: Sin foto de fondo
- **WHEN** no hay imagen de portada configurada
- **THEN** la portada se muestra sobre el fondo del tema, sin espacios vacíos

### Requirement: Cómo trabajamos
El inicio SHALL mostrar los pasos del proceso de trabajo, numerados en orden (01, 02, …), cada uno con título y descripción.

#### Scenario: Pasos ordenados
- **WHEN** el contenido tiene 5 pasos
- **THEN** la sección los muestra del 01 al 05 en el orden configurado

### Requirement: Trabajos realizados
El inicio SHALL mostrar una galería de trabajos publicados con título, servicio, año y zona. Un trabajo que tiene fotos de antes y después MUST mostrarse con un comparador deslizable, operable con mouse, táctil y teclado.

#### Scenario: Comparador antes/después
- **WHEN** el usuario arrastra el control del comparador de un trabajo
- **THEN** ve cómo cambia la proporción visible entre la foto de antes y la de después

#### Scenario: Comparador con teclado
- **WHEN** el control del comparador tiene el foco y el usuario presiona las flechas
- **THEN** el divisor se mueve en pasos

#### Scenario: Sin trabajos publicados
- **WHEN** no hay trabajos publicados
- **THEN** la sección y su enlace en la navegación no se muestran

### Requirement: Preguntas frecuentes
El inicio SHALL mostrar las preguntas frecuentes publicadas en un acordeón donde cada respuesta se expande al activar su pregunta, con teclado o mouse.

#### Scenario: Abrir una pregunta
- **WHEN** el usuario activa una pregunta
- **THEN** se muestra su respuesta y el estado expandido se anuncia a lectores de pantalla

### Requirement: Movimiento reducido
Las animaciones de entrada de las secciones SHALL desactivarse cuando el usuario tiene activada la preferencia de reducir movimiento.

#### Scenario: Preferencia de movimiento reducido
- **WHEN** el sistema del usuario pide reducir movimiento
- **THEN** las secciones aparecen sin animación
