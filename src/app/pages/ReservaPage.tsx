import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, AlertCircle, Loader, CalendarDays, MapPin, Expand, Info, MessageCircle, Clock } from "lucide-react";
import { accommodations } from "../data/accommodations";
import { reservaPublicaAPI } from "../../services/api";
import { CalendarioPublico, type AloData } from "../components/sections/CalendarioPublico";
import { AccommodationLightbox } from "../components/sections/AccommodationLightbox";
import { cn } from "../components/ui/utils";
import { precioTotal, tarifasBase, formatCOP, tieneTarifa, precioServicio } from "../data/pricing";

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

function buildWaUrl(
  hospedaje: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  huespedes: string,
  servicio: string,
  total: number | null
): string {
  const esDiaSol = normalize(hospedaje) === "dia de sol";
  const lines = [
    `Hola! Acabo de solicitar una reserva en Natural Sound 🌿`,
    ``,
    `🏡 *${hospedaje}*`,
    `📅 Llegada: ${formatDateLong(checkIn)}`,
    ...(!esDiaSol ? [`🚪 Salida: ${formatDateLong(checkOut)}`] : []),
    esDiaSol
      ? `👥 ${huespedes} ${Number(huespedes) === 1 ? "persona" : "personas"}`
      : `🌙 ${nights} ${nights === 1 ? "noche" : "noches"} · ${huespedes} ${Number(huespedes) === 1 ? "huésped" : "huéspedes"}`,
    ...(servicio !== "N/A" ? [`✨ Servicio: ${servicio}`] : []),
    ...(total ? [`💰 Precio estimado: ${formatCOP(total)} COP`] : []),
    ``,
    `Quiero confirmar los detalles del pago.`,
  ];
  return `https://wa.me/573046643574?text=${encodeURIComponent(lines.join("\n"))}`;
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
            ? "border-[#8a6038] bg-white shadow-md ring-1 ring-[#8a6038]/20"
            : "border-gray-200 bg-white hover:border-[#8a6038]/50 hover:shadow-md cursor-pointer"
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
          className="absolute top-3 left-3 bg-white/90 text-[#8a6038] text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {esDiaSol ? "Día de Sol" : alo.tipo}
        </span>

        {/* Badge disponibilidad */}
        <span
          className={cn(
            "absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            alo.disponible ? "bg-[#8a6038] text-white" : "bg-red-500 text-white"
          )}
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {alo.disponible ? "Disponible" : "Ocupado"}
        </span>

        {/* Check de seleccionado */}
        {selected && alo.disponible && (
          <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#8a6038] flex items-center justify-center shadow">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className={cn("font-semibold text-base mb-1 leading-snug", !alo.disponible ? "text-gray-400" : "text-[#3d2010]")}
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

        {alo.disponible && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
            <Clock size={10} className="text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400" style={{ fontFamily: "'DM Mono', monospace" }}>
              {esDiaSol ? "Ingreso 9:00 AM – 6:00 PM" : "Check-in 3:00 PM · Check-out 12:00 PM"}
            </span>
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
    servicio_adicional: "N/A",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [huespedesAdicionales, setHuespedesAdicionales] = useState<Array<{ nombre: string; cedula: string }>>([]);
  const [tabActivo, setTabActivo] = useState(0);
  const alosRef = useRef<HTMLDivElement>(null);
  const prevNumHuespedesRef = useRef(1);

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
    if (modoVista !== "fecha") return;
    if (!form.check_out || form.check_out === form.check_in) return;
    const timer = setTimeout(() => {
      alosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [form.check_out, modoVista]);

  const numHuespedes = parseInt(form.numero_huespedes) || 1;

  useEffect(() => {
    const extra = Math.max(0, numHuespedes - 1);
    setHuespedesAdicionales(prev => {
      const next = [...prev];
      while (next.length < extra) next.push({ nombre: "", cedula: "" });
      return next.slice(0, extra);
    });
    if (numHuespedes > prevNumHuespedesRef.current) {
      // Huéspedes aumentaron: saltar al tab del nuevo acompañante
      setTabActivo(numHuespedes - 1);
    } else {
      setTabActivo(prev => Math.min(prev, Math.max(0, numHuespedes - 1)));
    }
    prevNumHuespedesRef.current = numHuespedes;
  }, [numHuespedes]);

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
  const isDiaDeSol = normalize(form.hospedaje) === "dia de sol";
  const huesped1Completo = !!form.nombre_huesped.trim() && !!form.cedula_huesped.trim() && !!form.email_huesped.trim() && !!form.telefono_huesped.trim();
  const adiccionalesCompletos = numHuespedes <= 1 || huespedesAdicionales.every(h => h.nombre.trim() && h.cedula.trim());
  const canSubmit = !!form.hospedaje && !!form.check_in && (isDiaDeSol || !!form.check_out) && huesped1Completo && adiccionalesCompletos;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRangeChange = (ci: string, co: string) => {
    setForm((p) => {
      if (modoVista === "fecha") {
        return { ...p, check_in: ci, check_out: co, hospedaje: "" };
      }
      const esDiaSol = normalize(p.hospedaje) === "dia de sol";
      return {
        ...p,
        check_in: ci,
        check_out: esDiaSol ? ci : co,
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
        check_out: isDiaDeSol ? form.check_in : form.check_out,
        telefono_huesped: (() => {
          const local = form.telefono_huesped.trim().replace(/^\+/, "");
          const codSin = indicativo.replace("+", "");
          return local.startsWith(codSin) ? `+${local}` : `${indicativo}${local}`;
        })(),
        numero_huespedes: Number(form.numero_huespedes),
        ...(huespedesAdicionales.length > 0 && { huespedes_adicionales: huespedesAdicionales }),
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
    "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:border-[#8a6038] focus:ring-2 focus:ring-[#8a6038]/10 transition-all";
  const labelCls = "block text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-1.5";

  // ─── ÉXITO ───────────────────────────────────────────────────────────────────
  if (exito) {
    const exitoTotal = tieneTarifa(form.hospedaje) && form.check_in && form.check_out
      ? precioTotal(form.hospedaje, form.check_in, form.check_out, Number(form.numero_huespedes))
      : null;
    const waUrl = buildWaUrl(
      form.hospedaje, form.check_in, form.check_out, nights,
      form.numero_huespedes, form.servicio_adicional, exitoTotal
    );
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#8a6038]/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[#8a6038]" />
          </div>
          <h2
            className="text-[#3d2010] text-2xl font-semibold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ¡Solicitud enviada!
          </h2>
          <p className="text-gray-500 text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span className="text-[#3d2010] font-medium">{form.hospedaje}</span>
            {" · "}
            {formatDateLong(form.check_in)}
            {" → "}
            {formatDateLong(form.check_out)}
          </p>
          <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {normalize(form.hospedaje) === "dia de sol"
              ? `1 día · ${form.numero_huespedes} ${Number(form.numero_huespedes) === 1 ? "persona" : "personas"}`
              : `${nights} ${nights === 1 ? "noche" : "noches"} · ${form.numero_huespedes} ${Number(form.numero_huespedes) === 1 ? "huésped" : "huéspedes"}`}
          </p>
          <p
            className="text-gray-500 text-sm leading-relaxed mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Tu reserva quedó en estado{" "}
            <span className="text-amber-600 font-medium">Pendiente</span>. Escríbenos por WhatsApp para coordinar el pago y confirmar tu reserva.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#7c4a28] hover:bg-[#c4813f] text-white px-7 py-3 rounded-full text-sm font-semibold transition-colors shadow-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <MessageCircle size={16} />
              Coordinar pago por WhatsApp
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-500 hover:text-[#3d2010] hover:border-[#8a6038]/40 px-7 py-3 rounded-full text-sm font-medium transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <ArrowLeft size={15} />
              Volver al inicio
            </a>
          </div>
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
            <img
              src="/images/skblack.png"
              alt="Natural Sound"
              className="h-10 w-auto object-contain"
            />
            <span
              className="text-lg font-semibold text-[#3d2010]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Natural Sound
            </span>
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#3d2010] text-sm transition-colors"
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
            className="text-[#8a6038] text-[10px] tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Natural Sound — Reservas
          </p>
          <h1
            className="text-[#3d2010] text-3xl md:text-4xl font-semibold"
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
                      ? "bg-[#8a6038] text-white shadow-sm"
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
                    onChange={(e) => {
                      const h = e.target.value;
                      const isDDS = normalize(h) === "dia de sol";
                      setForm((p) => ({ ...p, hospedaje: h, check_in: "", check_out: "", ...(isDDS ? { servicio_adicional: "N/A" } : {}) }));
                    }}
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
                      <p className="text-[#3d2010] font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {selectedLocalData.name}
                      </p>
                      <p className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {selectedLocalData.type}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedLocalData.features.slice(0, 3).map((f) => (
                          <span key={f} className="text-[10px] bg-[#8a6038]/10 text-[#8a6038] px-2 py-0.5 rounded-full">
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
                    <p className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      Alojamientos · {formatDateLong(form.check_in)} → {formatDateLong(form.check_out)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(form.hospedaje ? alosDisponibles.filter(a => a.nombre === form.hospedaje) : alosDisponibles).map((alo) => (
                        <AloCard
                          key={alo.nombre}
                          alo={alo}
                          local={localDataFor(alo.nombre)}
                          selected={form.hospedaje === alo.nombre}
                          onSelect={() => alo.disponible && setForm((p) => ({ ...p, hospedaje: p.hospedaje === alo.nombre ? "" : alo.nombre }))}
                          onLightbox={() => setLightbox(alo.nombre)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Grid Día de Sol ── oculto cuando hay rango de noches seleccionado */}
                {diaSolDisponible.length > 0 && !(form.check_out && form.check_out !== form.check_in) && (
                  <div>
                    <p className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      Día de Sol · {formatDateLong(form.check_in)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(form.hospedaje ? diaSolDisponible.filter(a => a.nombre === form.hospedaje) : diaSolDisponible).map((alo) => (
                        <AloCard
                          key={alo.nombre}
                          alo={alo}
                          local={localDataFor(alo.nombre)}
                          selected={form.hospedaje === alo.nombre}
                          esDiaSol
                          maxPersonas={alo.max_por_reserva ?? 8}
                          onSelect={() => {
                            if (alo.disponible) setForm((p) => ({
                              ...p,
                              hospedaje: p.hospedaje === alo.nombre ? "" : alo.nombre,
                              check_out: p.hospedaje === alo.nombre ? "" : p.check_in,
                              servicio_adicional: "N/A",
                            }));
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
                  className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-3"
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
                        className="text-[#3d2010] font-semibold text-sm leading-snug"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {form.hospedaje}
                      </p>
                      {form.check_in && (isDiaDeSol || form.check_out) ? (
                        <>
                          <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {formatDateLong(form.check_in)}
                          </p>
                          {!isDiaDeSol && (
                            <p className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                              {formatDateLong(form.check_out)}
                            </p>
                          )}
                          <p
                            className="text-[#8a6038] text-xs font-semibold mt-1"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {isDiaDeSol
                              ? "Día de Sol · 1 día"
                              : `${nights} ${nights === 1 ? "noche" : "noches"}`}
                          </p>
                          <p className="flex items-center gap-1 text-gray-400 text-[11px] mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                            <Clock size={10} className="shrink-0" />
                            {isDiaDeSol ? "Ingreso 9:00 AM – 6:00 PM" : "Check-in 3:00 PM · Check-out 12:00 PM"}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          <CalendarDays size={11} />
                          {isDiaDeSol ? "Selecciona la fecha" : "Selecciona las fechas"}
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

              {/* Bloque de precio estimado */}
              {form.hospedaje && form.check_in && form.check_out && normalize(form.hospedaje) !== "dia de sol" && tieneTarifa(form.hospedaje) && (() => {
                const g = Number(form.numero_huespedes);
                const alojamientoPrice = precioTotal(form.hospedaje, form.check_in, form.check_out, g);
                const servicioPrice = precioServicio(form.servicio_adicional);
                const totalPrice = alojamientoPrice + servicioPrice;
                const bases = tarifasBase(form.hospedaje, g)!;
                return (
                  <div className="px-6 py-4 border-b border-gray-100 bg-[#f9f2e8]">
                    <p className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-3"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      Precio estimado
                    </p>

                    {/* Desglose */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Alojamiento · {nights} {nights === 1 ? "noche" : "noches"}
                        </span>
                        <span className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {formatCOP(alojamientoPrice)}
                        </span>
                      </div>

                      {servicioPrice > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {form.servicio_adicional}
                          </span>
                          <span className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {formatCOP(servicioPrice)}
                          </span>
                        </div>
                      )}

                      {/* Total — siempre visible */}
                      <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#c4a07a]/30">
                        <span className="text-[#8a6038] text-xs font-semibold tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                          TOTAL
                        </span>
                        <span className="text-[#3d2010] text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {formatCOP(totalPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 text-[11px] text-gray-400 mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <span>Lun–Jue {formatCOP(bases.low)}/noche</span>
                      <span>·</span>
                      <span>Fin sem / festivo {formatCOP(bases.high)}/noche</span>
                    </div>
                    <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <Info size={11} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-amber-700 text-[10px] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Precio referencial en COP. Sujeto a cambios según disponibilidad y condiciones especiales.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Formulario de datos personales */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                {/* Header: tabs para múltiples huéspedes, etiqueta simple para uno solo */}
                {numHuespedes > 1 ? (
                  <div className="space-y-3">
                    <p
                      className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Datos de huéspedes
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.from({ length: numHuespedes }, (_, i) => {
                        const isIncomplete = i === 0
                          ? !form.nombre_huesped.trim() || !form.cedula_huesped.trim()
                          : !huespedesAdicionales[i - 1]?.nombre.trim() || !huespedesAdicionales[i - 1]?.cedula.trim();
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTabActivo(i)}
                            className={cn(
                              "flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                              tabActivo === i
                                ? "bg-[#8a6038] text-white shadow-sm border-[#8a6038]"
                                : isIncomplete
                                  ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                                  : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
                            )}
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {isIncomplete && tabActivo !== i && (
                              <AlertCircle size={12} className="text-amber-500 shrink-0" />
                            )}
                            Huésped {i + 1}
                            {!isIncomplete && tabActivo !== i && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Banner cuando hay acompañantes sin completar */}
                    {huespedesAdicionales.some(h => !h.nombre.trim() || !h.cedula.trim()) && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 mt-1">
                        <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-amber-700 text-xs font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            Completa los datos de tus acompañantes
                          </p>
                          <p className="text-amber-600 text-[11px] mt-0.5 leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            Selecciona cada tab de "Huésped" para ingresar nombre y cédula.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p
                    className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Tus datos
                  </p>
                )}

                {/* Huésped 1 — persona de contacto */}
                {(tabActivo === 0 || numHuespedes === 1) && (
                  <>
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
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#8a6038] focus-within:ring-2 focus-within:ring-[#8a6038]/10 transition-all bg-white">
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
                        <input
                          type="text"
                          inputMode="tel"
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
                  </>
                )}

                {/* Huéspedes adicionales */}
                {tabActivo > 0 && numHuespedes > 1 && (
                  <>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        required
                        value={huespedesAdicionales[tabActivo - 1]?.nombre ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHuespedesAdicionales(prev => {
                            const next = [...prev];
                            next[tabActivo - 1] = { ...next[tabActivo - 1], nombre: val };
                            return next;
                          });
                          setError("");
                        }}
                        placeholder="Nombre completo del acompañante"
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>

                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Cédula
                      </label>
                      <input
                        type="text"
                        required
                        value={huespedesAdicionales[tabActivo - 1]?.cedula ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHuespedesAdicionales(prev => {
                            const next = [...prev];
                            next[tabActivo - 1] = { ...next[tabActivo - 1], cedula: val };
                            return next;
                          });
                          setError("");
                        }}
                        placeholder="Número de cédula del acompañante"
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Info size={11} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-gray-400 text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Solo se requiere nombre y cédula para los acompañantes.
                      </p>
                    </div>
                  </>
                )}

                {(tabActivo === 0 || numHuespedes === 1) && (
                  <>
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

                    {normalize(form.hospedaje) !== "dia de sol" && (
                      <div>
                        <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                          Servicio adicional
                        </label>
                        <select
                          name="servicio_adicional"
                          value={form.servicio_adicional}
                          onChange={handleChange}
                          className={inputCls}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <option value="N/A">Sin servicio adicional</option>
                          <option value="Desayuno termal">Desayuno termal</option>
                          <option value="Cumpleaños">Cumpleaños</option>
                          <option value="Aniversario">Aniversario</option>
                          <option value="Quieres ser mi novia">¿Quieres ser mi novia?</option>
                          <option value="Te amo">Te amo</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

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
                      ? "bg-[#8a6038] hover:bg-[#7a4c28] text-white shadow-sm hover:shadow"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {loading ? (
                    <><Loader size={14} className="animate-spin" /> Enviando...</>
                  ) : !canSubmit ? (
                    !form.hospedaje ? "Selecciona un alojamiento" :
                    !form.check_in || (!isDiaDeSol && !form.check_out) ? "Selecciona las fechas" :
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
            checkIn={form.check_in}
            checkOut={form.check_out}
            nights={nights}
            onClose={() => setLightbox(null)}
            onSelect={() => setForm((p) => ({ ...p, hospedaje: lightbox }))}
          />
        );
      })()}
    </div>
  );
}
