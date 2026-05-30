// Componente principal de la página pública.
// Contiene la navegación, el hero, secciones de hospedaje, galería, testimonios y contacto.
import { useState, useEffect } from "react";
import { MapPin, Phone, Instagram, Star, ChevronDown, Menu, X, LogIn } from "lucide-react";

const HERO_IMG = "/images/galterm1.jpeg";
const CABIN_IMG = "/images/galperla1.jpeg";
const TENT_IMG = "/images/naturals1.jpeg";
const RIVER_IMG = "/images/pisc1.jpeg";
const STARS_IMG = "/images/glamp1.jpeg";
const VALLEY_IMG = "/images/pisc1.jpeg";
const PERLA_IMG = "/images/perla1.jpeg";
const ESMERALDA_IMG = "/images/esmeralda1.jpeg";
const ZAFIRO_IMG = "/images/zafiro1.jpeg";
const DIAMANTE_IMG = "/images/diamante1.jpeg";
const HABITACION_PAREJA_IMG = "/images/habitacionp1.jpeg";
const HABITACION_CUADRUPLE_IMG = "/images/habitacionc1.jpeg";
const accommodations = [
  {
    name: "Glamping Perla",
    type: "Glamping",
    image: PERLA_IMG,
    description: "Un refugio romántico diseñado para desconectarte de la rutina y disfrutar de la naturaleza con total privacidad. Cuenta con jacuzzi privado ilimitado, malla catamarán, cama exterior tipo playera, cama King y acceso a piscina climatizada y termales. Incluye desayuno, wifi, amenities y parqueadero privado.",
    features: ["Cama king size", "Baño privado", "Jacuzzi privado", "Desayuno incluido"],
    badge: "Más solicitado",
  },
  {
    name: "Glamping Esmeralda",
    type: "Glamping",
    image: ESMERALDA_IMG,
    description: "Un espacio exclusivo para vivir una experiencia de descanso y conexión con la naturaleza. Disfruta de jacuzzi privado ilimitado, ducha al aire libre, malla catamarán XXL, cama exterior tipo playera y una acogedora cama King. Incluye desayuno, wifi, amenities, parqueadero privado y acceso a piscina climatizada y termales artificiales.",
    features: ["Chimenea", "Ducha al aire libre", "Jacuzzi privado", "Desayuno incluido"],
    badge: "Exclusivo",
  },
  {
    name: "Glamping Diamante",
    type: "Glamping",
    image: DIAMANTE_IMG,
    description: "Plataforma elevada entre las copas de los árboles. La experiencia más inmersiva de Natural Sound, con ventanales de piso a techo y ducha exterior bajo las estrellas.",
    features: ["Desayuno incluido", "Jacuzzi privado", "Chimenea", "Cama King"],
    badge: "Discreto",
  },

   {
    name: "Glamping Zafiro",
    type: "Glamping",
    image: ZAFIRO_IMG,
    description: "El espacio ideal para compartir momentos inolvidables en pareja, familia o con amigos. Con capacidad hasta para 6 personas, ofrece jacuzzi privado ilimitado, malla catamarán, chimenea interior y amplias zonas de descanso rodeadas de naturaleza. Incluye desayuno, wifi, amenities, parqueadero privado y acceso a piscina climatizada y termales artificiales.",
    features: ["Chimenea interior", "Desayuno incluido", "Malla catamarán", "Jacuzzi privado"],
    badge: "Comodidad",
  },

   {
    name: "Habitacion Pareja",
    type: "Habitación",
    image: HABITACION_PAREJA_IMG,
    description: "Una acogedora habitación diseñada para disfrutar de una escapada tranquila en pareja. Cuenta con balcón privado con vista, TV, wifi y desayuno incluido, combinando comodidad y descanso en un entorno natural. Además, tendrás acceso a piscina climatizada, termales artificiales, bar y restaurante para complementar una experiencia de relajación y bienestar.",
    features: ["Balcón privado con vista panorámica", "Desayuno incluido para 2 personas", "Servicio de bar y restaurante", "Acceso a piscina climatizada y termales artificiales"],
    badge: "Escapada Romántica",
  },

  {
    name: "Habitacion Cuadruple ",
    type: "Habitación",
    image: HABITACION_CUADRUPLE_IMG,
    description: "La opción perfecta para compartir en familia o con amigos, combinando comodidad, amplitud y una hermosa vista natural. Cuenta con balcón privado, TV, wifi y todas las comodidades para una estadía placentera. Incluye desayuno y acceso a piscina climatizada, termales artificiales, bar y restaurante para disfrutar de una experiencia completa de descanso y diversión.",
    features: ["Balcón privado con vista panorámica", "Mayor capacidad", "Servicio de bar y restaurante", "Acceso a piscina climatizada y termales artificiales"],
    badge: "Ideal para familias",
  },
];

const testimonials = [
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

// Barra de navegación principal del sitio.
// Contiene enlaces de sección, botón de reservar y botón de inicio de sesión.
function NavBar({ onLoginClick }: { onLoginClick: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = ["Nosotros", "Hospedaje", "Galería", "Contacto"];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0f1a0e]/95 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <img
          src="/images/sk.png"
          alt="Natural Sound"
          className="h-14 sm:h-16 md:h-20 w-auto object-contain mr-4 md:mr-8"
        />

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {l}
            </a>
          ))}
          <a
            href="https://wa.me/573127131999?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#607651] text-white px-5 py-2 text-sm tracking-wide transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Reservar
          </a>
          <button
            onClick={onLoginClick}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide flex items-center gap-2 px-3 py-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <LogIn size={16} />
            Iniciar Sesión
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0f1a0e]/98 backdrop-blur-md border-t border-border px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-foreground text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <a
            href="https://wa.me/573127131999?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#607651] text-white px-5 py-3 text-center text-sm tracking-wide mt-2"
            onClick={() => setOpen(false)}
          >
            Reservar
          </a>
          <button
            onClick={() => {
              onLoginClick();
              setOpen(false);
            }}
            className="text-foreground text-lg flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <LogIn size={18} />
            Iniciar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-end pb-14 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a1208]">
        <img
          src={HERO_IMG}
          alt="Carpas de glamping rodeadas de bosque en Natural Sound"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e] via-[#0f1a0e]/30 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <p
            className="text-muted-foreground tracking-[0.3em] text-xs uppercase mb-5"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Glamping & Hotel Boutique
          </p>
          <h1
            className="text-foreground text-4xl sm:text-5xl md:text-7xl font-bold leading-none mb-4 md:mb-6"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
          >
            Donde la
            <br />
            <em className="text-primary not-italic">naturaleza</em>
            <br />
            habla.
          </h1>
          <p
            className="text-muted-foreground text-sm md:text-lg leading-relaxed mb-6 md:mb-10 max-w-md"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
           Natural Sound combina exclusivos glampings y cómodas habitaciones en medio de la naturaleza. Disfruta de jacuzzi privado, piscina climatizada, termales artificiales y espacios diseñados para el descanso y la desconexión.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#hospedaje"
              className="bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:bg-primary/80 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Ver hospedaje
            </a>
            <a
              href="#galería"
              className="border border-border text-foreground px-6 py-3 md:px-8 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Experiencias
            </a>
          </div>
        </div>
      </div>

      <a
        href="#nosotros"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
      >
        <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>Descubrir</span>
        <ChevronDown size={16} className="animate-bounce" />
      </a>
    </section>
  );
}

function About() {
  return (
    <section id="nosotros" className="py-14 px-4 md:py-28 md:px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div>
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            01 — Nuestra historia
          </p>
          <h2
            className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-6 md:mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
           Un refugio diseñado para desconectarte de la rutina y reconectar con la naturaleza.
          </h2>
          <p
            className="text-muted-foreground leading-relaxed mb-6 text-base"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Natural Sound nació con el propósito de crear un refugio donde la tranquilidad, la naturaleza y el confort se unen para brindar experiencias memorables. Rodeado de paisajes naturales y diseñado para el descanso, cada espacio invita a desconectarse de la rutina, reconectar con lo esencial y disfrutar momentos únicos en un entorno exclusivo.
          </p>
          <p
            className="text-muted-foreground leading-relaxed mb-10 text-base"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Nuestros glampings y habitaciones han sido diseñados para convivir en perfecta armonía con la naturaleza. Cada espacio fusiona confort, exclusividad y paisajes inspiradores, brindando una experiencia de descanso donde el lujo se vive de forma auténtica y natural.
          </p>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {[["50 min ", "Medellin"], ["30 min", "Bello"], ["4.9 ★", "Calificación"]].map(([val, lab]) => (
              <div key={lab} className="border-t border-border pt-5">
                <p
                  className="text-primary text-lg md:text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {val}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-wide uppercase"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {lab}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="bg-secondary h-80 md:h-[480px] overflow-hidden">
            <img
              src={VALLEY_IMG}
              alt="Valle boscoso con río en Natural Sound"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-card border border-border p-6 hidden md:block">
            <p
              className="text-accent text-xs tracking-widest uppercase mb-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Piscina
            </p>
            <p
              className="text-foreground text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Natural
            </p>
            <p className="text-muted-foreground text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Climatizada
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Accommodations() {
  return (
    <section id="hospedaje" className="py-14 px-4 md:py-28 md:px-6 bg-card/40">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            02 — Hospedaje
          </p>
          <h2
            className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Alojamientos únicos
            <br />
            en el corazón del bosque.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {accommodations.map((acc) => (
            <div
              key={acc.name}
              className="group bg-card border border-border overflow-hidden flex flex-col hover:border-primary/40 transition-colors duration-300"
            >
              <div className="relative h-56 overflow-hidden bg-secondary">
                <img
                  src={acc.image}
                  alt={acc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/60 to-transparent" />
                <span
                  className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs px-3 py-1 tracking-widest uppercase"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {acc.badge}
                </span>
                <span
                  className="absolute bottom-4 left-4 text-muted-foreground text-xs tracking-widest uppercase"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {acc.type}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3
                  className="text-foreground text-xl font-semibold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {acc.name}
                </h3>
                <p
                  className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                >
                  {acc.description}
                </p>
                <ul className="space-y-1 mb-6">
                  {acc.features.map((f) => (
                    <li
                      key={f}
                      className="text-muted-foreground text-xs flex items-center gap-2"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end border-t border-border pt-5">
                  <a
                    href="https://wa.me/573127131999?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs tracking-widest uppercase bg-[#607651] text-white px-4 py-2 transition-colors"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Reservar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="galería" className="py-14 px-4 md:py-28 md:px-6 bg-card/40">
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          03 — Galería
        </p>
        <h2
          className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 md:mb-14"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Natural Sound en imágenes.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[130px] sm:auto-rows-[160px] md:auto-rows-[200px]">
          <div className="col-span-2 row-span-2 overflow-hidden bg-secondary">
            <img
              src={HERO_IMG}
              alt="Carpas rodeadas de bosque"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img src={TENT_IMG} alt="Carpa glamping interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img src={STARS_IMG} alt="Mesa bajo cielo estrellado" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img src={RIVER_IMG} alt="Río en el bosque" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img src={CABIN_IMG} alt="Cabaña frente al riachuelo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-14 px-4 md:py-28 md:px-6">
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          04 — Testimonios
        </p>
        <h2
          className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 md:mb-16"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Lo que dicen
          <br />
          quienes ya vivieron Natural Sound.
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="border border-border p-5 md:p-8 flex flex-col gap-4 md:gap-5">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-accent text-accent" />
                ))}
              </div>
              <p
                className="text-foreground text-base leading-relaxed flex-1 italic"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-border pt-5">
                <p
                  className="text-foreground text-sm font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t.name}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-wide mt-1"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {t.origin}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="https://g.page/glampingnaturalsound/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Ver opiniones en Google
          </a>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contacto" className="py-14 px-4 md:py-28 md:px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-20 items-start">
        <div>
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            05 — Contacto
          </p>
          <h2
            className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 md:mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contáctanos.
            <br />
            Reserva por WhatsApp.
          </h2>
          <div className="space-y-4 mb-8 md:mb-12 bg-card/70 border border-border rounded-3xl p-5 md:p-8">
            {([
              { Icon: Phone, text: "+57 (312) 713 1999" },
              { Icon: Instagram, text: "@glampingnaturalsound" },
              { Icon: MapPin, text: "San Felix, Bello, Antioquia" },
            ]).map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <Icon size={16} className="text-primary shrink-0" />
                <span
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="relative h-52 overflow-hidden bg-secondary">
            <img
              src={VALLEY_IMG}
              alt="Vista aérea del bosque Natural Sound"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/50 to-transparent" />
            <p
              className="absolute bottom-4 left-4 text-foreground text-sm italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              San Felix, Bello, Antioquia — Natural sound
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <p
            className="text-muted-foreground text-base leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Para reservar o pedir información rápida, escríbenos por WhatsApp. Responderemos lo antes posible.
          </p>
          <a
            href="https://wa.me/573127131999?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#607651] px-8 py-4 text-sm font-semibold text-white transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Reservar
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4 md:py-12 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div>
          <p
            className="text-primary text-xl md:text-2xl font-bold mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Natural Sound
          </p>
          <p
            className="text-muted-foreground text-xs tracking-wide"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Glamping & Hotel Boutique · San Felix, Bello.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          {["Nosotros", "Hospedaje", "Galería", "Contacto"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-muted-foreground text-xs tracking-wide hover:text-foreground transition-colors uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {l}
            </a>
          ))}
        </div>
        <p
          className="text-muted-foreground/50 text-xs"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          © 2026 Natural Sound
        </p>
      </div>
    </footer>
  );
}

// Componente principal público de la aplicación.
// Ensambla todas las secciones de la landing page y recibe el controlador de login.
export default function App({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="bg-background text-foreground min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <NavBar onLoginClick={onLoginClick} />
      <Hero />
      <About />
      <Accommodations />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
