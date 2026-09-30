/**
 * Contenido inicial del sitio (primera versión de los textos). Se edita después desde el admin.
 * Las imágenes están en prisma/seed-media (ver CREDITS.md).
 */

export type SeedImage = { file: string; alt: string };

export type SeedService = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  description: string;
  includes: string[];
  images: SeedImage[];
};

export const siteDefaults = {
  heroTitle: 'Construimos, renovamos, terminamos.',
  heroSubtitle:
    'Construcción en seco, pintura, pisos e instalaciones. Un solo equipo para toda tu obra, de la primera visita al último detalle.',
  whatsappDefaultMessage: 'Hola, quiero hacer una consulta sobre una obra.',
  footerText:
    'Construcción en seco, terminaciones e instalaciones para casas, departamentos y locales.',
  seoTitle: 'TAMILA · Construcción y reformas',
  seoDescription:
    'Durlock, steelframe, pintura, pisos flotantes y de madera, pulido, plomería, electricidad y gas. Pedí tu presupuesto sin cargo por WhatsApp.',
  ogImageFile: 'steelframe-1.jpg',
  heroImage: { file: 'hero-casa.jpg', alt: 'Casa moderna de dos plantas con grandes ventanales' },
};

export const processSteps = [
  {
    title: 'Contacto',
    description:
      'Nos escribís por WhatsApp contándonos qué necesitás. Si podés, mandanos fotos: nos ayudan a entender la obra desde el primer mensaje.',
  },
  {
    title: 'Visita y medición',
    description:
      'Coordinamos una visita para ver el lugar, tomar medidas y conversar sobre materiales, tiempos y terminaciones.',
  },
  {
    title: 'Presupuesto',
    description:
      'Te enviamos un presupuesto detallado y sin cargo, con los trabajos, los materiales y los plazos por escrito.',
  },
  {
    title: 'Ejecución',
    description:
      'Trabajamos según el cronograma acordado, cuidando tu casa y manteniéndote al tanto del avance.',
  },
  {
    title: 'Entrega y limpieza',
    description:
      'Revisamos cada detalle con vos, dejamos todo limpio y te entregamos la obra lista para usar.',
  },
];

export const faqs = [
  {
    question: '¿El presupuesto tiene costo?',
    answer: 'No. La visita y el presupuesto son sin cargo dentro de nuestra zona de trabajo.',
  },
  {
    question: '¿Los trabajos tienen garantía?',
    answer:
      'Sí. Los trabajos tienen garantía por escrito sobre la mano de obra. El plazo depende del tipo de trabajo y figura en el presupuesto.',
  },
  {
    question: '¿Quién compra los materiales?',
    answer:
      'Como prefieras: podemos incluir los materiales en el presupuesto o trabajar con los que compres vos, asesorándote sobre qué conviene.',
  },
  {
    question: '¿Cuánto tarda una obra?',
    answer:
      'Depende del trabajo: pintar un ambiente puede llevar un par de días y una reforma completa, algunas semanas. En el presupuesto te indicamos el plazo estimado.',
  },
  {
    question: '¿Las instalaciones de gas las hace un gasista matriculado?',
    answer:
      'Sí. Las instalaciones de gas las realiza un gasista matriculado, con la documentación necesaria para presentar ante la distribuidora.',
  },
  {
    question: '¿Cómo se paga?',
    answer:
      'Trabajamos con un anticipo al inicio y el saldo según el avance de la obra. Aceptamos efectivo y transferencia.',
  },
];

export const services: SeedService[] = [
  {
    slug: 'durlock',
    name: 'Durlock',
    tagline: 'Tabiques, cielorrasos y revestimientos',
    summary:
      'Construcción en seco rápida, limpia y sin escombros para dividir ambientes, bajar techos o renovar paredes.',
    description:
      'Con placas de yeso sobre estructura metálica armamos tabiques, cielorrasos y revestimientos en mucho menos tiempo que con la construcción tradicional. Es la solución ideal para dividir un ambiente, esconder instalaciones o darle una terminación prolija a paredes y techos, con aislación térmica y acústica según lo que necesites.',
    includes: [
      'Tabiques divisorios',
      'Cielorrasos suspendidos y armados',
      'Revestimientos de paredes',
      'Placas resistentes a la humedad y al fuego',
      'Aislación térmica y acústica',
      'Masillado y terminación lista para pintar',
    ],
    images: [
      {
        file: 'durlock-1.jpg',
        alt: 'Operario colocando placas de yeso en una obra de construcción en seco',
      },
      {
        file: 'durlock-2.jpg',
        alt: 'Ambiente con cielorraso y paredes de placas de yeso terminadas',
      },
      { file: 'durlock-3.jpg', alt: 'Terminación de un cielorraso con masilla' },
    ],
  },
  {
    slug: 'steelframe',
    name: 'Steelframe',
    tagline: 'Construcción en seco con estructura de acero',
    summary:
      'Ampliaciones, viviendas y quinchos con perfiles de acero galvanizado: obra rápida, liviana y eficiente.',
    description:
      'El steelframe es un sistema constructivo con perfiles de acero galvanizado que permite levantar ampliaciones, viviendas completas, quinchos o locales en plazos cortos. Es liviano, muy resistente y admite todo tipo de terminaciones, con un excelente rendimiento térmico.',
    includes: [
      'Ampliaciones y segundos pisos',
      'Viviendas y quinchos',
      'Estructura de perfiles galvanizados',
      'Aislaciones térmicas e hidrófugas',
      'Cerramientos exteriores e interiores',
    ],
    images: [
      { file: 'steelframe-1.jpg', alt: 'Estructura de steelframe de una vivienda en construcción' },
      {
        file: 'steelframe-2.jpg',
        alt: 'Tabiques con perfiles de acero galvanizado antes de emplacar',
      },
      {
        file: 'steelframe-3.jpg',
        alt: 'Edificio en construcción con estructura de perfiles de acero',
      },
    ],
  },
  {
    slug: 'pintura',
    name: 'Pintura',
    tagline: 'Interior y exterior, con terminaciones prolijas',
    summary:
      'Pintura de interiores, frentes y aberturas con preparación de superficies y materiales de primera.',
    description:
      'Una buena pintura empieza por la preparación: reparamos fisuras, lijamos, sellamos y recién entonces pintamos. Trabajamos interiores, frentes, medianeras y aberturas, protegiendo muebles y pisos, y dejando todo limpio al terminar.',
    includes: [
      'Interiores y cielorrasos',
      'Frentes y medianeras',
      'Reparación de fisuras y enduido',
      'Esmalte en rejas, puertas y aberturas',
      'Protección de muebles y limpieza final',
    ],
    images: [
      { file: 'pintura-1.jpg', alt: 'Pintor trabajando sobre una escalera en una pared exterior' },
      { file: 'pintura-2.jpg', alt: 'Rodillo aplicando pintura roja sobre una pared de ladrillo' },
      { file: 'pintura-3.jpg', alt: 'Pintor aplicando pintura blanca con rodillo en un interior' },
    ],
  },
  {
    slug: 'pisos-flotantes-y-madera',
    name: 'Pisos flotantes y de madera',
    tagline: 'Calidez y terminación impecable',
    summary:
      'Colocación de pisos flotantes, vinílicos y de madera maciza, con nivelación y zócalos incluidos.',
    description:
      'Colocamos pisos flotantes, vinílicos y de madera sobre la superficie existente o sobre carpeta nueva. Nivelamos, colocamos la base aislante y terminamos con zócalos y umbrales para que el resultado sea parejo y duradero.',
    includes: [
      'Piso flotante y vinílico',
      'Piso de madera maciza y parquet',
      'Nivelación de contrapisos',
      'Base aislante y barrera de humedad',
      'Zócalos, umbrales y terminaciones',
    ],
    images: [
      { file: 'pisos-flotantes-y-madera-1.jpg', alt: 'Piso de madera colocado en espina de pez' },
      { file: 'pisos-flotantes-y-madera-2.jpg', alt: 'Tablas de madera maciza' },
      { file: 'pisos-flotantes-y-madera-3.jpg', alt: 'Parquet de roble con diseño en damero' },
    ],
  },
  {
    slug: 'pulido-de-pisos',
    name: 'Pulido de pisos',
    tagline: 'Tus pisos de madera, como nuevos',
    summary: 'Pulido, plastificado e hidrolaqueado de pisos de madera y parquet.',
    description:
      'Recuperamos pisos de madera y parquet gastados: pulimos hasta la madera sana, reparamos tablas sueltas y aplicamos plastificado o hidrolaca según el uso del ambiente. Trabajamos con máquinas con aspiración para reducir el polvo.',
    includes: [
      'Pulido de parquet y madera maciza',
      'Reparación y reposición de tablas',
      'Plastificado',
      'Hidrolaqueado',
      'Encerado y mantenimiento',
    ],
    images: [
      { file: 'pulido-de-pisos-1.jpg', alt: 'Máquina pulidora sobre un piso de madera' },
      {
        file: 'pulido-de-pisos-2.jpg',
        alt: 'Ambiente vacío con piso de madera pulido y plastificado',
      },
      { file: 'pulido-de-pisos-3.jpg', alt: 'Parquet con diseño geométrico recién pulido' },
    ],
  },
  {
    slug: 'plomeria',
    name: 'Plomería',
    tagline: 'Agua y desagües sin sorpresas',
    summary:
      'Instalaciones y reparaciones de agua fría y caliente, desagües y artefactos sanitarios.',
    description:
      'Hacemos instalaciones nuevas y reparaciones en baños, cocinas y lavaderos: cañerías de agua fría y caliente, desagües, colocación de artefactos y detección de pérdidas. Trabajamos con materiales de primera marca para evitar problemas a futuro.',
    includes: [
      'Instalaciones de agua fría y caliente',
      'Desagües cloacales y pluviales',
      'Colocación de sanitarios y griferías',
      'Detección y reparación de pérdidas',
      'Termotanques y bombas',
    ],
    images: [
      { file: 'plomeria-1.jpg', alt: 'Baño con bacha y grifería nuevas' },
      { file: 'plomeria-2.jpg', alt: 'Caños de cobre de una instalación de agua' },
      { file: 'plomeria-3.jpg', alt: 'Sala de máquinas con termotanque y cañerías de cobre' },
    ],
  },
  {
    slug: 'electricidad',
    name: 'Electricidad',
    tagline: 'Instalaciones seguras y a norma',
    summary: 'Instalaciones eléctricas nuevas, recableado, tableros y puesta a tierra.',
    description:
      'Hacemos instalaciones eléctricas domiciliarias y comerciales siguiendo la reglamentación vigente: tableros con protecciones, puesta a tierra, recableado de instalaciones antiguas e iluminación.',
    includes: [
      'Instalaciones nuevas y recableado',
      'Tableros con disyuntor y térmicas',
      'Puesta a tierra',
      'Iluminación interior y exterior',
      'Tomas, llaves y circuitos especiales',
    ],
    images: [
      { file: 'electricidad-1.jpg', alt: 'Conexión de cables en una caja de tomacorriente' },
      { file: 'electricidad-2.jpg', alt: 'Electricista trabajando en un medidor de electricidad' },
      { file: 'electricidad-3.jpg', alt: 'Electricista instalando un tablero eléctrico' },
    ],
  },
  {
    slug: 'gas',
    name: 'Gas',
    tagline: 'Instalaciones con gasista matriculado',
    summary: 'Instalaciones, reparaciones y conexión de artefactos de gas con gasista matriculado.',
    description:
      'Realizamos instalaciones de gas nuevas, ampliaciones y reparaciones, conexión de artefactos y pruebas de hermeticidad. Los trabajos los hace un gasista matriculado, con la documentación necesaria para presentar ante la distribuidora.',
    includes: [
      'Instalaciones nuevas y ampliaciones',
      'Conexión de cocinas, calefones y calefactores',
      'Detección y reparación de pérdidas',
      'Pruebas de hermeticidad',
      'Documentación para la distribuidora',
    ],
    images: [
      { file: 'gas-1.jpg', alt: 'Quemador de cocina encendido con llama azul' },
      { file: 'gas-2.jpg', alt: 'Medidores de gas conectados a la instalación' },
      { file: 'gas-3.jpg', alt: 'Instalador trabajando en una cañería' },
    ],
  },
];

/**
 * Trabajos de ejemplo: solo se cargan con SEED_SAMPLE_PROJECTS=true (nunca en producción),
 * para no presentar como reales trabajos que no lo son.
 */
export const sampleProjects = [
  {
    title: 'Oficina en Palermo',
    year: 2025,
    location: 'Palermo, CABA',
    serviceSlug: 'durlock',
    description:
      'Tabiques divisorios y cielorraso suspendido con aislación acústica para una oficina de 120 m².',
    beforeFile: null,
    afterFile: null,
    imageFiles: ['durlock-1.jpg', 'durlock-2.jpg'],
    featured: true,
  },
  {
    title: 'Ampliación en Pilar',
    year: 2024,
    location: 'Pilar, Buenos Aires',
    serviceSlug: 'steelframe',
    description:
      'Ampliación de 40 m² en steelframe con aislación térmica y terminación en durlock.',
    beforeFile: 'steelframe-2.jpg',
    afterFile: 'durlock-2.jpg',
    imageFiles: [],
    featured: true,
  },
  {
    title: 'Living en Belgrano',
    year: 2025,
    location: 'Belgrano, CABA',
    serviceSlug: 'pulido-de-pisos',
    description: 'Pulido y plastificado de 60 m² de parquet de roble con reposición de tablas.',
    beforeFile: 'pulido-de-pisos-1.jpg',
    afterFile: 'pulido-de-pisos-2.jpg',
    imageFiles: [],
    featured: true,
  },
  {
    title: 'Departamento en Caballito',
    year: 2024,
    location: 'Caballito, CABA',
    serviceSlug: 'pintura',
    description:
      'Pintura completa de un departamento de tres ambientes, con reparación de fisuras.',
    beforeFile: null,
    afterFile: null,
    imageFiles: ['pintura-3.jpg'],
    featured: false,
  },
];
