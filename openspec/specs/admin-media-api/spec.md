# admin-media-api Specification

## Purpose
Permite al administrador autenticado subir imágenes para el sitio (que se convierten a variantes responsive AVIF/WebP con un presupuesto de peso para que carguen rápido), administrar su texto alternativo y crédito, re-optimizarlas y borrarlas sin romper el contenido que las usa.

## Requirements

### Requirement: Subida de imágenes
La API SHALL aceptar, solo de un administrador autenticado, la subida de una imagen por solicitud como `multipart/form-data`, junto con su texto alternativo (obligatorio) y crédito (opcional). Los formatos aceptados MUST ser JPEG, PNG, WebP y AVIF, verificados por el contenido del archivo y no solo por su extensión o tipo declarado. El tamaño máximo MUST ser 10 MB. La imagen SHALL guardarse como variantes AVIF y WebP de hasta 480, 960 y 1600 px de ancho, sin agrandar imágenes chicas y sin conservar metadatos EXIF (como la ubicación GPS), y la respuesta MUST incluir el id, dimensiones, rutas de las variantes, texto alternativo y crédito.

#### Scenario: Subir una foto
- **WHEN** el admin sube un JPEG de 4000×3000 con texto alternativo
- **THEN** la API responde 201 con la imagen, de 1600 px de ancho, y sus variantes son accesibles en `/media/...`

#### Scenario: Archivo que no es imagen
- **WHEN** el admin sube un PDF renombrado como `.jpg`
- **THEN** la API responde 400 indicando que el formato no es válido y no se guarda nada

#### Scenario: Archivo demasiado grande
- **WHEN** el admin sube una imagen de 15 MB
- **THEN** la API responde 413 y no se guarda nada

#### Scenario: Sin texto alternativo
- **WHEN** el admin sube una imagen sin `alt`
- **THEN** la API responde 400 indicando el campo `alt`

### Requirement: Optimización de peso
Cada variante AVIF (el formato que descargan casi todos los navegadores) MUST respetar un presupuesto de peso según su ancho: como máximo 40 KB a 480 px, 120 KB a 960 px y 250 KB a 1600 px, y MUST NOT pesar más que la WebP del mismo ancho. Para entrar en el presupuesto, la API SHALL reducir la calidad de a pasos hasta un piso de calidad mínimo. La variante WebP (respaldo para navegadores sin AVIF) SHALL usar el mismo presupuesto como objetivo y reducir su calidad de a pasos hasta su piso. Si en el piso una variante todavía supera su presupuesto, SHALL guardarse igual (prima la calidad mínima aceptable) y quedar registrada en los logs.

#### Scenario: Foto pesada
- **WHEN** el admin sube una foto con mucho detalle cuya WebP de 1600 px a la calidad inicial pesaría 576 KB
- **THEN** la AVIF de 1600 px guardada pesa 250 KB o menos y menos que la WebP, y la WebP queda con una calidad menor a la inicial

#### Scenario: Foto liviana
- **WHEN** el admin sube una foto que ya entra en el presupuesto a la calidad inicial
- **THEN** sus variantes se guardan con la calidad inicial, sin reducirla

### Requirement: Peso visible
La respuesta de la subida y cada imagen del listado de la biblioteca MUST incluir el peso en bytes de cada variante (AVIF y WebP por ancho) y el peso total de las variantes. El formato público del contenido MUST NOT cambiar.

#### Scenario: Ver el peso
- **WHEN** el admin sube una imagen
- **THEN** la respuesta indica, para cada ancho, cuántos bytes pesan la variante AVIF y la WebP

### Requirement: Re-optimización de imágenes existentes
El sistema SHALL guardar el archivo original de cada imagen subida en un almacenamiento que no es accesible públicamente, y SHALL ofrecer un comando de mantenimiento que regenera las variantes de las imágenes existentes con la configuración de optimización vigente. La re-optimización MUST conservar el id, el texto alternativo, el crédito y todos los usos de cada imagen, MUST publicar las variantes nuevas en URLs distintas de las anteriores (para no servir versiones viejas desde la caché) y MUST borrar los archivos anteriores. Las imágenes sin original disponible MUST omitirse e informarse al final, sin interrumpir el proceso.

#### Scenario: Re-optimizar la biblioteca
- **WHEN** se ejecuta el comando de re-optimización sobre una imagen ya usada como portada de `durlock`
- **THEN** la imagen conserva su id y sigue siendo la portada, sus variantes tienen URLs nuevas que respetan el presupuesto de peso y las URLs anteriores responden 404

#### Scenario: Original no disponible
- **WHEN** una imagen no tiene archivo original guardado
- **THEN** el comando la omite, sigue con las demás y la lista en el resumen final

#### Scenario: Original privado
- **WHEN** alguien pide por HTTP la ruta de un archivo original
- **THEN** no se sirve (responde 404)

### Requirement: Imágenes duplicadas
Subir un archivo idéntico a una imagen ya existente MUST NOT crear una imagen nueva ni duplicar archivos: la API SHALL devolver la imagen existente con el texto alternativo y crédito enviados.

#### Scenario: Misma foto dos veces
- **WHEN** el admin sube dos veces el mismo archivo
- **THEN** ambas respuestas tienen el mismo id y la biblioteca tiene una sola imagen

### Requirement: Biblioteca de imágenes
La API SHALL listar las imágenes de la más nueva a la más vieja, paginadas, indicando para cada una en qué contenidos se usa (hero, imagen OG, portada o galería de servicio, antes/después o galería de trabajo). SHALL permitir filtrar solo las imágenes sin uso y editar el texto alternativo y el crédito de una imagen.

#### Scenario: Ver dónde se usa una imagen
- **WHEN** el admin lista la biblioteca y una imagen es la portada de `durlock`
- **THEN** esa imagen indica su uso como portada del servicio `durlock`

#### Scenario: Corregir el texto alternativo
- **WHEN** el admin edita el `alt` de una imagen
- **THEN** el sitio público muestra el nuevo texto alternativo en todos los lugares donde aparece esa imagen

### Requirement: Borrado seguro de imágenes
La API MUST rechazar con 409 el borrado de una imagen que está en uso, indicando dónde se usa. Una imagen sin uso SHALL borrarse respondiendo 204, eliminando también sus archivos de variantes y su original del almacenamiento.

#### Scenario: Imagen en uso
- **WHEN** el admin borra la imagen del hero
- **THEN** la API responde 409, la imagen sigue existiendo y el hero no cambia

#### Scenario: Imagen sin uso
- **WHEN** el admin borra una imagen que no usa ningún contenido
- **THEN** la API responde 204 y sus archivos ya no se sirven en `/media/...`
