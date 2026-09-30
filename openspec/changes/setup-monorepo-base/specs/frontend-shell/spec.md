# Spec Delta

## Purpose

Define el comportamiento base de navegación de web y admin: carga diferida del código por ruta y por componente pesado, estados de carga y manejo de rutas inexistentes.

## ADDED Requirements

### Requirement: Carga diferida por ruta
Cada ruta de web y admin SHALL descargar su código solo cuando el usuario navega hacia ella. La carga inicial MUST NOT incluir el código de rutas no visitadas.

#### Scenario: Ruta no visitada
- **WHEN** el usuario carga la página de inicio
- **THEN** el navegador no descargó el bundle de otras rutas

#### Scenario: Navegación a otra ruta
- **WHEN** el usuario navega a una ruta nueva
- **THEN** su bundle se descarga en ese momento y se muestra un indicador de carga hasta que esté listo

### Requirement: Carga diferida de componentes pesados
Los componentes pesados que no son necesarios en el primer render (por ejemplo, galerías, editores o modales) SHALL cargarse bajo demanda, mostrando un estado de carga mientras tanto.

#### Scenario: Modal diferido
- **WHEN** el usuario abre un componente marcado como diferido
- **THEN** su código se descarga en ese momento y se muestra un estado de carga hasta que se renderiza

### Requirement: Página no encontrada
Una URL que no corresponde a ninguna ruta SHALL mostrar una página 404 en español con un enlace para volver al inicio.

#### Scenario: URL inexistente
- **WHEN** el usuario visita una ruta que no existe
- **THEN** ve la página 404 con un enlace al inicio

### Requirement: Error de carga recuperable
Si falla la descarga del código de una ruta o componente, la app SHALL mostrar un mensaje de error con opción de reintentar en lugar de una pantalla en blanco.

#### Scenario: Falla de red al cargar una ruta
- **WHEN** la descarga del bundle de una ruta falla
- **THEN** el usuario ve un mensaje de error y un botón para reintentar

### Requirement: Sitio público renderizado en el servidor
Cada página del sitio público SHALL entregarse con su contenido ya renderizado en el HTML de la respuesta, con título y meta descripción propios, para que los buscadores la indexen sin ejecutar JavaScript. Después de la carga, la navegación entre páginas MUST ser del lado del cliente.

#### Scenario: Buscador sin JavaScript
- **WHEN** un cliente sin JavaScript solicita una página del sitio público
- **THEN** el HTML de la respuesta contiene los textos principales de la página y su `<title>` y `<meta name="description">`

#### Scenario: Ruta inexistente en el servidor
- **WHEN** se solicita al servidor una URL del sitio público que no existe
- **THEN** la respuesta tiene status HTTP 404 y muestra la página 404
