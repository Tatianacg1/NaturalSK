import { ChevronDown } from "lucide-react";

const HERO_IMG = "/images/galterm1.jpeg";

export function Hero() {
  return (
    <section className="relative flex flex-col min-h-[50vh] md:min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 overflow-hidden bg-[#0a1208]">
        <img
          src={HERO_IMG}
          alt="Carpas de glamping rodeadas de bosque en Natural Sound"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a100a] via-[#1a100a]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a100a]/70 via-transparent to-transparent" />
      </div>

      {/* Contenido: empuja hacia abajo con mt-auto */}
      <div className="relative z-10 mt-auto w-full px-5 pb-16 md:pb-28 max-w-7xl mx-auto">
        <p
          className="text-muted-foreground tracking-[0.3em] text-xs uppercase mb-3 md:mb-5"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Glamping & Hotel Boutique
        </p>
        <h1
          className="text-foreground text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-3 md:mb-6"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
        >
          Donde la
          <br />
          <em className="text-primary not-italic">naturaleza</em>
          <br />
          habla.
        </h1>
        <p
          className="text-muted-foreground text-sm md:text-lg leading-relaxed mb-5 md:mb-10"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          Natural Sound combina exclusivos glampings y cómodas habitaciones en
          medio de la naturaleza. Disfruta de jacuzzi privado, piscina
          climatizada, termales artificiales y espacios diseñados para el
          descanso y la desconexión.
        </p>
        <div className="flex flex-wrap gap-3 md:gap-4">
          <a
            href="/reservar"
            className="bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:bg-primary/80 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Reservar ahora
          </a>
          <a
            href="#hospedaje"
            className="border border-border text-foreground px-6 py-3 md:px-8 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:border-primary hover:text-primary transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Ver hospedaje
          </a>
        </div>
      </div>

      {/* Descubrir — separado por pb-16 del contenido */}
      <a
        href="#nosotros"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1 z-10"
      >
        <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
          Descubrir
        </span>
        <ChevronDown size={13} className="animate-bounce" />
      </a>
    </section>
  );
}
