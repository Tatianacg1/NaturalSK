import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, AlertCircle, Loader, CalendarDays, MapPin, Expand } from "lucide-react";
import { accommodations } from "../data/accommodations";
import { reservaPublicaAPI } from "../../services/api";
import { CalendarioPublico, type AloData } from "../components/sections/CalendarioPublico";
import { AccommodationLightbox } from "../components/sections/AccommodationLightbox";
import { cn } from "../components/ui/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocal(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateLong(str: string): string {
  if (!str) return "—";
  const d = parseLocal(str);
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function nightsBetween(ci: string, co: string): number {
  if (!ci || !co) return 0;
  return Math.round((parseLocal(co).getTime() - parseLocal(ci).getTime()) / 86400000);
}

function isAvailableForRange(alo: AloData, ci: string, co: string): boolean {
  if (!ci || !co) return false;
  if (alo.es_dia_de_sol) {
    const date = parseLocal(ci);
    const esDomingo = date.getDay() === 0;
    const cap = esDomingo ? (alo.capacidad_domingo ?? 30) : (alo.capacidad_semana ?? 25);
    const total = alo.reservas
      .filter((r) => r.check_in === ci)
      .reduce((acc, r) => acc + ((r as { numero_huespedes?: number }).numero_huespedes ?? 0), 0);
    return total < cap;
  }
  const end = parseLocal(co);
  const cur = new Date(parseLocal(ci));
  while (cur < end) {
    const booked = alo.reservas.filter((r) => {
      const rCi = parseLocal(r.check_in);
      const rCo = parseLocal(r.check_out);
      return cur >= rCi && cur < rCo;
    }).length;
    if (booked >= alo.limite_reservas) return false;
    cur.setDate(cur.getDate() + 1);
  }
  return true;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// ─── Tarjeta de alojamiento (reutilizable) ────────────────────────────────────

interface AloCardProps {
  alo: { nombre: string; tipo: string; disponible: boolean; max_por_reserva?: number };
  local: { image?: string; images?: string[]; features?: string[]; badge?: string; description?: string } | undefined;
  selected: boolean;
  esDiaSol?: boolean;
  maxPersonas?: number;
  onSelect: () => void;
  onLightbox: () => void;
}

function AloCard({ alo, local, selected, esDiaSol, maxPersonas, onSelect, onLightbox }: AloCardProps) {
  return (
    <button
      disabled={!alo.disponible}
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border overflow-hidden text-left transition-all flex flex-col",
        !alo.disponible
          ? "border-red-100 bg-red-50/40 cursor-not-allowed"
          : selected
            ? "border-[#607651] bg-white shadow-md ring-1 ring-[#607651]/20"
            : "border-gray-200 bg-white hover:border-[#607651]/50 hover:shadow-md cursor-pointer"
      )}
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-gray-100 shrink-0">
        {local?.image ? (
          <img
            src={local.image}
            alt={alo.nombre}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
              !alo.disponible && "grayscale opacity-50"
            )}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MapPin size={24} className="text-gray-400" />
          </div>
        )}

        {/* Overlay con botón expandir */}
        {alo.disponible && local?.image && (
          <button
            onClick={(e) => { e.stopPropagation(); onLightbox(); }}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Expand size={11} /> Ver fotos
            </span>
          </button>
        )}

        {/* Badge tipo */}
        <span
          className="absolute top-3 left-3 bg-white/90 text-[#607651] text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {esDiaSol ? "Día de Sol" : alo.tipo}
        </span>

        {/* Badge disponibilidad */}
        <span
          className={cn(
            "absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            alo.disponible ? "bg-[#607651] text-white" : "bg-red-500 text-white"
          )}
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {alo.disponible ? "Disponible" : "Ocupado"}
        </span>

        {/* Check de seleccionado */}
        {selected && alo.disponible && (
          <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#607651] flex items-center justify-center shadow">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className={cn("font-semibold text-base mb-1 leading-snug", !alo.disponible ? "text-gray-400" : "text-[#284735]")}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {alo.nombre}
        </h3>

        {esDiaSol && maxPersonas && (
          <p className="text-[11px] text-gray-400 mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
            Máx. {maxPersonas} personas por reserva
          </p>
        )}

        {local?.features && alo.disponible && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {local.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ReservaPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const alojamientoParam = searchParams.get("alojamiento") ?? "";

  const [modoVista, setModoVista] = useState<"fecha" | "alojamiento">(
    alojamientoParam ? "alojamiento" : "fecha"
  );
  const [indicativo, setIndicativo] = useState("+57");

  const [form, setForm] = useState({
    hospedaje: alojamientoParam,
    check_in: "",
    check_out: "",
    nombre_huesped: "",
    cedula_huesped: "",
    email_huesped: "",
    telefono_huesped: "",
    numero_huespedes: "2",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const alosRef = useRef<HTMLDivElement>(null);

  const [datosGenerales, setDatosGenerales] = useState<AloData[] | undefined>(undefined);
  const [loadingGeneral, setLoadingGeneral] = useState(false);

  // Carga datos generales para modo "por fecha"
  useEffect(() => {
    if (modoVista !== "fecha") return;
    if (datosGenerales) return;
    setLoadingGeneral(true);
    reservaPublicaAPI.disponibilidadGeneral()
      .then((data) => setDatosGenerales(data.alojamientos ?? []))
      .catch(() => setDatosGenerales([]))
      .finally(() => setLoadingGeneral(false));
  }, [modoVista, datosGenerales]);

  useEffect(() => {
    if (modoVista !== "fecha" || !form.check_in) return;
    const timer = setTimeout(() => {
      alosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [form.check_in, form.check_out, modoVista]);

  const nights = nightsBetween(form.check_in, form.check_out);

  const esSingleDaySelected = form.check_in === form.check_out && !!form.check_in;

  // Día de Sol aparece cuando hay fecha seleccionada (con o sin check_out)
  const diaSolDisponible = datosGenerales && form.check_in
    ? datosGenerales
        .filter((alo) => alo.es_dia_de_sol)
        .map((alo) => ({
          ...alo,
          disponible: isAvailableForRange(alo, form.check_in, form.check_in),
        }))
    : [];

  // Alojamientos de noche: solo cuando hay rango (check_out > check_in)
  const alosDisponibles = datosGenerales && form.check_in && form.check_out && !esSingleDaySelected
    ? datosGenerales
        .filter((alo) => !alo.es_dia_de_sol)
        .map((alo) => ({
          ...alo,
          disponible: isAvailableForRange(alo, form.check_in, form.check_out),
        }))
    : [];

  const localDataFor = (nombre: string) =>
    accommodations.find((a) => normalize(a.name) === normalize(nombre));

  const selectedLocalData = localDataFor(form.hospedaje);
  const canSubmit = !!form.hospedaje && !!form.check_in && !!form.check_out;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRangeChange = (ci: string, co: string) => {
    setForm((p) => {
      const esDiaSol = normalize(p.hospedaje) === "dia de sol";
      return {
        ...p,
        check_in: ci,
        // Día de Sol: siempre mismo día independientemente de lo que envíe el calendario
        check_out: esDiaSol ? ci : co,
        hospedaje: modoVista === "fecha" ? "" : p.hospedaje,
      };
    });
  };

  const cambiarModo = (modo: "fecha" | "alojamiento") => {
    setModoVista(modo);
    setForm((p) => ({ ...p, hospedaje: "", check_in: "", check_out: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await reservaPublicaAPI.crearPublica({
        ...form,
        telefono_huesped: `${indicativo}${form.telefono_huesped.replace(/^\+?\d{1,3}/, "").trim()}`,
        numero_huespedes: Number(form.numero_huespedes),
      });
      setExito(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:border-[#607651] focus:ring-2 focus:ring-[#607651]/10 transition-all";
  const labelCls = "block text-[#607651] text-[10px] tracking-[0.2em] uppercase font-semibold mb-1.5";

  // ─── ÉXITO ───────────────────────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#607651]/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[#607651]" />
          </div>
          <h2
            className="text-[#284735] text-2xl font-semibold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ¡Solicitud enviada!
          </h2>
          <p className="text-gray-500 text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span className="text-[#284735] font-medium">{form.hospedaje}</span>
            {" · "}
            {formatDateLong(form.check_in)}
            {" → "}
            {formatDateLong(form.check_out)}
          </p>
          <p className="text-gray-400 text-sm mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {normalize(form.hospedaje) === "dia de sol"
              ? `1 día · ${form.numero_huespedes} ${Number(form.numero_huespedes) === 1 ? "persona" : "personas"}`
              : `${nights} ${nights === 1 ? "noche" : "noches"} · ${form.numero_huespedes} ${Number(form.numero_huespedes) === 1 ? "huésped" : "huéspedes"}`}
          </p>
          <p
            className="text-gray-500 text-sm leading-relaxed mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Tu reserva quedó en estado{" "}
            <span className="text-amber-600 font-medium">Pendiente</span>. El equipo de Natural Sound revisará la disponibilidad y se pondrá en contacto pronto.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#607651] hover:bg-[#4e6142] text-white px-8 py-3 rounded-full text-sm font-medium transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Barra superior ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            {/* Logo para fondo claro — sube tu imagen en: public/images/logo-light.png */}
            <img
              src="/images/logo-light.png"
              alt="Natural Sound"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Mientras no exista logo-light.png, muestra texto
                (e.target as HTMLImageElement).style.display = "none";
                const span = document.createElement("span");
                span.textContent = "Natural Sound";
                span.style.fontFamily = "'Playfair Display', serif";
                span.style.color = "#284735";
                span.style.fontSize = "18px";
                span.style.fontWeight = "600";
                (e.target as HTMLImageElement).parentElement?.appendChild(span);
              }}
            />
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#284735] text-sm transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </a>
        </div>
      </header>

      {/* ── Título ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <p
            className="text-[#607651] text-[10px] tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Natural Sound — Reservas
          </p>
          <h1
            className="text-[#284735] text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Solicita tu reserva
          </h1>
          <p
            className="text-gray-500 text-sm mt-2"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Elige tus fechas y alojamiento. Nos pondremos en contacto para confirmar.
          </p>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">

          {/* ══ COLUMNA IZQUIERDA — Calendario ══ */}
          <div className="space-y-5">

            {/* Toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-1.5 flex shadow-sm">
              {(["fecha", "alojamiento"] as const).map((modo) => (
                <button
                  key={modo}
                  onClick={() => cambiarModo(modo)}
                  className={cn(
                    "flex-1 py-2.5 text-sm rounded-xl transition-all font-medium",
                    modoVista === modo
                      ? "bg-[#607651] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {modo === "fecha" ? "Buscar por fecha" : "Buscar por alojamiento"}
                </button>
              ))}
            </div>

            {/* ── POR ALOJAMIENTO ── */}
            {modoVista === "alojamiento" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Alojamiento
                  </label>
                  <select
                    name="hospedaje"
                    value={form.hospedaje}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, hospedaje: e.target.value, check_in: "", check_out: "" }))
                    }
                    className={inputCls}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <option value="">Selecciona un alojamiento</option>
                    {accommodations.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Vista previa del alojamiento seleccionado */}
                {form.hospedaje && selectedLocalData && (
                  <div className="flex gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <button
                      onClick={() => setLightbox(form.hospedaje)}
                      className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden group/prev"
                    >
                      <img
                        src={selectedLocalData.image}
                        alt={selectedLocalData.name}
                        className="w-full h-full object-cover group-hover/prev:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/prev:bg-black/30 flex items-center justify-center transition-all">
                        <Expand size={16} className="text-white opacity-0 group-hover/prev:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    <div>
                      <p className="text-[#284735] font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {selectedLocalData.name}
                      </p>
                      <p className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {selectedLocalData.type}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedLocalData.features.slice(0, 3).map((f) => (
                          <span key={f} className="text-[10px] bg-[#607651]/10 text-[#607651] px-2 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <CalendarioPublico
                    alojamiento={form.hospedaje}
                    checkIn={form.check_in}
                    checkOut={form.check_out}
                    onRangeChange={handleRangeChange}
                  />
                </div>
              </div>
            )}

            {/* ── POR FECHA ── */}
            {modoVista === "fecha" && (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <CalendarioPublico
                    datosGenerales={datosGenerales}
                    loadingGeneral={loadingGeneral}
                    checkIn={form.check_in}
                    checkOut={form.check_out}
                    onRangeChange={handleRangeChange}
                  />
                </div>

                {/* ── Anchor para scroll al seleccionar fecha ── */}
                <div ref={alosRef} />

                {/* ── Grid de alojamientos disponibles (por fecha, rango de noches) ── */}
                {form.check_in && form.check_out && alosDisponibles.length > 0 && (
                  <div>
                    <p className="text-[#607651] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      Alojamientos · {formatDateLong(form.check_in)} → {formatDateLong(form.check_out)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alosDisponibles.map((alo) => (
                        <AloCard
                          key={alo.nombre}
                          alo={alo}
                          local={localDataFor(alo.nombre)}
                          selected={form.hospedaje === alo.nombre}
                          onSelect={() => alo.disponible && setForm((p) => ({ ...p, hospedaje: alo.nombre }))}
                          onLightbox={() => setLightbox(alo.nombre)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Grid Día de Sol ── */}
                {diaSolDisponible.length > 0 && (
                  <div>
                    <p className="text-[#607651] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      Día de Sol · {formatDateLong(form.check_in)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {diaSolDisponible.map((alo) => (
                        <AloCard
                          key={alo.nombre}
                          alo={alo}
                          local={localDataFor(alo.nombre)}
                          selected={form.hospedaje === alo.nombre}
                          esDiaSol
                          maxPersonas={alo.max_por_reserva ?? 8}
                          onSelect={() => {
                            if (alo.disponible) setForm((p) => ({ ...p, hospedaje: alo.nombre, check_out: p.check_in }));
                          }}
                          onLightbox={() => setLightbox(alo.nombre)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {form.check_in && !form.check_out && (
                  <p className="text-center text-gray-400 text-sm py-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Para estadía de varias noches, selecciona la fecha de salida
                  </p>
                )}
              </>
            )}
          </div>

          {/* ══ COLUMNA DERECHA — Formulario ══ */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Resumen de la selección */}
              <div className="px-6 py-5 border-b border-gray-100">
                <p
                  className="text-[#607651] text-[10px] tracking-[0.2em] uppercase font-semibold mb-3"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Tu reserva
                </p>

                {form.hospedaje ? (
                  <div className="flex gap-3 items-start">
                    {selectedLocalData?.image && (
                      <img
                        src={selectedLocalData.image}
                        alt={form.hospedaje}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div>
                      <p
                        className="text-[#284735] font-semibold text-sm leading-snug"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {form.hospedaje}
                      </p>
                      {form.check_in && form.check_out ? (
                        <>
                          <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {formatDateLong(form.check_in)}
                          </p>
                          <p className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {formatDateLong(form.check_out)}
                          </p>
                          <p
                            className="text-[#607651] text-xs font-semibold mt-1"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {normalize(form.hospedaje) === "dia de sol"
                              ? "Día de Sol · 1 día"
                              : `${nights} ${nights === 1 ? "noche" : "noches"}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          <CalendarDays size={11} />
                          Selecciona las fechas
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CalendarDays size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {modoVista === "fecha"
                        ? "Selecciona fechas y un alojamiento"
                        : "Elige un alojamiento y tus fechas"}
                    </p>
                  </div>
                )}
              </div>

              {/* Formulario de datos personales */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <p
                  className="text-[#607651] text-[10px] tracking-[0.2em] uppercase font-semibold"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Tus datos
                </p>

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Nombre completo
                  </label>
                  <input
                    type="text" name="nombre_huesped" value={form.nombre_huesped}
                    onChange={handleChange} required placeholder="Tu nombre completo"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Cédula
                  </label>
                  <input
                    type="text" name="cedula_huesped" value={form.cedula_huesped}
                    onChange={handleChange} required placeholder="Número de cédula"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Email
                  </label>
                  <input
                    type="email" name="email_huesped" value={form.email_huesped}
                    onChange={handleChange} required placeholder="correo@ejemplo.com"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    WhatsApp
                  </label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#607651] focus-within:ring-2 focus-within:ring-[#607651]/10 transition-all bg-white">
                    {/* Selector de indicativo — ancho fijo, muestra solo bandera + código */}
                    <select
                      value={indicativo}
                      onChange={(e) => setIndicativo(e.target.value)}
                      className="w-[96px] shrink-0 bg-gray-50 border-r border-gray-200 text-gray-700 text-sm pl-2 pr-1 py-3 focus:outline-none cursor-pointer"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {[
                        { code: "+57",  flag: "🇨🇴", name: "Colombia" },
                        { code: "+1",   flag: "🇺🇸", name: "EE.UU." },
                        { code: "+52",  flag: "🇲🇽", name: "México" },
                        { code: "+54",  flag: "🇦🇷", name: "Argentina" },
                        { code: "+55",  flag: "🇧🇷", name: "Brasil" },
                        { code: "+56",  flag: "🇨🇱", name: "Chile" },
                        { code: "+51",  flag: "🇵🇪", name: "Perú" },
                        { code: "+58",  flag: "🇻🇪", name: "Venezuela" },
                        { code: "+593", flag: "🇪🇨", name: "Ecuador" },
                        { code: "+507", flag: "🇵🇦", name: "Panamá" },
                        { code: "+34",  flag: "🇪🇸", name: "España" },
                        { code: "+44",  flag: "🇬🇧", name: "Reino Unido" },
                      ].map(({ code, flag, name }) => (
                        <option key={code} value={code} title={name}>
                          {flag} {code}
                        </option>
                      ))}
                    </select>
                    {/* Número sin indicativo */}
                    <input
                      type="tel"
                      name="telefono_huesped"
                      value={form.telefono_huesped}
                      onChange={handleChange}
                      required
                      placeholder="300 000 0000"
                      className="flex-1 min-w-0 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-white"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Número de huéspedes
                    {normalize(form.hospedaje) === "dia de sol" && (
                      <span className="ml-2 text-amber-500 font-normal normal-case tracking-normal text-[10px]">
                        (máx. 8 por reserva)
                      </span>
                    )}
                  </label>
                  <input
                    type="number" name="numero_huespedes" value={form.numero_huespedes}
                    onChange={handleChange} min="1"
                    max={normalize(form.hospedaje) === "dia de sol" ? "8" : "20"}
                    required
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className={cn(
                    "w-full py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    canSubmit
                      ? "bg-[#607651] hover:bg-[#4e6142] text-white shadow-sm hover:shadow"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {loading ? (
                    <><Loader size={14} className="animate-spin" /> Enviando...</>
                  ) : !canSubmit ? (
                    !form.hospedaje ? "Selecciona un alojamiento" :
                    !form.check_in || !form.check_out ? "Selecciona las fechas" :
                    "Completa tus datos"
                  ) : (
                    "Enviar solicitud de reserva"
                  )}
                </button>

                <p
                  className="text-center text-gray-400 text-[11px]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Tu reserva quedará en estado Pendiente hasta ser confirmada.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ── Lightbox de alojamiento ── */}
      {lightbox && (() => {
        const aloLocal = accommodations.find((a) => normalize(a.name) === normalize(lightbox));
        const aloData = alosDisponibles.find((a) => normalize(a.nombre) === normalize(lightbox));
        if (!aloLocal) return null;
        return (
          <AccommodationLightbox
            accommodation={aloLocal}
            disponible={aloData?.disponible ?? true}
            isSelected={form.hospedaje === lightbox}
            onClose={() => setLightbox(null)}
            onSelect={() => setForm((p) => ({ ...p, hospedaje: lightbox }))}
          />
        );
      })()}
    </div>
  );
}
