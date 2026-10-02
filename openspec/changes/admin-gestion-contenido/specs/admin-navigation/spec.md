# Spec Delta

## Purpose

Define cómo se recorre el panel admin, en el celular y en la compu: las secciones de edición, el inicio del panel y el acceso al sitio público.

## ADDED Requirements

### Requirement: Navegación adaptada al dispositivo
El panel admin SHALL ofrecer acceso a todas sus secciones (Inicio, Servicios, Trabajos, Imágenes, Configuración, Cómo trabajamos y Preguntas frecuentes) desde cualquier pantalla interna. En pantallas angostas SHALL mostrarse una barra fija abajo con las secciones principales y un menú "Más" con el resto. En pantallas anchas SHALL mostrarse un menú lateral con todas las secciones. La sección actual MUST quedar marcada, y la navegación MUST poder usarse con teclado y lector de pantalla.

#### Scenario: Navegar desde el celular
- **WHEN** en un celular el admin toca "Trabajos" en la barra inferior
- **THEN** se abre la lista de trabajos y "Trabajos" queda marcado como sección actual

#### Scenario: Secciones secundarias en el celular
- **WHEN** en un celular el admin toca "Más" y elige "Preguntas frecuentes"
- **THEN** el menú se cierra y se abre la pantalla de preguntas frecuentes

#### Scenario: Navegar desde la compu
- **WHEN** en una pantalla ancha el admin está en cualquier sección
- **THEN** ve el menú lateral con todas las secciones y la actual marcada

#### Scenario: Sin desplazamiento horizontal
- **WHEN** el admin usa cualquier pantalla del panel en un celular de 360 px de ancho
- **THEN** la página no se desplaza horizontalmente y los botones tienen un área táctil de al menos 44 × 44 px

### Requirement: Inicio del panel
El inicio del panel SHALL mostrar accesos a cada sección con un resumen de su contenido (cantidad de servicios publicados, trabajos publicados e imágenes sin uso) y un link "Ver el sitio" que abre el sitio público en una pestaña nueva.

#### Scenario: Resumen del contenido
- **WHEN** el admin entra al panel
- **THEN** ve cuántos servicios y trabajos están publicados y cuántas imágenes no se usan, con un acceso a cada sección

#### Scenario: Ver el sitio
- **WHEN** el admin toca "Ver el sitio"
- **THEN** el sitio público se abre en una pestaña nueva

### Requirement: Carga diferida de cada sección
Cada sección del panel SHALL descargar su código recién cuando se navega a ella, mostrando un indicador de carga mientras tanto. Las librerías que solo usa una sección (como la de arrastrar y soltar) MUST NOT descargarse en el inicio del panel.

#### Scenario: Entrar al inicio
- **WHEN** el admin inicia sesión y ve el inicio del panel
- **THEN** el navegador no descargó el código de las pantallas de edición ni la librería de arrastrar y soltar
