import { ChevronDown } from "lucide-react";

const HERO_IMG = "/images/galterm1.jpeg";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col pt-[100px] md:pt-[120px] pb-14 md:pb-20">
      <div className="absolute inset-0 overflow-hidden bg-[#0a1208]">
        <img
          src={HERO_IMG}
          alt="Carpas de glamping rodeadas de bosque en Natural Sound"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e] via-[#0f1a0e]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a0e]/70 via-transparent to-transparent" />
      </div>

      <div className="relative mt-auto z-10 max-w-7xl mx-auto px-6 w-full">
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
            Natural Sound combina exclusivos glampings y cómodas habitaciones en medio de la
            naturaleza. Disfruta de jacuzzi privado, piscina climatizada, termales artificiales y
            espacios diseñados para el descanso y la desconexión.
          </p>
          <div className="flex flex-wrap gap-4">
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
      </div>

      <a
        href="#nosotros"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
      >
        <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
          Descubrir
        </span>
        <ChevronDown size={16} className="animate-bounce" />
      </a>
    </section>
  );
}
