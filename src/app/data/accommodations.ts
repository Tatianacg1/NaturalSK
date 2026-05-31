export interface Accommodation {
  name: string;
  type: string;
  image: string;
  description: string;
  features: string[];
  badge: string;
}

export const accommodations: Accommodation[] = [
  {
    name: "Glamping Perla",
    type: "Glamping",
    image: "/images/perla1.jpeg",
    description:
      "Un refugio romántico diseñado para desconectarte de la rutina y disfrutar de la naturaleza con total privacidad. Cuenta con jacuzzi privado ilimitado, malla catamarán, cama exterior tipo playera, cama King y acceso a piscina climatizada y termales. Incluye desayuno, wifi, amenities y parqueadero privado.",
    features: ["Cama king size", "Baño privado", "Jacuzzi privado", "Desayuno incluido"],
    badge: "Más solicitado",
  },
  {
    name: "Glamping Esmeralda",
    type: "Glamping",
    image: "/images/esmeralda1.jpeg",
    description:
      "Un espacio exclusivo para vivir una experiencia de descanso y conexión con la naturaleza. Disfruta de jacuzzi privado ilimitado, ducha al aire libre, malla catamarán XXL, cama exterior tipo playera y una acogedora cama King. Incluye desayuno, wifi, amenities, parqueadero privado y acceso a piscina climatizada y termales artificiales.",
    features: ["Chimenea", "Ducha al aire libre", "Jacuzzi privado", "Desayuno incluido"],
    badge: "Exclusivo",
  },
  {
    name: "Glamping Diamante",
    type: "Glamping",
    image: "/images/diamante1.jpeg",
    description:
      "Plataforma elevada entre las copas de los árboles. La experiencia más inmersiva de Natural Sound, con ventanales de piso a techo y ducha exterior bajo las estrellas.",
    features: ["Desayuno incluido", "Jacuzzi privado", "Chimenea", "Cama King"],
    badge: "Discreto",
  },
  {
    name: "Glamping Zafiro",
    type: "Glamping",
    image: "/images/zafiro1.jpeg",
    description:
      "El espacio ideal para compartir momentos inolvidables en pareja, familia o con amigos. Con capacidad hasta para 6 personas, ofrece jacuzzi privado ilimitado, malla catamarán, chimenea interior y amplias zonas de descanso rodeadas de naturaleza. Incluye desayuno, wifi, amenities, parqueadero privado y acceso a piscina climatizada y termales artificiales.",
    features: ["Chimenea interior", "Desayuno incluido", "Malla catamarán", "Jacuzzi privado"],
    badge: "Comodidad",
  },
  {
    name: "Habitacion Pareja",
    type: "Habitación",
    image: "/images/habitacionp1.jpeg",
    description:
      "Una acogedora habitación diseñada para disfrutar de una escapada tranquila en pareja. Cuenta con balcón privado con vista, TV, wifi y desayuno incluido, combinando comodidad y descanso en un entorno natural. Además, tendrás acceso a piscina climatizada, termales artificiales, bar y restaurante para complementar una experiencia de relajación y bienestar.",
    features: [
      "Balcón privado con vista panorámica",
      "Desayuno incluido para 2 personas",
      "Servicio de bar y restaurante",
      "Acceso a piscina climatizada y termales artificiales",
    ],
    badge: "Escapada Romántica",
  },
  {
    name: "Habitacion Cuadruple",
    type: "Habitación",
    image: "/images/habitacionc1.jpeg",
    description:
      "La opción perfecta para compartir en familia o con amigos, combinando comodidad, amplitud y una hermosa vista natural. Cuenta con balcón privado, TV, wifi y todas las comodidades para una estadía placentera. Incluye desayuno y acceso a piscina climatizada, termales artificiales, bar y restaurante para disfrutar de una experiencia completa de descanso y diversión.",
    features: [
      "Balcón privado con vista panorámica",
      "Mayor capacidad",
      "Servicio de bar y restaurante",
      "Acceso a piscina climatizada y termales artificiales",
    ],
    badge: "Ideal para familias",
  },
];
