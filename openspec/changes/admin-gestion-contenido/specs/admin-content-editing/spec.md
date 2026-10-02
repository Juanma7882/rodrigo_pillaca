# Spec Delta

## Purpose

Permite al administrador editar desde el panel todo el contenido del sitio público (configuración, servicios, trabajos, pasos y preguntas frecuentes), con validación clara, orden por arrastre y protección contra pérdidas de cambios o borrados accidentales.

## ADDED Requirements

### Requirement: Edición de la configuración del sitio
El panel SHALL permitir editar los textos y la foto del hero, el número y el mensaje de WhatsApp, las redes sociales, el horario, el texto del footer, el título y la descripción SEO y la imagen para redes. El campo de WhatsApp SHALL explicar el formato esperado (internacional, solo números) con un ejemplo.

#### Scenario: Guardar el WhatsApp
- **WHEN** el admin escribe `5491122334455` en WhatsApp y guarda
- **THEN** ve un mensaje de éxito que avisa que el sitio se actualiza en hasta un minuto

#### Scenario: Formato inválido
- **WHEN** el admin escribe `+54 11 2233-4455` y guarda
- **THEN** el campo muestra el error junto a él, no se envía nada y el foco va al primer campo con error

### Requirement: Gestión de servicios
El panel SHALL listar todos los servicios en orden, mostrando nombre, número de capítulo (si está publicado), estado de publicación, portada y cantidad de trabajos. SHALL permitir crear un servicio, editar sus textos, la lista "qué incluye" (agregar, quitar y reordenar ítems), el SEO, la portada, la galería y el trabajo destacado (elegido entre los trabajos de ese servicio), publicarlo o despublicarlo, y borrarlo. Al crear un servicio, el slug SHALL sugerirse a partir del nombre, sin acentos ni espacios, y poder editarse.

#### Scenario: Crear un servicio
- **WHEN** el admin crea el servicio "Instalación de aire" sin publicarlo
- **THEN** el slug sugerido es `instalacion-de-aire`, el servicio aparece último en la lista marcado como no publicado y no se ve en el sitio

#### Scenario: Cambiar el slug de un servicio existente
- **WHEN** el admin edita el slug de un servicio ya publicado
- **THEN** el panel le advierte que la dirección vieja de esa página deja de funcionar antes de guardar

#### Scenario: Slug repetido
- **WHEN** el admin guarda un servicio con un slug que ya usa otro
- **THEN** el campo slug muestra el mensaje de la API y el resto de lo cargado se conserva

### Requirement: Gestión de trabajos
El panel SHALL listar todos los trabajos en orden, filtrables por servicio, mostrando título, servicio, año, estado de publicación y una miniatura. SHALL permitir crear un trabajo, editar sus datos, el servicio, las fotos de antes y después y la galería, publicarlo o despublicarlo, y borrarlo.

#### Scenario: Cargar un trabajo con antes y después
- **WHEN** el admin crea un trabajo publicado, elige el servicio y sube la foto de antes y la de después
- **THEN** el trabajo aparece en la lista como publicado y en el sitio con el comparador antes/después

#### Scenario: Filtrar por servicio
- **WHEN** el admin filtra la lista por "Durlock"
- **THEN** solo ve los trabajos de Durlock

### Requirement: Pasos y preguntas frecuentes
El panel SHALL permitir editar en la misma lista los pasos de "Cómo trabajamos" (título y descripción) y las preguntas frecuentes (pregunta, respuesta y publicación), agregar uno nuevo al final y borrar uno existente.

#### Scenario: Agregar una pregunta
- **WHEN** el admin agrega la pregunta "¿Trabajan los sábados?" con su respuesta
- **THEN** aparece última en la lista y en el sitio, si está publicada

### Requirement: Reordenar arrastrando
En las listas de servicios, trabajos, pasos y preguntas, el panel SHALL permitir cambiar el orden arrastrando cada elemento desde un asa visible, con el dedo, el mouse o el teclado (tomar con Espacio, mover con las flechas y soltar con Espacio). El arrastre MUST NOT impedir desplazar la lista con el dedo. El nuevo orden SHALL guardarse automáticamente al soltar; si el guardado falla, la lista MUST volver al orden anterior y mostrar el error.

#### Scenario: Reordenar con el dedo
- **WHEN** en un celular el admin arrastra "Pintura" desde su asa hasta el primer lugar
- **THEN** la lista queda con "Pintura" primero, el cambio se guarda solo y "Pintura" pasa a ser el capítulo 01 en el sitio

#### Scenario: Reordenar con el teclado
- **WHEN** el admin enfoca el asa de un paso, presiona Espacio, baja dos lugares con la flecha y presiona Espacio
- **THEN** el paso queda dos lugares más abajo y un lector de pantalla anuncia la nueva posición

#### Scenario: Falla al guardar el orden
- **WHEN** la API rechaza el nuevo orden
- **THEN** la lista vuelve al orden anterior y el admin ve un mensaje de error

### Requirement: Publicar y despublicar
Servicios, trabajos y preguntas frecuentes SHALL poder publicarse o despublicarse con un interruptor visible en su formulario y en la lista, sin borrarlos.

#### Scenario: Ocultar un servicio
- **WHEN** el admin despublica "Gas" desde la lista
- **THEN** "Gas" queda marcado como no publicado y deja de verse en el sitio, sin perder su contenido

### Requirement: Borrado con confirmación
Antes de borrar un servicio, trabajo, paso o pregunta, el panel MUST pedir confirmación indicando qué se borra. Si la API rechaza el borrado (por ejemplo, un servicio con trabajos), el panel SHALL mostrar el motivo y ofrecer despublicar como alternativa cuando corresponda.

#### Scenario: Borrar un servicio con trabajos
- **WHEN** el admin confirma el borrado de un servicio que tiene trabajos
- **THEN** ve el mensaje de la API y la opción de despublicarlo en lugar de borrarlo

### Requirement: Cambios sin guardar
Si un formulario tiene cambios sin guardar y el admin intenta salir de la pantalla (navegando dentro del panel, recargando o cerrando la pestaña), el panel MUST pedir confirmación antes de descartarlos.

#### Scenario: Salir con cambios
- **WHEN** el admin modifica la descripción de un servicio y toca "Trabajos" sin guardar
- **THEN** el panel le pregunta si quiere descartar los cambios y, si cancela, sigue en el formulario con lo que había escrito

### Requirement: Validación y errores
Los formularios SHALL validar con las mismas reglas que la API antes de enviar, mostrando cada error junto a su campo. Los errores de validación que devuelve la API SHALL mostrarse en el campo correspondiente, y los demás errores (red, sesión vencida, conflicto) en un mensaje visible. Mientras se guarda, el botón de guardar MUST quedar deshabilitado e indicar que está guardando. En el celular, la acción de guardar SHALL quedar siempre a mano al pie de la pantalla.

#### Scenario: Sin conexión
- **WHEN** el admin guarda sin conexión a internet
- **THEN** ve un mensaje que explica que no se pudo conectar y lo que escribió se conserva

#### Scenario: Doble envío
- **WHEN** el admin toca "Guardar" dos veces seguidas
- **THEN** se envía una sola solicitud
