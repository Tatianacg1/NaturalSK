const HERO_IMG = "/images/galterm1.jpeg";
const CABIN_IMG = "/images/galperla1.jpeg";
const TENT_IMG = "/images/naturals1.jpeg";
const RIVER_IMG = "/images/pisc1.jpeg";
const STARS_IMG = "/images/glamp1.jpeg";

export function Gallery() {
  return (
    <section id="galería" className="py-14 px-4 md:py-28 md:px-6 bg-card/40 overflow-hidden">
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

        {/* Mobile: columna única apilada */}
        <div className="flex flex-col gap-2 md:hidden">
          <div className="overflow-hidden bg-secondary h-56">
            <img src={HERO_IMG} alt="Carpas rodeadas de bosque" className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="overflow-hidden bg-secondary h-40">
              <img src={TENT_IMG} alt="Carpa glamping interior" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden bg-secondary h-40">
              <img src={STARS_IMG} alt="Mesa bajo cielo estrellado" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden bg-secondary h-40">
              <img src={RIVER_IMG} alt="Río en el bosque" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden bg-secondary h-40">
              <img src={CABIN_IMG} alt="Cabaña frente al riachuelo" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Desktop: grid con imagen principal grande */}
        <div className="hidden md:grid md:grid-cols-4 gap-3 auto-rows-[200px]">
          <div className="col-span-2 row-span-2 overflow-hidden bg-secondary">
            <img
              src={HERO_IMG}
              alt="Carpas rodeadas de bosque"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img
              src={TENT_IMG}
              alt="Carpa glamping interior"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img
              src={STARS_IMG}
              alt="Mesa bajo cielo estrellado"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img
              src={RIVER_IMG}
              alt="Río en el bosque"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden bg-secondary">
            <img
              src={CABIN_IMG}
              alt="Cabaña frente al riachuelo"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
