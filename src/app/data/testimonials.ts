export interface Testimonial {
  name: string;
  origin: string;
  rating: number;
  text: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Tatiana Correa",
    origin: "Medellín",
    rating: 5,
    text: "El mejor glamping de todo el norte🤩, la comodidad y la atención es lo más especial de este lugar y ni que decir de la comida tan deliciosa, volvería 100 veces más. Hasta mi perrito lo disfruto",
  },
  {
    name: "Juliana Avendaño",
    origin: "Guarne",
    rating: 5,
    text: "La comida, la atención , el lugar , todo es un lujo 🥰 definitivamente el mejor lugar para compartir con amigos, pareja o familia . Súper recomendable",
  },
  {
    name: "Angie Celeste",
    origin: "Bogota",
    rating: 5,
    text: "Fue una excelente experiencia, desde el personal, que es muy amable, las instalaciones me encantaron y la comida es muy rica. El lugar es realmente hermoso.",
  },
];
