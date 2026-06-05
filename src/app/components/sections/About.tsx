const VALLEY_IMG = "/images/pisc1.jpeg";

const stats = [
  ["50 min", "Medellin"],
  ["30 min", "Bello"],
  ["4.9 ★", "Calificación"],
] as const;

export function About() {
  return (
    <section id="nosotros" className="py-14 px-4 md:py-28 md:px-6 overflow-hidden">
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
            Natural Sound nació con el propósito de crear un refugio donde la tranquilidad, la
            naturaleza y el confort se unen para brindar experiencias memorables. Rodeado de paisajes
            naturales y diseñado para el descanso, cada espacio invita a desconectarse de la rutina,
            reconectar con lo esencial y disfrutar momentos únicos en un entorno exclusivo.
          </p>
          <p
            className="text-muted-foreground leading-relaxed mb-10 text-base"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Nuestros glampings y habitaciones han sido diseñados para convivir en perfecta armonía
            con la naturaleza. Cada espacio fusiona confort, exclusividad y paisajes inspiradores,
            brindando una experiencia de descanso donde el lujo se vive de forma auténtica y natural.
          </p>
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            {stats.map(([val, lab]) => (
              <div key={lab} className="border-t border-border pt-4">
                <p
                  className="text-primary text-base md:text-2xl font-bold mb-1 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {val}
                </p>
                <p
                  className="text-muted-foreground text-[10px] md:text-xs tracking-wide uppercase leading-tight"
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
