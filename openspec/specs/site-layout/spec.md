# site-layout Specification

## Purpose
Da al sitio público una barra de navegación y un footer comunes que orientan al visitante y mantienen siempre a mano el contacto por WhatsApp.

## Requirements

### Requirement: Barra de navegación
Todas las páginas del sitio SHALL mostrar una barra de navegación con el logo (que lleva al inicio), enlaces a las secciones principales (Servicios, Cómo trabajamos, Trabajos, Preguntas), el selector de modo claro/oscuro y un botón de WhatsApp. La barra MUST quedar fija arriba y visible en todo momento, en escritorio y en celulares, superpuesta al contenido sin ocupar espacio propio en el flujo de la página.

#### Scenario: Enlace a una sección desde el inicio
- **WHEN** el usuario está en el inicio y hace clic en "Cómo trabajamos"
- **THEN** la página se desplaza hasta esa sección

#### Scenario: Enlace a una sección desde otra página
- **WHEN** el usuario está en la página de un servicio y hace clic en "Preguntas"
- **THEN** navega al inicio y queda posicionado en la sección de preguntas frecuentes

#### Scenario: Scroll largo
- **WHEN** el usuario hace scroll hacia abajo o hacia arriba en cualquier punto de la página
- **THEN** la barra de navegación sigue visible arriba

#### Scenario: La barra no desplaza el contenido
- **WHEN** se carga el inicio
- **THEN** la portada empieza detrás de la barra, sin franja reservada, y ningún texto queda tapado por ella

### Requirement: Navegación en celulares
En pantallas angostas la barra SHALL mostrar un botón de menú que abre un modal con los mismos enlaces, superpuesto a la página con un fondo oscurecido y sin desplazar el contenido. El modal MUST cerrarse al elegir un enlace, al presionar Escape o al tocar el fondo, y MUST ser operable con teclado.

#### Scenario: Menú móvil
- **WHEN** en un celular el usuario abre el menú y elige "Servicios"
- **THEN** el panel se cierra y la página se desplaza al índice de servicios

### Requirement: Footer
Todas las páginas SHALL mostrar un footer con el logo, la lista de servicios publicados (con enlaces a sus páginas), el contacto por WhatsApp, las redes sociales configuradas, el horario de atención y el año actual. Un dato de contacto o una red que no esté configurado MUST NOT mostrarse.

#### Scenario: Red social sin configurar
- **WHEN** no hay URL de Instagram configurada
- **THEN** el footer no muestra el ícono de Instagram
