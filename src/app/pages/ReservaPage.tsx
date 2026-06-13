import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, CheckCircle, AlertCircle, Loader, CalendarDays, MapPin, Expand, Info, MessageCircle, Clock } from "lucide-react";
import { accommodations } from "../data/accommodations";
import { reservaPublicaAPI } from "../../services/api";
import { CalendarioPublico, type AloData, type Rango } from "../components/sections/CalendarioPublico";
import { AccommodationLightbox } from "../components/sections/AccommodationLightbox";
import { cn } from "../components/ui/utils";
import { precioTotal, tarifasBase, tarifasZafiroTiers, formatCOP, tieneTarifa, precioServicio, serviciosDisponibles, servicioRequiereColor, servicioTieneMensaje, COLORES_DECORACION, labelServicio, maxHuespedes, minHuespedes } from "../data/pricing";
import { INDICATIVOS } from "../data/indicativos";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocal(str: string): Date {
  const s = str.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
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

function isBlockedByPrivateEvent(eventosPrivados: Rango[], checkIn: string, checkOut: string): boolean {
  const startDate = parseLocal(checkIn);
  const isSingleDay = checkIn === checkOut;
  const endDate = isSingleDay ? startDate : parseLocal(checkOut);
  return eventosPrivados.some(ep => {
    const ci = parseLocal(ep.check_in);
    const co = parseLocal(ep.check_out);
    if (isSingleDay) return startDate >= ci && startDate < co;
    return startDate < co && endDate > ci;
  });
}

function isAvailableForRange(alo: AloData, ci: string, co: string): boolean {
  if (!ci || !co) return false;
  
  if (alo.es_dia_de_sol) {
    const date = parseLocal(ci);
    const esDomingo = date.getDay() === 0;
    const cap = esDomingo ? (alo.capacidad_domingo ?? 30) : (alo.capacidad_semana ?? 25);
    const reservasDia = alo.reservas.filter((r) => r.check_in.slice(0, 10) === ci.slice(0, 10));
    const total = reservasDia.reduce((acc, r) => acc + ((r as { numero_huespedes?: number }).numero_huespedes ?? 0), 0);
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
  total: number | null,
  numeroReserva: number | null = null
): string {
  const esDiaSol = normalize(hospedaje) === "dia de sol";
  const lines = [
    `Hola! Acabo de solicitar una reserva en Natural Sound`,
    ``,
    ...(numeroReserva ? [`*Reserva #${numeroReserva}*`] : []),
    `*${hospedaje}*`,
    `Llegada: ${formatDateLong(checkIn)}`,
    ...(!esDiaSol ? [`Salida: ${formatDateLong(checkOut)}`] : []),
    esDiaSol
      ? `${huespedes} ${Number(huespedes) === 1 ? "persona" : "personas"}`
      : `${nights} ${nights === 1 ? "noche" : "noches"} · ${huespedes} ${Number(huespedes) === 1 ? "huésped" : "huéspedes"}`,
    ...(servicio !== "N/A" ? [`Servicio: ${servicio}`] : []),
    ...(total ? [`Precio estimado: ${formatCOP(total)} COP`] : []),
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
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onLightbox(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onLightbox(); } }}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Expand size={11} /> Ver fotos
            </span>
          </div>
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
    numero_habitacion: "",
    observacion: "",
  });
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    Array<{ servicio: string; color: string; mensaje: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [numeroReserva, setNumeroReserva] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [huespedesAdicionales, setHuespedesAdicionales] = useState<Array<{ nombre: string; cedula: string; email: string; celular: string }>>([]);
  const [tabActivo, setTabActivo] = useState(0);
  const alosRef = useRef<HTMLDivElement>(null);
  const prevNumHuespedesRef = useRef(2);

  const [datosGenerales, setDatosGenerales] = useState<AloData[] | undefined>(undefined);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [eventosPrivados, setEventosPrivados] = useState<Rango[]>([]);

  // Carga datos generales para ambos modos
  useEffect(() => {
    if (datosGenerales) return;
    setLoadingGeneral(true);
    reservaPublicaAPI.disponibilidadGeneral()
      .then((data) => {
        setDatosGenerales(data.alojamientos ?? []);
        setEventosPrivados(Array.isArray(data.eventos_privados) ? data.eventos_privados : []);
      })
      .catch(() => setDatosGenerales([]))
      .finally(() => setLoadingGeneral(false));
  }, [datosGenerales]);

  useEffect(() => {
    setServiciosSeleccionados([]);
    const n = normalize(form.hospedaje);
    setForm(p => ({
      ...p,
      numero_habitacion: n.includes("cuadruple") ? "5" : "",
    }));
  }, [form.hospedaje]);

  useEffect(() => {
    if (modoVista !== "fecha") return;
    if (!form.check_out || form.check_out === form.check_in) return;
    const timer = setTimeout(() => {
      alosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [form.check_out, modoVista]);

  const numHuespedes = parseInt(form.numero_huespedes) || 1;
  const minH = minHuespedes(form.hospedaje, form.check_in || undefined);

  // Auto-corrige número de huéspedes si cae por debajo del mínimo requerido
  useEffect(() => {
    if (numHuespedes < minH) {
      setForm(p => ({ ...p, numero_huespedes: String(minH) }));
      setTabActivo(0);
    }
  }, [form.hospedaje, form.check_in]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const extra = Math.max(0, numHuespedes - 1);
    setHuespedesAdicionales(prev => {
      const next = [...prev];
      while (next.length < extra) next.push({ nombre: "", cedula: "", email: "", celular: "" });
      return next.slice(0, extra);
    });
    if (numHuespedes < prevNumHuespedesRef.current) {
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
          disponible: !isBlockedByPrivateEvent(eventosPrivados, form.check_in, form.check_in) && isAvailableForRange(alo, form.check_in, form.check_in),
        }))
    : [];

  // Alojamientos de noche: solo cuando hay rango (check_out > check_in)
  const alosDisponibles = datosGenerales && form.check_in && form.check_out && !esSingleDaySelected
    ? datosGenerales
        .filter((alo) => !alo.es_dia_de_sol)
        .map((alo) => ({
          ...alo,
          disponible: !isBlockedByPrivateEvent(eventosPrivados, form.check_in, form.check_out) && isAvailableForRange(alo, form.check_in, form.check_out),
        }))
    : [];

  const localDataFor = (nombre: string) =>
    accommodations.find((a) => normalize(a.name) === normalize(nombre));

  const selectedLocalData = localDataFor(form.hospedaje);
  const isDiaDeSol = normalize(form.hospedaje) === "dia de sol";
  const serviciosAlo = serviciosDisponibles(form.hospedaje);
  const precioTotalServicios = serviciosSeleccionados.reduce(
    (acc, x) => acc + precioServicio(form.hospedaje, x.servicio, numHuespedes), 0
  );
  const colorRequerido = serviciosSeleccionados.some(
    x => servicioRequiereColor(x.servicio) && !x.color
  );
  const esHabitacion = normalize(form.hospedaje).includes("pareja") || normalize(form.hospedaje).includes("cuadruple");

  // Rooms already taken for the selected date range (based on admin-assigned room numbers)
  const habitacionesOcupadas = useMemo(() => {
    if (!form.check_in || !form.check_out || !datosGenerales) return [];
    const parejaData = datosGenerales.find(alo => normalize(alo.nombre).includes("pareja"));
    if (!parejaData) return [];
    const ci = form.check_in;
    const co = form.check_out;
    return parejaData.reservas
      .filter(r => r.numero_habitacion && r.check_in < co && r.check_out > ci)
      .map(r => r.numero_habitacion!);
  }, [datosGenerales, form.check_in, form.check_out]);

  // Reset room selection if it becomes occupied when dates change
  useEffect(() => {
    if (form.numero_habitacion && habitacionesOcupadas.includes(form.numero_habitacion)) {
      setForm(p => ({ ...p, numero_habitacion: "" }));
    }
  }, [habitacionesOcupadas]); // eslint-disable-line react-hooks/exhaustive-deps

  const huesped1Completo = !!form.nombre_huesped.trim() && !!form.cedula_huesped.trim() && !!form.email_huesped.trim() && !!form.telefono_huesped.trim();
  const adiccionalesCompletos = numHuespedes <= 1 || huespedesAdicionales.every(h => h.nombre?.trim() && h.cedula?.trim() && h.email?.trim() && h.celular?.trim());
  const canSubmit = !!form.hospedaje && !!form.check_in && (isDiaDeSol || !!form.check_out) && huesped1Completo && adiccionalesCompletos && !colorRequerido && (!esHabitacion || !!form.numero_habitacion) && numHuespedes >= minH;

  const toggleServicio = (s: string) => {
    setServiciosSeleccionados(prev => {
      const exists = prev.some(x => x.servicio === s);
      if (exists) return prev.filter(x => x.servicio !== s);
      return [...prev, { servicio: s, color: "", mensaje: "" }];
    });
  };

  const setColorServicio = (s: string, color: string) => {
    setServiciosSeleccionados(prev =>
      prev.map(x => x.servicio === s ? { ...x, color } : x)
    );
  };

  const setMensajeServicio = (s: string, mensaje: string) => {
    setServiciosSeleccionados(prev =>
      prev.map(x => x.servicio === s ? { ...x, mensaje } : x)
    );
  };

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
      const servicioLabel = serviciosSeleccionados.length > 0
        ? serviciosSeleccionados.map(x => labelServicio(x.servicio)).join(", ")
        : "N/A";
      const checkOutFinal = isDiaDeSol ? form.check_in : form.check_out;
      const valorAlojamiento = precioTotal(form.hospedaje, form.check_in, checkOutFinal, numHuespedes);
      const tipoHospedajePublico = datosGenerales?.find(a => a.nombre === form.hospedaje)?.tipo
        ?? (normalize(form.hospedaje).includes("dia de sol") ? "Día de Sol"
          : normalize(form.hospedaje).includes("habitacion") ? "Habitación"
          : "Glamping");
      const resp = await reservaPublicaAPI.crearPublica({
        ...form,
        check_out: checkOutFinal,
        telefono_huesped: (() => {
          const local = form.telefono_huesped.trim().replace(/^\+/, "");
          const codSin = indicativo.replace("+", "");
          return local.startsWith(codSin) ? `+${local}` : `${indicativo}${local}`;
        })(),
        numero_huespedes: Number(form.numero_huespedes),
        servicio_adicional: servicioLabel,
        color_decoracion: serviciosSeleccionados.find(x => x.color)?.color ?? "",
        mensaje_decoracion: serviciosSeleccionados.find(x => x.mensaje)?.mensaje ?? "",
        valor_alojamiento: valorAlojamiento,
        valor_servicio_adicional: precioTotalServicios,
        tipo_hospedaje: tipoHospedajePublico,
        ...(serviciosSeleccionados.length > 0 && {
          servicios_adicionales: serviciosSeleccionados.map(x => ({
            nombre: x.servicio,
            label: labelServicio(x.servicio),
            color: x.color || null,
            mensaje: x.mensaje || null,
            precio: precioServicio(form.hospedaje, x.servicio, numHuespedes),
          })),
        }),
        ...(huespedesAdicionales.length > 0 && { huespedes_adicionales: huespedesAdicionales }),
      });
      setNumeroReserva(resp?.numero_reserva ?? null);
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
      ? precioTotal(form.hospedaje, form.check_in, form.check_out, Number(form.numero_huespedes)) + precioTotalServicios
      : null;
    const exitoServicio = serviciosSeleccionados.length > 0
      ? serviciosSeleccionados.map(x => labelServicio(x.servicio)).join(", ")
      : "N/A";
    const waUrl = buildWaUrl(
      form.hospedaje, form.check_in, form.check_out, nights,
      form.numero_huespedes, exitoServicio, exitoTotal, numeroReserva
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
      <header className="bg-[#1a100a] border-b border-[#3d2010]/40 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/images/sk.png"
              alt="Natural Sound"
              className="h-10 w-auto object-contain"
            />
            <span
              className="text-lg font-semibold text-[#e8d5b7]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Natural Sound
            </span>
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-[#c4a07a] hover:text-[#e8d5b7] text-sm transition-colors"
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
              <>
              {/* Collapsed: solo dropdown cuando no hay alojamiento; expanded: dropdown + calendario */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className={cn("px-6 pt-5 pb-5", form.hospedaje && "border-b border-gray-100 pb-4")}>
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

                {/* Vista previa + calendario: solo cuando hay alojamiento seleccionado */}
                {form.hospedaje && (
                  <>
                    {selectedLocalData && (
                      <div className="flex gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <button
                          onClick={() => setLightbox(form.hospedaje)}
                          className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden group/prev"
                        >
                          <img
                            src={selectedLocalData.image}
                            alt={selectedLocalData.name}
                            className="w-full h-full object-cover group-hover/prev:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/prev:bg-black/30 flex items-center justify-center transition-all">
                            <Expand size={14} className="text-white opacity-0 group-hover/prev:opacity-100 transition-opacity" />
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
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
                        <button
                          onClick={() => setForm(p => ({ ...p, hospedaje: "", check_in: "", check_out: "" }))}
                          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors self-start"
                          title="Cambiar alojamiento"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
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
                  </>
                )}
              </div>

              {/* Cards de alojamientos en modo por alojamiento */}
              {(() => {
                if (!datosGenerales) return null;

                const hasRange = form.check_in && form.check_out && !esSingleDaySelected;
                const hasDay = !!form.check_in;

                // Separar glamping y día de sol del catálogo
                const todosGlamping = datosGenerales.filter(a => !a.es_dia_de_sol);
                const todosDiaSol = datosGenerales.filter(a => a.es_dia_de_sol);

                // Función para calcular disponibilidad si hay fechas, o true si no hay
                const conDisp = (list: typeof datosGenerales, ci: string, co: string) =>
                  list.map(a => ({
                    ...a,
                    disponible: (ci && co) ? (!isBlockedByPrivateEvent(eventosPrivados, ci, co) && isAvailableForRange(a, ci, co)) : true,
                  }));

                const isDDS = normalize(form.hospedaje) === "dia de sol";

                // Si hay alojamiento seleccionado, solo mostrar ese; si no, mostrar todos
                const glampingCards = conDisp(
                  form.hospedaje && !isDDS
                    ? todosGlamping.filter(a => normalize(a.nombre) === normalize(form.hospedaje))
                    : todosGlamping,
                  form.check_in, hasRange ? form.check_out : ""
                );

                const diaSolCards = conDisp(
                  form.hospedaje && isDDS
                    ? todosDiaSol.filter(a => normalize(a.nombre) === normalize(form.hospedaje))
                    : todosDiaSol,
                  form.check_in, form.check_in
                );

                const labelFechas = hasRange
                  ? `${formatDateLong(form.check_in)} → ${formatDateLong(form.check_out)}`
                  : hasDay
                    ? formatDateLong(form.check_in)
                    : null;

                return (
                  <div className="space-y-6">
                    {/* Glamping */}
                    {glampingCards.length > 0 && (
                      <div>
                        <p className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                          style={{ fontFamily: "'DM Mono', monospace" }}>
                          Alojamientos{labelFechas ? ` · ${labelFechas}` : ""}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...glampingCards].sort((a, b) => Number(b.disponible) - Number(a.disponible)).map(alo => (
                            <AloCard
                              key={alo.nombre}
                              alo={alo}
                              local={localDataFor(alo.nombre)}
                              selected={form.hospedaje === alo.nombre}
                              onSelect={() => {
                                if (!alo.disponible) return;
                                setForm(p => ({
                                  ...p,
                                  hospedaje: p.hospedaje === alo.nombre ? "" : alo.nombre,
                                  servicio_adicional: "N/A",
                                }));
                              }}
                              onLightbox={() => setLightbox(alo.nombre)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Día de Sol */}
                    {diaSolCards.length > 0 && (
                      <div>
                        <p className="text-[#8a6038] text-[10px] tracking-[0.2em] uppercase font-semibold mb-4"
                          style={{ fontFamily: "'DM Mono', monospace" }}>
                          Día de Sol{hasDay ? ` · ${formatDateLong(form.check_in)}` : ""}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...diaSolCards].sort((a, b) => Number(b.disponible) - Number(a.disponible)).map(alo => (
                            <AloCard
                              key={alo.nombre}
                              alo={alo}
                              local={localDataFor(alo.nombre)}
                              selected={form.hospedaje === alo.nombre}
                              esDiaSol
                              maxPersonas={alo.max_por_reserva ?? 8}
                              onSelect={() => {
                                if (!alo.disponible) return;
                                setForm(p => ({
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
                  </div>
                );
              })()}
              </>
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
                    eventosPrivados={eventosPrivados}
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
                      {(form.hospedaje ? alosDisponibles.filter(a => a.nombre === form.hospedaje) : [...alosDisponibles].sort((a, b) => Number(b.disponible) - Number(a.disponible))).map((alo) => (
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
                      {(form.hospedaje ? diaSolDisponible.filter(a => a.nombre === form.hospedaje) : [...diaSolDisponible].sort((a, b) => Number(b.disponible) - Number(a.disponible))).map((alo) => (
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
                const totalPrice = alojamientoPrice + precioTotalServicios;
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

                      {serviciosSeleccionados.map(x => {
                        const precio = precioServicio(form.hospedaje, x.servicio, g);
                        if (precio <= 0) return null;
                        return (
                          <div key={x.servicio} className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                              {labelServicio(x.servicio)}
                            </span>
                            <span className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {formatCOP(precio)}
                            </span>
                          </div>
                        );
                      })}

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
                          ? !form.nombre_huesped.trim() || !form.cedula_huesped.trim() || !form.email_huesped.trim() || !form.telefono_huesped.trim()
                          : !huespedesAdicionales[i - 1]?.nombre?.trim() || !huespedesAdicionales[i - 1]?.cedula?.trim() || !huespedesAdicionales[i - 1]?.email?.trim() || !huespedesAdicionales[i - 1]?.celular?.trim();
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
                    {huespedesAdicionales.some(h => !h.nombre?.trim() || !h.cedula?.trim()) && (
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
                        <input
                          list="indicativos-publica-list"
                          value={indicativo}
                          onChange={(e) => setIndicativo(e.target.value)}
                          className="w-[88px] shrink-0 bg-gray-50 border-r border-gray-200 text-gray-700 text-sm px-2 py-3 focus:outline-none"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          placeholder="+57"
                        />
                        <datalist id="indicativos-publica-list">
                          {INDICATIVOS.map(({ code, flag, name }) => (
                            <option key={code + name} value={code}>{flag} {name} ({code})</option>
                          ))}
                        </datalist>
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

                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={huespedesAdicionales[tabActivo - 1]?.email ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHuespedesAdicionales(prev => {
                            const next = [...prev];
                            next[tabActivo - 1] = { ...next[tabActivo - 1], email: val };
                            return next;
                          });
                          setError("");
                        }}
                        placeholder="correo@ejemplo.com"
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>

                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Celular
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={huespedesAdicionales[tabActivo - 1]?.celular ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHuespedesAdicionales(prev => {
                            const next = [...prev];
                            next[tabActivo - 1] = { ...next[tabActivo - 1], celular: val };
                            return next;
                          });
                          setError("");
                        }}
                        placeholder="300 000 0000"
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>
                  </>
                )}

                {(tabActivo === 0 || numHuespedes === 1) && (
                  <>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Número de huéspedes
                        <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal text-[10px]">
                          {minH > 1 ? `(mín. ${minH} · máx. ${maxHuespedes(form.hospedaje)})` : `(máx. ${maxHuespedes(form.hospedaje)})`}
                        </span>
                      </label>
                      <select
                        name="numero_huespedes"
                        value={form.numero_huespedes}
                        onChange={e => setForm(p => ({ ...p, numero_huespedes: e.target.value }))}
                        required
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {Array.from({ length: maxHuespedes(form.hospedaje) - minH + 1 }, (_, i) => i + minH).map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
                        ))}
                      </select>
                      {minH > 1 && (
                        <p className="text-xs text-amber-600 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          En días de semana se requieren mínimo {minH} personas.
                        </p>
                      )}
                      {normalize(form.hospedaje) === "glamping zafiro" && (
                        <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden text-[10px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {tarifasZafiroTiers().map(t => (
                            <div key={t.minGuests} className={`flex justify-between px-3 py-1.5 ${Number(form.numero_huespedes) >= t.minGuests && Number(form.numero_huespedes) <= t.maxGuests ? "bg-[#f0f5ec] text-[#3d2010] font-semibold" : "bg-white text-gray-400"}`}>
                              <span>{t.minGuests === t.maxGuests ? `${t.minGuests} huésped` : `${t.minGuests}–${t.maxGuests} huéspedes`}</span>
                              <span>Lun–Jue {formatCOP(t.low)} · F.S. {formatCOP(t.high)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {esHabitacion && (
                      <div>
                        <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                          Número de habitación
                        </label>
                        {normalize(form.hospedaje).includes("cuadruple") ? (
                          <div
                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-xl px-4 py-3"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Habitación 5
                          </div>
                        ) : (
                          <select
                            name="numero_habitacion"
                            value={form.numero_habitacion}
                            onChange={handleChange}
                            required
                            className={inputCls}
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <option value="">Selecciona una habitación</option>
                            {[1, 2, 3, 4].filter(n => !habitacionesOcupadas.includes(String(n))).map(n => (
                              <option key={n} value={String(n)}>Habitación {n}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {serviciosAlo.length > 0 && (
                      <div className="space-y-2">
                        <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                          Servicios adicionales
                        </label>
                        <div className="space-y-2">
                          {serviciosAlo.map(s => {
                            const isSelected = serviciosSeleccionados.some(x => x.servicio === s);
                            const precio = precioServicio(form.hospedaje, s, numHuespedes);
                            const needsColor = servicioRequiereColor(s);
                            const needsMensaje = servicioTieneMensaje(s);
                            const selectedData = serviciosSeleccionados.find(x => x.servicio === s);
                            return (
                              <div key={s}>
                                <button
                                  type="button"
                                  onClick={() => toggleServicio(s)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                                    isSelected
                                      ? "bg-[#8a6038]/8 border-[#8a6038] text-[#3d2010]"
                                      : "bg-white border-gray-200 text-gray-600 hover:border-[#8a6038]/40 hover:bg-gray-50"
                                  )}
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  <span>{labelServicio(s)}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {precio > 0 && (
                                      <span className="text-xs font-semibold text-[#8a6038]">
                                        +{formatCOP(precio)}
                                      </span>
                                    )}
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      isSelected ? "bg-[#8a6038] border-[#8a6038]" : "border-gray-300"
                                    )}>
                                      {isSelected && (
                                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {isSelected && needsColor && (
                                  <div className="mt-1.5 pl-1">
                                    <select
                                      value={selectedData?.color ?? ""}
                                      onChange={e => setColorServicio(s, e.target.value)}
                                      className={cn(inputCls, !selectedData?.color && "border-amber-400 focus:border-amber-500")}
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    >
                                      <option value="">Selecciona un color</option>
                                      {COLORES_DECORACION.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                    {!selectedData?.color && (
                                      <p className="text-amber-600 text-[10px] mt-1 ml-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                                        Selecciona un color para continuar
                                      </p>
                                    )}
                                  </div>
                                )}

                                {isSelected && needsMensaje && (
                                  <div className="mt-1.5 pl-1">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        maxLength={25}
                                        placeholder="Ej: ¡Feliz aniversario!"
                                        value={selectedData?.mensaje ?? ""}
                                        onChange={e => setMensajeServicio(s, e.target.value)}
                                        className={inputCls}
                                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                        {(selectedData?.mensaje ?? "").length}/25
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {serviciosSeleccionados.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {serviciosSeleccionados.map(x => {
                              const precio = precioServicio(form.hospedaje, x.servicio, numHuespedes);
                              return (
                                <div key={x.servicio} className="rounded-xl border border-[#8a6038]/25 bg-[#f9f2e8] px-4 py-2.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[#8a6038] text-sm leading-none shrink-0">✓</span>
                                    <span className="text-[#3d2010] text-sm font-semibold truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                      {labelServicio(x.servicio)}
                                      {x.color && <span className="ml-1.5 font-normal text-[#8a6038]">· {x.color}</span>}
                                    </span>
                                  </div>
                                  {precio > 0 && (
                                    <span className="text-[#3d2010] text-sm font-bold shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                                      +{formatCOP(precio)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Observación
                    <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal text-[10px]">(opcional)</span>
                  </label>
                  <textarea
                    name="observacion"
                    rows={3}
                    value={form.observacion}
                    onChange={e => setForm(p => ({ ...p, observacion: e.target.value }))}
                    placeholder="Solicitudes especiales, alergias, notas para el equipo..."
                    className={`${inputCls} resize-none`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
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

                {(() => {
                  if (!form.hospedaje || !form.check_in || (!isDiaDeSol && !form.check_out) || !tieneTarifa(form.hospedaje)) return null;
                  const g = Number(form.numero_huespedes);
                  const alojamientoPrice = precioTotal(form.hospedaje, form.check_in, isDiaDeSol ? form.check_in : form.check_out, g);
                  const totalPrice = alojamientoPrice + precioTotalServicios;
                  return (
                    <div className="flex items-center justify-between bg-[#f9f2e8] border border-[#c4a07a]/30 rounded-xl px-4 py-3">
                      <span className="text-[#8a6038] text-xs font-semibold tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                        TOTAL ESTIMADO
                      </span>
                      <span className="text-[#3d2010] text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {formatCOP(totalPrice)}
                      </span>
                    </div>
                  );
                })()}

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
