# service-catalog Specification

## Purpose
Presenta los servicios de TAMILA como una revista: un índice numerado con imagen rotativa, una página de capítulo por servicio en el inicio y una página propia por servicio para buscadores.

## Requirements

### Requirement: Solo servicios publicados
El sitio SHALL mostrar únicamente los servicios marcados como publicados, en el orden configurado, y MUST numerarlos consecutivamente (01, 02, …) según ese orden.

#### Scenario: Servicio no publicado
- **WHEN** un servicio existe pero no está publicado
- **THEN** no aparece en el índice, en los capítulos, en el footer ni en el sitemap, y su URL responde 404

### Requirement: Índice de servicios
El inicio SHALL mostrar un índice titulado "Contenido" con los servicios numerados en dos columnas (en una sola columna en celulares) junto a una imagen destacada.

#### Scenario: Clic en un servicio del índice
- **WHEN** el usuario hace clic en "04 Pintura"
- **THEN** la página se desplaza hasta el capítulo de Pintura

### Requirement: Imagen rotativa del índice
La imagen del índice SHALL rotar automáticamente entre las portadas de los servicios cada pocos segundos, con una transición suave, indicando a qué servicio corresponde. Al pasar el mouse o poner el foco en un servicio del índice, MUST mostrarse su imagen y la rotación MUST pausarse mientras dure la interacción. Con la preferencia de movimiento reducido, la rotación automática MUST NOT ocurrir.

#### Scenario: Rotación automática
- **WHEN** el usuario mira el índice sin interactuar
- **THEN** la imagen cambia al siguiente servicio periódicamente y se resalta el número correspondiente

#### Scenario: Hover sobre un servicio
- **WHEN** el usuario pasa el mouse sobre "07 Electricidad"
- **THEN** la imagen muestra la portada de Electricidad y deja de rotar hasta que el mouse sale del índice

#### Scenario: Movimiento reducido
- **WHEN** el usuario tiene activado reducir movimiento
- **THEN** la imagen no rota sola, pero sí cambia al elegir un servicio

### Requirement: Capítulo de servicio
El inicio SHALL mostrar, por cada servicio publicado, una "página de capítulo" de estilo editorial que incluye: número grande con trazo diagonal, nombre del servicio como título, bajada en mayúsculas, descripción, lista de "Qué incluye", al menos una foto, el trabajo destacado (si existe) con año, zona y descripción, y un botón para consultar ese servicio por WhatsApp. La disposición MUST alternar entre capítulos consecutivos y MUST reorganizarse en una sola columna en celulares, conservando el número y el título.

#### Scenario: Capítulos consecutivos
- **WHEN** se muestran los capítulos 01 y 02
- **THEN** la foto principal del 01 está de un lado y la del 02 del lado opuesto

#### Scenario: Servicio sin trabajo destacado
- **WHEN** un servicio no tiene trabajo destacado
- **THEN** el capítulo se muestra completo sin ese bloque y sin espacios vacíos

### Requirement: Página propia por servicio
Cada servicio publicado SHALL tener su página en `/servicios/<slug>`, con el contenido de su capítulo, los trabajos realizados de ese rubro y enlaces al servicio anterior y siguiente.

#### Scenario: Visitar la página de un servicio
- **WHEN** el usuario entra a `/servicios/durlock`
- **THEN** ve el capítulo de Durlock, los trabajos de Durlock y los enlaces al servicio anterior y siguiente

#### Scenario: Slug inexistente
- **WHEN** el usuario entra a `/servicios/no-existe`
- **THEN** ve la página 404 y la respuesta tiene status 404

### Requirement: Imágenes optimizadas
Las imágenes del catálogo SHALL entregarse en formatos modernos y en varios tamaños según la pantalla. Todas MUST tener texto alternativo y dimensiones declaradas para no provocar saltos de diseño. Solo las imágenes visibles en la carga inicial MUST cargarse de inmediato; el resto MUST cargarse al acercarse al área visible.

#### Scenario: Celular
- **WHEN** el sitio se abre en un celular
- **THEN** el navegador descarga la variante chica de cada imagen y no la de escritorio
