import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { accommodations, type Accommodation } from "../../data/accommodations";
import { tarifasBase, tarifasZafiroTiers, tarifasDiaDeSol, formatCOP } from "../../data/pricing";
import { reservaPublicaAPI } from "../../../services/api";

// ─── Helpers de disponibilidad ────────────────────────────────────────────────

function normalizeNombre(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AloRango {
  check_in: string;
  check_out: string;
  numero_huespedes?: number;
}

interface AloRaw {
  nombre: string;
  limite_reservas: number;
  reservas: AloRango[];
  es_dia_de_sol?: boolean;
  capacidad_semana?: number;
  capacidad_domingo?: number;
}

interface DisponibilidadInfo {
  ocupadoHoy: boolean;
  tieneReservas: boolean;
}

function calcDisponibilidad(alo: AloRaw): DisponibilidadInfo {
  const today = getTodayLocal();
  const limite = alo.limite_reservas ?? 1;
  let ocupadoHoy = false;

  if (alo.es_dia_de_sol) {
    const esDomingo = new Date().getDay() === 0;
    const cap = esDomingo ? (alo.capacidad_domingo ?? 30) : (alo.capacidad_semana ?? 25);
    const total = alo.reservas
      .filter((r) => r.check_in.slice(0, 10) === today)
      .reduce((acc, r) => acc + (r.numero_huespedes ?? 0), 0);
    ocupadoHoy = total >= cap;
  } else {
    ocupadoHoy =
      alo.reservas.filter((r) => r.check_in.slice(0, 10) <= today && r.check_out.slice(0, 10) > today).length >= limite;
  }

  return { ocupadoHoy, tieneReservas: alo.reservas.length > 0 };
}

// ─────────────────────────────────────────────────────────────────────────────

function AccommodationCard({ acc, disponibilidad }: { acc: Accommodation; disponibilidad?: DisponibilidadInfo }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const isDDS = acc.name.toLowerCase().includes("dia de sol") || acc.name.toLowerCase().includes("día de sol");
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

  const ocupado = disponibilidad?.ocupadoHoy ?? false;

  return (
    <div className={`group bg-card border overflow-hidden flex flex-col transition-colors duration-300 ${ocupado ? "border-red-300/40 opacity-80" : "border-border hover:border-primary/40"}`}>
      {/* Imagen con carrusel */}
      <div className="relative h-56 overflow-hidden bg-secondary">
        {acc.images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${acc.name} ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === idx ? "opacity-100" : "opacity-0"
            } ${ocupado ? "grayscale opacity-60" : ""}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/60 to-transparent" />

        {/* Flechas — solo si hay más de 1 imagen */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors shadow-md"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors shadow-md"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={16} />
            </button>

            {/* Puntos */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5">
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

        {/* Badge disponibilidad (cuando hay datos) */}
        {disponibilidad && (
          <span
            className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 tracking-widest uppercase ${
              ocupado
                ? "bg-red-500 text-white"
                : disponibilidad.tieneReservas
                  ? "bg-amber-500 text-white"
                  : "bg-green-600 text-white"
            }`}
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {ocupado ? "Ocupado" : disponibilidad.tieneReservas ? "Fechas reservadas" : "Disponible"}
          </span>
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
        <div className="flex-1">
          <p
            className="text-muted-foreground text-sm leading-relaxed mb-5"
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
        </div>

        {/* Precio por noche */}
        {(() => {
          const isZafiro = acc.name.toLowerCase().includes("zafiro");
          const isDiaDeSol = acc.name.toLowerCase().includes("dia de sol") || acc.name.toLowerCase().includes("día de sol");

          if (isDiaDeSol) {
            const ds = tarifasDiaDeSol();
            return (
              <div className="mb-5 px-3 py-2.5 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-[10px] text-primary/70 tracking-widest uppercase mb-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Tarifa por día · por persona
                </p>
                {/* Encabezado */}
                <div className="grid grid-cols-[minmax(5rem,auto)_1fr_1fr] text-[8px] text-muted-foreground uppercase tracking-wider mb-1 pb-1 border-b border-primary/10"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  <span />
                  <span className="text-center">Lun–Jue</span>
                  <span className="text-center">Fin sem · Fest</span>
                </div>
                {/* Filas */}
                <div className="grid grid-cols-[minmax(5rem,auto)_1fr_1fr] items-center py-0.5 gap-x-1">
                  <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Entrada
                  </span>
                  <span className="text-primary text-[11px] font-bold text-center"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(ds.low.entrada)}
                  </span>
                  <span className="text-primary/80 text-[11px] font-bold text-center"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(ds.high.entrada)}
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(5rem,auto)_1fr_1fr] items-center py-0.5 gap-x-1">
                  <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Consumibles
                  </span>
                  <span className="text-primary text-[11px] font-bold text-center"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(ds.low.consumibles)}
                  </span>
                  <span className="text-primary/80 text-[11px] font-bold text-center"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(ds.high.consumibles)}
                  </span>
                </div>
              </div>
            );
          }

          if (isZafiro) {
            const tiers = tarifasZafiroTiers();
            return (
              <div className="mb-5 px-3 py-2.5 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-[10px] text-primary/70 tracking-widest uppercase mb-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Tarifa por noche
                </p>
                {/* Encabezado columnas */}
                <div className="grid grid-cols-[minmax(4rem,auto)_1fr_1fr] text-[8px] text-muted-foreground uppercase tracking-wider mb-1 pb-1 border-b border-primary/10"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  <span />
                  <span className="text-center">Lun–Jue</span>
                  <span className="text-center">Fin sem · Fest</span>
                </div>
                {/* Filas */}
                {tiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-[minmax(4rem,auto)_1fr_1fr] items-center py-0.5 gap-x-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      {i === 0 ? "1–2 per." : i === 1 ? "3–4 per." : "5–6 per."}
                    </span>
                    <span className="text-primary text-[11px] font-bold text-center"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      {formatCOP(tier.low)}
                    </span>
                    <span className="text-primary/80 text-[11px] font-bold text-center"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      {formatCOP(tier.high)}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          const rates = tarifasBase(acc.name);
          return rates ? (
            <div className="mb-5 px-3 py-2.5 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-[10px] text-primary/70 tracking-widest uppercase mb-2"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                Tarifa por noche
              </p>
              <div className="grid grid-cols-2 gap-x-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-muted-foreground uppercase tracking-wider"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    Lun – Jue
                  </span>
                  <span className="text-primary text-base font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(rates.low)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-muted-foreground uppercase tracking-wider"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    Fin sem · Fest
                  </span>
                  <span className="text-primary/80 text-base font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(rates.high)}
                  </span>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        <div className="flex items-start gap-1.5 pt-4 pb-4 border-t border-border">
          <Clock size={11} className="text-primary/50 shrink-0 mt-0.5" />
          <span className="text-[10px] leading-relaxed text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            {isDDS
              ? "Ingreso 9:00 AM – 6:00 PM"
              : <>Check-in 3:00 PM · Check-out 12:00 PM<br />Zonas húmedas: 8:00 PM (fin de sem. 9:00 PM)<br />Decoración NO incluida</>
            }
          </span>
        </div>

        <div className="flex justify-end">
          {ocupado ? (
            <span
              className="text-xs tracking-widest uppercase text-red-400 border border-red-300/50 bg-red-50/60 px-4 py-2 cursor-not-allowed"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              No disponible
            </span>
          ) : (
            <a
              href={`/reservar?alojamiento=${encodeURIComponent(acc.name)}`}
              className="text-xs tracking-widest uppercase bg-[#8a6038] hover:bg-[#7a4c28] text-white px-4 py-2 transition-colors"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Reservar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function Accommodations() {
  const [disponibilidadMap, setDisponibilidadMap] = useState<Map<string, DisponibilidadInfo>>(new Map());

  useEffect(() => {
    reservaPublicaAPI.disponibilidadGeneral()
      .then((data: { alojamientos?: AloRaw[] }) => {
        const map = new Map<string, DisponibilidadInfo>();
        for (const alo of (data.alojamientos ?? [])) {
          map.set(normalizeNombre(alo.nombre), calcDisponibilidad(alo));
        }
        setDisponibilidadMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="hospedaje" className="py-14 px-4 md:py-28 md:px-6 bg-card/40 overflow-hidden">
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
            <AccommodationCard
              key={acc.name}
              acc={acc}
              disponibilidad={disponibilidadMap.get(normalizeNombre(acc.name))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
