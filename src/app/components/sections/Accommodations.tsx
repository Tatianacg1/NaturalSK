import { accommodations } from "../../data/accommodations";

export function Accommodations() {
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
