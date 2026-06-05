import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { accommodations, type Accommodation } from "../../data/accommodations";
import { tarifasBase, formatCOP } from "../../data/pricing";

function AccommodationCard({ acc }: { acc: Accommodation }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = acc.images.length;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (total <= 1 || paused) return;
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [total, paused]);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(true);
    setIdx((i) => (i - 1 + total) % total);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(true);
    setIdx((i) => (i + 1) % total);
  };

  return (
    <div className="group bg-card border border-border overflow-hidden flex flex-col hover:border-primary/40 transition-colors duration-300">
      {/* Imagen con carrusel */}
      <div className="relative h-56 overflow-hidden bg-secondary">
        <img
          src={acc.images[idx]}
          alt={`${acc.name} ${idx + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/60 to-transparent" />

        {/* Flechas — solo si hay más de 1 imagen */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={15} />
            </button>

            {/* Puntos */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {acc.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPaused(true); setIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === idx ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badge tipo */}
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

        {/* Contador de fotos */}
        {total > 1 && (
          <span
            className="absolute bottom-4 right-4 text-white/70 text-[10px] font-medium"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {idx + 1}/{total}
          </span>
        )}
      </div>

      {/* Contenido */}
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
        <ul className="space-y-1 mb-5">
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

        {/* Precio por noche */}
        {(() => {
          const rates = tarifasBase(acc.name);
          return rates ? (
            <div className="mb-5 px-3 py-2.5 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-[10px] text-primary/70 tracking-widest uppercase mb-1"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                Tarifa por noche
              </p>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-primary text-lg font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(rates.low)}
                  </span>
                  <span className="text-muted-foreground text-xs"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    lun–jue
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-primary/80 text-lg font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(rates.high)}
                  </span>
                  <span className="text-muted-foreground text-xs"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    fin de sem / festivo / temp. alta
                  </span>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        <div className="flex justify-end border-t border-border pt-5">
          <a
            href={`/reservar?alojamiento=${encodeURIComponent(acc.name)}`}
            className="text-xs tracking-widest uppercase bg-[#607651] hover:bg-[#4e6142] text-white px-4 py-2 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Reservar
          </a>
        </div>
      </div>
    </div>
  );
}

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
            <AccommodationCard key={acc.name} acc={acc} />
          ))}
        </div>
      </div>
    </section>
  );
}
