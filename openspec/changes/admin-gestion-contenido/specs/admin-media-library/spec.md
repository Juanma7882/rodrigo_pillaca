# Spec Delta

## Purpose

Permite al administrador subir y administrar las fotos del sitio desde el celular o la compu, y elegirlas desde cualquier formulario del panel, sin herramientas externas.

## ADDED Requirements

### Requirement: Subir fotos
El panel SHALL permitir subir una o varias fotos a la vez eligiéndolas de la galería o tomándolas con la cámara del celular, o arrastrándolas en la compu, con un texto alternativo para cada una. Las fotos MUST subirse enteras, sin recorte. Si una foto mide más de 3200 px de lado o pesa más de 8 MB, el panel SHALL achicarla en el navegador (manteniendo su proporción) antes de subirla. Durante la subida SHALL mostrarse el progreso de cada foto, y una foto que falla MUST poder reintentarse sin volver a elegirla.

#### Scenario: Subir desde el celular
- **WHEN** el admin elige tres fotos de la galería del celular y escribe su texto alternativo
- **THEN** ve el progreso de cada una y, al terminar, las tres aparecen al principio de la biblioteca

#### Scenario: Foto enorme
- **WHEN** el admin elige una foto de 6000 × 4000 px y 14 MB
- **THEN** el panel la achica a 3200 px de ancho antes de subirla y se sube sin error de tamaño

#### Scenario: Formato no admitido
- **WHEN** el admin elige un archivo que no es JPEG, PNG, WebP ni AVIF
- **THEN** ve un mensaje que explica los formatos aceptados y cómo exportar una foto HEIC como JPEG

#### Scenario: Falla de red
- **WHEN** se corta la conexión mientras se sube una foto
- **THEN** esa foto queda marcada con error y un botón para reintentar, y las demás no se pierden

### Requirement: Biblioteca de imágenes
El panel SHALL mostrar las imágenes en una grilla de la más nueva a la más vieja, con carga de más imágenes al llegar al final, un filtro para ver solo las que no se usan, y para cada una su miniatura, peso total y dónde se usa. SHALL permitir editar el texto alternativo y el crédito, y borrar una imagen.

#### Scenario: Ver dónde se usa
- **WHEN** el admin abre una imagen que es la portada de Durlock
- **THEN** ve "Portada de Durlock" con un acceso a ese servicio

#### Scenario: Borrar una imagen en uso
- **WHEN** el admin intenta borrar la foto del hero
- **THEN** el panel no la borra, muestra dónde se usa y explica que primero hay que reemplazarla

#### Scenario: Limpiar imágenes sin uso
- **WHEN** el admin filtra "Sin usar", elige una imagen y confirma el borrado
- **THEN** la imagen desaparece de la biblioteca

### Requirement: Selector de imágenes en los formularios
Los campos de imagen de los formularios (foto del hero, imagen para redes, portada, galerías y fotos de antes y después) SHALL abrir un selector que permite elegir una imagen de la biblioteca o subir una nueva sin salir del formulario ni perder lo cargado. Las galerías SHALL permitir elegir varias imágenes, quitar una y ordenarlas arrastrando. Un campo de imagen opcional MUST poder vaciarse.

#### Scenario: Subir la portada sin salir del formulario
- **WHEN** el admin edita un servicio, abre el selector de portada, sube una foto nueva y la elige
- **THEN** la foto queda como portada en el formulario y el resto de los cambios sin guardar se conserva

#### Scenario: Ordenar la galería
- **WHEN** el admin arrastra la tercera foto de la galería de un servicio al primer lugar y guarda
- **THEN** la galería se guarda en ese orden
