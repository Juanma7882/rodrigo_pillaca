# Spec Delta

## Purpose

Hace que el sitio de TAMILA sea encontrable en búsquedas locales de servicios de construcción y que se vea bien al compartirse en redes y en WhatsApp.

## ADDED Requirements

### Requirement: Metadatos por página
Cada página SHALL tener un `<title>` y una meta descripción propios, una URL canónica y etiquetas Open Graph (título, descripción, imagen). La página de cada servicio MUST usar el nombre y la descripción de ese servicio.

#### Scenario: Compartir un servicio por WhatsApp
- **WHEN** alguien comparte el enlace `/servicios/pintura`
- **THEN** la vista previa muestra el título, la descripción y la imagen de Pintura

### Requirement: Datos estructurados
El inicio SHALL incluir datos estructurados JSON-LD de tipo negocio de construcción (`HomeAndConstructionBusiness`) con nombre, logo, teléfono y la lista de servicios publicados. Cada página de servicio MUST incluir datos estructurados de tipo `Service`.

#### Scenario: Validación de datos estructurados
- **WHEN** se analiza el HTML del inicio con un validador de schema.org
- **THEN** encuentra un `HomeAndConstructionBusiness` válido con los servicios publicados

### Requirement: Sitemap y robots
El sitio SHALL publicar `/sitemap.xml` con el inicio y las páginas de los servicios publicados, y `/robots.txt` que permite indexar el sitio público e indica la ubicación del sitemap.

#### Scenario: Servicio nuevo publicado
- **WHEN** un servicio pasa a estar publicado
- **THEN** aparece en `/sitemap.xml` sin necesidad de volver a desplegar
