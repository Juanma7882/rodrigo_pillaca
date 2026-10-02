# admin-content-api Specification

## Purpose
Permite al administrador autenticado leer y modificar desde la API todo el contenido del sitio público (configuración, servicios, trabajos, pasos y preguntas frecuentes), para que el panel admin pueda editarlo sin tocar código ni correr el seed.

## Requirements

### Requirement: Acceso solo para administradores
Todos los endpoints de administración de contenido (bajo `/api/admin/`) MUST exigir un access token válido de administrador y MUST responder 401 sin token o con un token vencido o inválido, sin leer ni modificar datos. Estas respuestas MUST NOT ser cacheables (`Cache-Control: no-store`).

#### Scenario: Sin token
- **WHEN** se llama a cualquier endpoint de `/api/admin/` sin encabezado `Authorization`
- **THEN** la API responde 401 y el contenido no cambia

#### Scenario: Token vencido
- **WHEN** se envía un `PATCH` de la configuración con un access token vencido
- **THEN** la API responde 401 y la configuración no cambia

### Requirement: Edición de la configuración del sitio
La API SHALL permitir leer la configuración completa del sitio y actualizarla parcialmente: título y subtítulo del hero, imagen del hero, número y mensaje por defecto de WhatsApp, Instagram, Facebook, TikTok, horario, texto del footer, título y descripción SEO e imagen OG. El número de WhatsApp MUST ser vacío o solo dígitos en formato internacional (entre 8 y 15); las redes MUST ser URLs `https` o vacías (que se guardan como ausentes); las imágenes MUST referenciar imágenes existentes o ser nulas.

#### Scenario: Cambiar el número de WhatsApp
- **WHEN** el admin envía `whatsappNumber: "5491122334455"`
- **THEN** la API responde 200 con la configuración actualizada y el endpoint público devuelve el nuevo número una vez vencida su caché

#### Scenario: Número con formato inválido
- **WHEN** el admin envía `whatsappNumber: "+54 11 2233-4455"`
- **THEN** la API responde 400 indicando el campo `whatsappNumber`

#### Scenario: Imagen inexistente
- **WHEN** el admin asigna como imagen del hero un id que no existe
- **THEN** la API responde 400 indicando el campo `heroImageId`

### Requirement: Gestión de servicios
La API SHALL permitir listar todos los servicios (publicados y no publicados) en orden, ver uno por id, crearlo, editarlo parcialmente y borrarlo. Cada servicio tiene slug, nombre, bajada, resumen, descripción, lista de qué incluye, SEO opcional, estado de publicación, portada, galería de imágenes ordenada y trabajo destacado. El slug MUST ser único y en formato kebab-case en minúsculas sin acentos; un slug repetido MUST responder 409. Un servicio nuevo SHALL quedar al final del orden.

#### Scenario: Crear un servicio
- **WHEN** el admin crea el servicio `instalacion-de-aire` con sus textos y `published: false`
- **THEN** la API responde 201 con el servicio, ubicado último en el orden, y el sitio público no lo muestra

#### Scenario: Slug duplicado
- **WHEN** el admin crea un servicio con el slug `durlock`, que ya existe
- **THEN** la API responde 409 con un mensaje que indica que el slug ya está en uso

#### Scenario: Despublicar
- **WHEN** el admin edita un servicio con `published: false`
- **THEN** el servicio desaparece del sitio público y la numeración de capítulos de los restantes no deja huecos

#### Scenario: Galería ordenada
- **WHEN** el admin envía la galería de un servicio como una lista de ids de imágenes
- **THEN** la galería queda exactamente con esas imágenes y en ese orden

### Requirement: Trabajo destacado coherente
El trabajo destacado de un servicio MUST pertenecer a ese servicio. Si un trabajo se mueve a otro servicio o se borra, MUST dejar de ser el destacado del servicio anterior.

#### Scenario: Destacado de otro rubro
- **WHEN** el admin asigna como destacado de `pintura` un trabajo del servicio `durlock`
- **THEN** la API responde 400 indicando el campo `featuredProjectId`

#### Scenario: Trabajo movido de servicio
- **WHEN** el trabajo destacado de `durlock` se cambia al servicio `steelframe`
- **THEN** `durlock` queda sin trabajo destacado

### Requirement: Borrado seguro de servicios
La API MUST rechazar con 409 el borrado de un servicio que tenga trabajos asociados, indicando que primero se muevan o borren los trabajos (o que se despublique el servicio). Un servicio sin trabajos SHALL borrarse respondiendo 204; sus imágenes MUST seguir existiendo en la biblioteca.

#### Scenario: Servicio con trabajos
- **WHEN** el admin borra un servicio que tiene 2 trabajos
- **THEN** la API responde 409 y el servicio y sus trabajos siguen existiendo

### Requirement: Gestión de trabajos
La API SHALL permitir listar todos los trabajos (filtrables por servicio) en orden, ver uno, crearlo, editarlo parcialmente y borrarlo. Cada trabajo tiene título, año opcional (entre 1990 y el año siguiente al actual), zona opcional, descripción, servicio, estado de publicación, foto de antes, foto de después y galería ordenada. El servicio MUST existir.

#### Scenario: Crear trabajo con antes/después
- **WHEN** el admin crea un trabajo con `beforeImageId` y `afterImageId` de imágenes existentes
- **THEN** la API responde 201 y, si está publicado, el sitio público lo muestra con el comparador

#### Scenario: Servicio inexistente
- **WHEN** el admin crea un trabajo con un `serviceId` que no existe
- **THEN** la API responde 400 indicando el campo `serviceId`

### Requirement: Gestión de pasos y preguntas frecuentes
La API SHALL permitir listar, crear, editar y borrar los pasos de "Cómo trabajamos" (título y descripción) y las preguntas frecuentes (pregunta, respuesta y estado de publicación). Los elementos nuevos SHALL quedar al final del orden y, al borrar uno, el orden de los restantes MUST quedar consecutivo.

#### Scenario: Borrar un paso intermedio
- **WHEN** hay 5 pasos y el admin borra el tercero
- **THEN** quedan 4 pasos con orden 1, 2, 3 y 4, en el mismo orden relativo

#### Scenario: Pregunta no publicada
- **WHEN** el admin crea una pregunta con `published: false`
- **THEN** aparece en el listado del admin y no en el sitio público

### Requirement: Reordenamiento
Para servicios, trabajos, pasos y preguntas frecuentes, la API SHALL ofrecer una operación de reordenamiento que recibe la lista completa de ids en el orden deseado y la aplica de forma atómica. La lista MUST contener exactamente los ids existentes de ese recurso, sin repetidos; si no, MUST responder 400 sin cambiar el orden.

#### Scenario: Reordenar servicios
- **WHEN** el admin envía los 8 ids de servicios con `pintura` primero
- **THEN** la API responde 200, `pintura` pasa a ser el capítulo 01 en el sitio público y el resto conserva el orden enviado

#### Scenario: Lista incompleta
- **WHEN** el admin envía 7 de los 8 ids de servicios
- **THEN** la API responde 400 y el orden no cambia

### Requirement: Validación y textos
Todas las entradas MUST validarse con límites de longitud y los textos MUST guardarse sin espacios sobrantes al inicio y al final. Los campos obligatorios (por ejemplo, nombre y slug de servicio, título del trabajo, pregunta y respuesta) MUST NOT quedar vacíos. Los recursos inexistentes MUST responder 404.

#### Scenario: Nombre vacío
- **WHEN** el admin edita un servicio con `name: "   "`
- **THEN** la API responde 400 indicando el campo `name`

#### Scenario: Recurso inexistente
- **WHEN** el admin pide un trabajo con un id que no existe
- **THEN** la API responde 404
