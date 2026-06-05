import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "../ui/utils";
import type { Accommodation } from "../../data/accommodations";
import { tarifasBase, precioTotal, formatCOP } from "../../data/pricing";

interface Props {
  accommodation: Accommodation;
  disponible?: boolean;
  isSelected?: boolean;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  onClose: () => void;
  onSelect: () => void;
}

export function AccommodationLightbox({
  accommodation,
  disponible = true,
  isSelected = false,
  checkIn,
  checkOut,
  nights,
  onClose,
  onSelect,
}: Props) {
  const images = accommodation.images?.length ? accommodation.images : [accommodation.image];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-avance
  useEffect(() => {
    if (images.length <= 1 || paused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length, paused]);

  // Cerrar con Escape, navegar con flechas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") { setPaused(true); setCurrent((c) => (c - 1 + images.length) % images.length); }
      if (e.key === "ArrowRight") { setPaused(true); setCurrent((c) => (c + 1) % images.length); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  const prev = () => { setPaused(true); setCurrent((c) => (c - 1 + images.length) % images.length); };
  const next = () => { setPaused(true); setCurrent((c) => (c + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Botón cerrar ── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* ── Carrusel de fotos (izquierda) ── */}
        <div className="relative w-full md:w-[55%] bg-gray-900 shrink-0">
          {/* Imagen principal */}
          <div className="relative h-64 md:h-full min-h-[280px]">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${accommodation.name} — foto ${i + 1}`}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  i === current ? "opacity-100" : "opacity-0"
                )}
              />
            ))}

            {/* Gradiente inferior */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Flechas de navegación (solo si hay más de 1 foto) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Indicador de foto actual */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPaused(true); setCurrent(i); }}
                    className={cn(
                      "rounded-full transition-all",
                      i === current
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => { setPaused(true); setCurrent(i); }}
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      i === current ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Info del alojamiento (derecha) ── */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 flex-1">
            {/* Badge + tipo */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] bg-[#8a6038]/10 text-[#8a6038] px-2.5 py-1 rounded-full font-semibold"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {accommodation.type}
              </span>
              <span
                className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {accommodation.badge}
              </span>
            </div>

            {/* Nombre */}
            <h2
              className="text-[#3d2010] text-2xl font-semibold mb-3 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {accommodation.name}
            </h2>

            {/* Descripción */}
            <p
              className="text-gray-500 text-sm leading-relaxed mb-5"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {accommodation.description}
            </p>

            {/* Características */}
            <div>
              <p
                className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-2"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Incluye
              </p>
              <ul className="space-y-1.5">
                {accommodation.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="w-4 h-4 rounded-full bg-[#8a6038]/10 flex items-center justify-center shrink-0">
                      <Check size={9} className="text-[#8a6038]" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Precio */}
          {(() => {
            const rates = tarifasBase(accommodation.name);
            if (!rates) return null;
            const hasRange = checkIn && checkOut && nights && nights > 0;
            const total = hasRange ? precioTotal(accommodation.name, checkIn!, checkOut!) : null;
            return (
              <div className="px-6 py-4 border-t border-gray-100 bg-[#f9f2e8]">
                <p className="text-[10px] text-[#8a6038] tracking-widest uppercase font-semibold mb-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  {hasRange ? `Precio · ${nights} ${nights === 1 ? "noche" : "noches"}` : "Tarifa por noche"}
                </p>
                {hasRange && total ? (
                  <p className="text-[#3d2010] text-xl font-bold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatCOP(total)}
                    <span className="text-sm font-normal text-gray-400 ml-1"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>total estimado</span>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  <span>{formatCOP(rates.low)} lun–jue</span>
                  <span>·</span>
                  <span>{formatCOP(rates.high)} fin de sem / festivo / temp. alta</span>
                </div>
                <p className="text-[10px] text-amber-600 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Precios en pesos colombianos · Sujetos a cambios
                </p>
              </div>
            );
          })()}

          {/* CTA */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-100">
            {disponible ? (
              <button
                onClick={() => { onSelect(); onClose(); }}
                className={cn(
                  "w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  isSelected
                    ? "bg-[#7a4c28] text-white"
                    : "bg-[#8a6038] hover:bg-[#7a4c28] text-white shadow-sm"
                )}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isSelected ? (
                  <><Check size={15} /> Seleccionado</>
                ) : (
                  "Seleccionar este alojamiento"
                )}
              </button>
            ) : (
              <div className="w-full py-3 rounded-full text-sm font-semibold text-center bg-red-50 text-red-400 border border-red-100"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                No disponible para las fechas seleccionadas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
