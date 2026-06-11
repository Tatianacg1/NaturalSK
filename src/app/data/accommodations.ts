export interface Accommodation {
  name: string;
  type: string;
  image: string;    // primera foto (compatibilidad)
  images: string[]; // carrusel completo — añade más fotos aquí
  description: string;
  features: string[];
  badge: string;
}

// ─── FOTOS ────────────────────────────────────────────────────────────────────
// Ruta: public/images/
// Convención: <nombre><número>.jpeg  →  perla1.jpeg, perla2.jpeg, perla3.jpeg …
// Agrega las fotos al array "images" de cada alojamiento.
// ─────────────────────────────────────────────────────────────────────────────

export const accommodations: Accommodation[] = [
  {
    name: "Glamping Perla",
    type: "Glamping",
    image: "/images/perla1.jpeg",
    images: [
      "/images/perla1.jpeg",
      "/images/perla2.jpeg",
      "/images/perla3.jpeg",
      "/images/perla4.jpeg",
      "/images/perla5.jpeg",
      "/images/perla6.jpeg",
      "/images/perla7.jpeg",
    ],
    description:
      "Un refugio romántico diseñado para desconectarte de la rutina y disfrutar de la naturaleza con total privacidad. Cuenta con jacuzzi privado ilimitado, malla catamarán, cama exterior tipo playera, cama King y acceso a piscina climatizada y termales. Incluye desayuno, wifi, amenities y parqueadero privado.",
    features: ["Cama king size", "Baño privado con agua caliente", "Jacuzzi privado", "Desayuno incluido", "Parqueadero privado","Chimenea interna", "Amenities de lujo","Minibar (No incluye bebidas ni mecato)","Malla catamaran","Toallas","Ingreso a piscina climatizada y termales artificiales","Cama exterior tipo playera"],
    badge: "Discreto",
  },
  {
    name: "Glamping Esmeralda",
    type: "Glamping",
    image: "/images/esmeralda1.jpeg",
    images: [
      "/images/esmeralda1.jpeg",
      "/images/esmeralda2.jpeg",
      "/images/esmeralda3.jpeg",
      "/images/esmeralda4.jpeg",
      "/images/esmeralda5.jpeg",
      "/images/esmeralda6.jpeg",
      "/images/esmeralda7.jpeg",
      "/images/esmeralda8.jpeg",
      "/images/esmeralda9.jpeg",
    ],
    description:
      "Un espacio exclusivo para vivir una experiencia de descanso y conexión con la naturaleza. Disfruta de jacuzzi privado ilimitado, ducha al aire libre, malla catamarán XXL, cama exterior tipo playera y una acogedora cama King. Incluye desayuno, wifi, amenities, parqueadero privado y acceso a piscina climatizada y termales artificiales.",
    features: ["Parqueadero privado","Baño privado con agua caliente" ,"Amenities de lujo","Minibar (No incluye bebidas ni mecato)","Chimenea","Toallas","Wifi","Cama exterior tipo playera","Jacuzzi privado", "Desayuno incluido","Ingreso a piscina climatizada y termales artificiales","Malla catamaran XXL", "Cama King",],
    badge: "Exclusivo",
  },
  {
    name: "Glamping Diamante",
    type: "Glamping",
    image: "/images/diamante1.jpeg",
    images: [
      "/images/diamante1.jpeg",
      "/images/diamante2.jpeg",
      "/images/diamante3.jpeg",
      "/images/diamante4.jpeg",
      "/images/diamante5.jpeg",
      "/images/diamante6.jpeg",
      "/images/diamante7.jpeg",
      
    ],
    description:
      "Plataforma elevada entre las copas de los árboles. La experiencia más inmersiva de Natural Sound, con ventanales de piso a techo y ducha exterior bajo las estrellas.",
    features: ["Parqueadero privado","Baño privado con agua caliente" ,"Amenities de lujo","Minibar (No incluye bebidas ni mecato)","Chimenea interna","Toallas","Wifi","Cama exterior tipo playera","Jacuzzi privado", "Desayuno incluido","Ingreso a piscina climatizada y termales artificiales","Malla catamaran XXL", "Cama King","Turco privado",],
    badge: "Mas pedido",
  },
  {
    name: "Glamping Zafiro",
    type: "Glamping",
    image: "/images/zafiro1.jpeg",
    images: [
      "/images/zafiro1.jpeg",
      "/images/zafiro2.jpeg",
      "/images/zafiro3.jpeg",
      "/images/zafiro4.jpeg",
      "/images/zafiro5.jpeg",
      "/images/zafiro6.jpeg",
      "/images/zafiro7.jpeg",
      "/images/zafiro8.jpeg",
      "/images/zafiro9.jpeg",
      "/images/zafiro10.jpeg",
      "/images/zafiro11.jpeg",
      "/images/zafiro12.jpeg",
    ],
    description:
      "El espacio ideal para compartir momentos inolvidables en pareja, familia o con amigos. Con capacidad hasta para 6 personas.",
    features: ["Parqueadero privado","Baño privado con agua caliente" ,"Amenities de lujo","Minibar (No incluye bebidas ni mecato)","Chimenea interna","Toallas","Wifi","Cama exterior tipo playera","Jacuzzi privado", "Desayuno incluido","Ingreso a piscina climatizada y termales artificiales","Malla catamaran XXL", "Cama King, Cama 1.40, Cama tarima 1.20 ",],
    badge: "Comodidad",
  },
  {
    name: "Glamping Turquesa",
    type: "Glamping",
    image: "/images/turquesa1.JPEG",
    images: [
      "/images/turquesa1.JPEG",
      "/images/turquesa2.JPEG",
      "/images/turquesa3.JPEG",
      "/images/turquesa4.JPEG",
      "/images/turquesa5.JPEG",
      "/images/turquesa6.JPEG",
    ],
    description:
      "Una experiencia única entre la naturaleza con vistas al río. Disfruta de jacuzzi privado ilimitado, cama King, chimenea interior y una terraza privada con vistas inmejorables. Incluye desayuno, wifi, amenities y parqueadero privado.",
    features: ["Jacuzzi privado", "Cama King", "Desayuno incluido", "Chimenea","Amenities de lujo","Minibar (No incluye bebidas ni mecato)","Toallas","Wifi","Parqueadero privado","Ingreso a piscina climatizada y termales artificiales", "Cama exterior tipo playera",],
    badge: "Vista al río",
  },
  {
    name: "Habitacion Pareja",
    type: "Habitación",
    image: "/images/habitacionp1.jpeg",
    images: [
      "/images/habitacionp1.jpeg",
      "/images/habitacionp2.jpeg",
      "/images/habitacionp3.jpeg",
      "/images/habitacionp4.jpeg",
      "/images/habitacionp5.jpeg",

    ],
    description:
      "Una acogedora habitación diseñada para disfrutar de una escapada tranquila en pareja. Cuenta con balcón privado con vista, TV, wifi y desayuno incluido, combinando comodidad y descanso en un entorno natural. Además, tendrás acceso a piscina climatizada, termales artificiales, bar y restaurante para complementar una experiencia de relajación y bienestar.",
    features: [
      "Balcón privado con vista panorámica",
      "Desayuno incluido para 2 personas",
      "Servicio de bar y restaurante",
      "Acceso a piscina climatizada y termales artificiales",
      "TV",
      "Wifi",
      "Parqueadero privado",
      "Servicio de bar y restaurante",
    ],
    badge: "Escapada Romántica",
  },
  {
    name: "Habitacion Cuadruple",
    type: "Habitación",
    image: "/images/habitacionc1.jpeg",
    images: [
      "/images/habitacionc1.jpeg",
      "/images/habitacionc2.jpeg",
      "/images/habitacionc3.jpeg",
      "/images/habitacionc4.jpeg",
    ],
    description:
      "La opción perfecta para compartir en familia o con amigos, combinando comodidad, amplitud y una hermosa vista natural. Cuenta con balcón privado, TV, wifi y todas las comodidades para una estadía placentera. Incluye desayuno y acceso a piscina climatizada, termales artificiales, bar y restaurante para disfrutar de una experiencia completa de descanso y diversión.",
    features: [
      "Balcón privado con vista panorámica",
      "Mayor capacidad",
      "Servicio de bar y restaurante",
      "Acceso a piscina climatizada y termales artificiales",
      "Desayuno incluido para 4 personas",
      "TV",
      "Wifi",
      "Parqueadero privado",
      "Servicio de bar y restaurante",
    ],
    badge: "Ideal para familias",
  },
    {
    name: "Día de Sol",
    type: "Sin alojamiento",
    image: "/images/diadesol1.jpeg",
    images: [
      "/images/diadesol1.jpeg",
      "/images/diadesol2.jpeg",
      "/images/diadesol3.jpeg",
      "/images/diadesol4.jpeg",
      "/images/diadesol5.jpeg",
      "/images/diadesol6.jpeg",
     
    ],
    description:
      "La opción perfecta para compartir en familia o con amigos, combinando comodidad, amplitud y una hermosa vista natural. Cuenta con balcón privado, TV, wifi y todas las comodidades para una estadía placentera. Incluye desayuno y acceso a piscina climatizada, termales artificiales, bar y restaurante para disfrutar de una experiencia completa de descanso y diversión.",
    features: [
      "Acceso a piscina climatizada",
      "Acceso a termales artificiales",
      "Servicio de bar y restaurante",
  
    ],
    badge: "Ideal para relajarse",
  
  }
];
