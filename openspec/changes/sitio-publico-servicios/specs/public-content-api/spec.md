# Spec Delta

## Purpose

Guarda todo el contenido del sitio público en la base de datos y lo expone en endpoints públicos de solo lectura, para que luego pueda editarse desde el admin sin tocar código.

## ADDED Requirements

### Requirement: Contenido del sitio configurable
La API SHALL exponer sin autenticación la configuración del sitio (título y subtítulo del hero, número y mensaje por defecto de WhatsApp, redes sociales, horario, textos del footer, título y descripción SEO por defecto), los pasos del proceso y las preguntas frecuentes publicadas.

#### Scenario: Leer configuración del sitio
- **WHEN** se llama al endpoint público de configuración
- **THEN** responde 200 con la configuración, los pasos ordenados y las preguntas publicadas ordenadas

### Requirement: Servicios públicos
La API SHALL exponer la lista de servicios publicados en orden y el detalle de un servicio publicado por su slug, incluyendo imágenes (con texto alternativo, dimensiones y variantes), qué incluye, trabajo destacado y trabajos asociados. Un slug inexistente o de un servicio no publicado MUST responder 404.

#### Scenario: Detalle de servicio
- **WHEN** se pide el servicio `durlock`
- **THEN** la API responde 200 con su contenido completo

#### Scenario: Servicio no publicado
- **WHEN** se pide el slug de un servicio no publicado
- **THEN** la API responde 404

### Requirement: Trabajos públicos
La API SHALL exponer los trabajos realizados publicados, con su servicio, año, zona, descripción y fotos (incluyendo antes/después cuando existan).

#### Scenario: Listar trabajos
- **WHEN** se llama al endpoint público de trabajos
- **THEN** responde solo los trabajos publicados, en el orden configurado

### Requirement: Solo lectura y cacheable
Los endpoints públicos de contenido MUST aceptar solo lectura (GET) y SHALL responder con encabezados de caché de corta duración.

#### Scenario: Intento de escritura
- **WHEN** se envía un POST, PUT o DELETE a un endpoint público de contenido
- **THEN** la API responde 404 o 405 y no modifica nada

### Requirement: Entrega de imágenes
Las imágenes del contenido SHALL servirse desde una ruta pública estable (`/media/...`), guardadas en almacenamiento persistente que sobrevive a los redespliegues, con encabezados de caché de larga duración.

#### Scenario: Redespliegue
- **WHEN** se despliega una nueva versión del sitio
- **THEN** las imágenes existentes siguen disponibles en las mismas URLs

### Requirement: Contenido inicial de ejemplo
El sistema SHALL poder cargarse con contenido inicial (seed): configuración del sitio, 5 pasos de proceso, preguntas frecuentes, los 8 servicios (Durlock, Steelframe, Pintura, Colocación de piso flotante y de madera, Pulido de piso, Plomería, Electricidad, Gas) con textos en español e imágenes de muestra de licencia libre, y trabajos de ejemplo. El seed MUST NOT crear el servicio de instalación de aire. Ejecutarlo varias veces MUST NOT duplicar contenido.

#### Scenario: Seed repetido
- **WHEN** el seed de contenido se ejecuta dos veces
- **THEN** hay exactamente 8 servicios y ninguno es instalación de aire
