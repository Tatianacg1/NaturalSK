import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Loader, ChevronLeft, Info, MessageCircle } from "lucide-react";
import { accommodations } from "../../data/accommodations";
import { reservaPublicaAPI } from "../../../services/api";
import { CalendarioPublico, type AloData } from "./CalendarioPublico";
import { cn } from "../ui/utils";
import { precioTotal, tarifasBase, tarifasZafiroTiers, formatCOP, tieneTarifa, precioServicio, serviciosDisponibles, servicioRequiereColor, servicioTieneMensaje, COLORES_DECORACION, labelServicio, maxHuespedes, ZAFIRO_EXTRA_PERSONA } from "../../data/pricing";

interface Props {
  open: boolean;
  onClose: () => void;
  alojamientoInicial?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocal(str: string): Date {
  const s = str.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateEs(str: string): string {
  if (!str) return "—";
  const d = parseLocal(str);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
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
      .filter((r) => r.check_in.slice(0, 10) === ci)
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

function buildWaUrl(
  hospedaje: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  huespedes: string,
  servicio: string,
  total: number | null
): string {
  const lines = [
    `Hola! Acabo de solicitar una reserva en Natural Sound 🌿`,
    ``,
    `🏡 *${hospedaje}*`,
    `📅 Llegada: ${formatDateEs(checkIn)}`,
    `🚪 Salida: ${formatDateEs(checkOut)}`,
    `🌙 ${nights} ${nights === 1 ? "noche" : "noches"} · ${huespedes} ${Number(huespedes) === 1 ? "huésped" : "huéspedes"}`,
    ...(servicio !== "N/A" ? [`✨ Servicio: ${servicio}`] : []),
    ...(total ? [`💰 Precio estimado: ${formatCOP(total)} COP`] : []),
    ``,
    `Quiero confirmar los detalles del pago.`,
  ];
  return `https://wa.me/573046643574?text=${encodeURIComponent(lines.join("\n"))}`;
}

const emptyForm = (alojamiento = "") => ({
  hospedaje: alojamiento,
  check_in: "",
  check_out: "",
  nombre_huesped: "",
  cedula_huesped: "",
  email_huesped: "",
  telefono_huesped: "",
  numero_huespedes: "1",
  servicio_adicional: "N/A",
  color_decoracion: "",
  mensaje_decoracion: "",
});

// ─── Componente ───────────────────────────────────────────────────────────────

const INDICATIVOS_MODAL = [
  { code: "+57", flag: "🇨🇴" }, { code: "+1",   flag: "🇺🇸" }, { code: "+52",  flag: "🇲🇽" },
  { code: "+54", flag: "🇦🇷" }, { code: "+55",  flag: "🇧🇷" }, { code: "+56",  flag: "🇨🇱" },
  { code: "+51", flag: "🇵🇪" }, { code: "+58",  flag: "🇻🇪" }, { code: "+593", flag: "🇪🇨" },
  { code: "+507", flag: "🇵🇦" }, { code: "+34", flag: "🇪🇸" }, { code: "+44",  flag: "🇬🇧" },
];

export function ReservaPublicaModal({ open, onClose, alojamientoInicial }: Props) {
  const [modoVista, setModoVista] = useState<"alojamiento" | "fecha">("fecha");
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState(emptyForm(alojamientoInicial));
  const [indicativo, setIndicativo] = useState("+57");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const [datosGenerales, setDatosGenerales] = useState<AloData[] | undefined>(undefined);
  const [loadingGeneral, setLoadingGeneral] = useState(false);

  // Al abrir: si viene con alojamiento pre-seleccionado → modo "por alojamiento" directo
  useEffect(() => {
    if (!open) return;
    if (alojamientoInicial) {
      setModoVista("alojamiento");
      setForm(emptyForm(alojamientoInicial));
    } else {
      setModoVista("fecha");
      setForm(emptyForm());
    }
    setStep(1);
    setIndicativo("+57");
    setError("");
    setExito(false);
  }, [open, alojamientoInicial]);

  useEffect(() => {
    if (!open || modoVista !== "fecha") return;
    if (datosGenerales) return;
    setLoadingGeneral(true);
    reservaPublicaAPI.disponibilidadGeneral()
      .then((data) => setDatosGenerales(data.alojamientos ?? []))
      .catch(() => setDatosGenerales([]))
      .finally(() => setLoadingGeneral(false));
  }, [open, modoVista, datosGenerales]);

  if (!open) return null;

  const nights = nightsBetween(form.check_in, form.check_out);

  const alosDisponibles = datosGenerales && form.check_in && form.check_out
    ? datosGenerales.map((alo) => ({
        ...alo,
        disponible: isAvailableForRange(alo, form.check_in, form.check_out),
      }))
    : [];

  const canContinue = !!form.hospedaje && !!form.check_in && !!form.check_out;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRangeChange = (ci: string, co: string) => {
    setForm((p) => ({
      ...p,
      check_in: ci,
      check_out: co,
      hospedaje: modoVista === "fecha" ? "" : p.hospedaje,
    }));
  };

  const cambiarModo = (modo: "alojamiento" | "fecha") => {
    setModoVista(modo);
    setForm(emptyForm());
    setError("");
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const local = form.telefono_huesped.trim().replace(/^\+/, "");
      const codSin = indicativo.replace("+", "");
      const telefonoCombinado = local
        ? (local.startsWith(codSin) ? `+${local}` : `${indicativo}${local}`)
        : "";
      await reservaPublicaAPI.crearPublica({
        ...form,
        telefono_huesped: telefonoCombinado,
        numero_huespedes: Number(form.numero_huespedes),
        valor_servicio_adicional: precioServicio(form.hospedaje, form.servicio_adicional),
      });
      setExito(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  // ─── Estilos de input reutilizables ──────────────────────────────────────────
  const inputCls =
    "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-[#8a6038] focus:ring-1 focus:ring-[#8a6038]/20 transition-colors";
  const labelCls =
    "block text-[#8a6038] text-[10px] tracking-widest uppercase mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && !exito && (
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="text-[#8a6038] hover:text-[#3d2010] transition-colors p-1 -ml-1"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <p
                className="text-[#8a6038] text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Natural Sound {!exito && `· Paso ${step} de 2`}
              </p>
              <h2
                className="text-[#3d2010] text-xl font-semibold leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {exito
                  ? "¡Solicitud enviada!"
                  : step === 1
                    ? "Selecciona tus fechas"
                    : "Tus datos"}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── ÉXITO ── */}
          {exito && (() => {
            const exitoTotal = tieneTarifa(form.hospedaje) && form.check_in && form.check_out
              ? precioTotal(form.hospedaje, form.check_in, form.check_out, Number(form.numero_huespedes))
              : null;
            const waUrl = buildWaUrl(
              form.hospedaje, form.check_in, form.check_out, nights,
              form.numero_huespedes, form.servicio_adicional, exitoTotal
            );
            return (
              <div className="text-center py-8">
                <CheckCircle size={52} className="text-[#8a6038] mx-auto mb-4" />
                <p
                  className="text-[#3d2010] text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Tu solicitud fue recibida
                </p>
                <p className="text-gray-600 text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span className="text-[#3d2010] font-medium">{form.hospedaje}</span>
                  {" · "}
                  {formatDateEs(form.check_in)} → {formatDateEs(form.check_out)}
                  {" · "}
                  {nights} {nights === 1 ? "noche" : "noches"}
                </p>
                <p
                  className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm mx-auto"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                >
                  Tu reserva queda en estado{" "}
                  <span className="text-amber-600 font-medium">Pendiente</span>.
                  {" "}Escríbenos por WhatsApp para coordinar el pago y confirmar.
                </p>
                <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#7c4a28] hover:bg-[#c4813f] text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <MessageCircle size={16} />
                    Coordinar pago por WhatsApp
                  </a>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 text-sm transition-colors py-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── PASO 1 ── */}
          {!exito && step === 1 && (
            <div className="space-y-4">

              {/* Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 bg-gray-50">
                {(["fecha", "alojamiento"] as const).map((modo) => (
                  <button
                    key={modo}
                    onClick={() => cambiarModo(modo)}
                    className={cn(
                      "flex-1 py-2 text-xs rounded-lg transition-all",
                      modoVista === modo
                        ? "bg-[#8a6038] text-white font-semibold shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                    style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}
                  >
                    {modo === "fecha" ? "Por fecha" : "Por alojamiento"}
                  </button>
                ))}
              </div>

              {/* ── MODO: POR ALOJAMIENTO ── */}
              {modoVista === "alojamiento" && (
                <>
                  <div>
                    <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                      Alojamiento
                    </label>
                    <select
                      name="hospedaje"
                      value={form.hospedaje}
                      onChange={(e) => {
                        const h = e.target.value;
                        const isDDS = h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() === "dia de sol";
                        const mx = maxHuespedes(h);
                        setForm((p) => ({
                          ...p,
                          hospedaje: h,
                          check_in: "",
                          check_out: "",
                          numero_huespedes: String(Math.min(Number(p.numero_huespedes) || 1, mx)),
                          ...(isDDS ? { servicio_adicional: "N/A" } : {}),
                        }));
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

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <CalendarioPublico
                      alojamiento={form.hospedaje}
                      checkIn={form.check_in}
                      checkOut={form.check_out}
                      onRangeChange={handleRangeChange}
                    />
                  </div>
                </>
              )}

              {/* ── MODO: POR FECHA ── */}
              {modoVista === "fecha" && (
                <>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <CalendarioPublico
                      datosGenerales={datosGenerales}
                      loadingGeneral={loadingGeneral}
                      checkIn={form.check_in}
                      checkOut={form.check_out}
                      onRangeChange={handleRangeChange}
                    />
                  </div>

                  {/* Lista de alojamientos para el rango */}
                  {form.check_in && form.check_out && alosDisponibles.length > 0 && (
                    <div className="space-y-2">
                      <p
                        className="text-[#8a6038] text-[10px] tracking-widest uppercase"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Alojamientos · {formatDateEs(form.check_in)} → {formatDateEs(form.check_out)}
                      </p>
                      {alosDisponibles.map((alo) => {
                        const normalize = (s: string) =>
                          s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
                        const localData = accommodations.find(
                          (a) => normalize(a.name) === normalize(alo.nombre)
                        );
                        const selected = form.hospedaje === alo.nombre;
                        return (
                        <button
                          key={alo.nombre}
                          disabled={!alo.disponible}
                          onClick={() => {
                            if (!alo.disponible) return;
                            const isDDS = alo.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() === "dia de sol";
                            const mx = maxHuespedes(alo.nombre);
                            setForm((p) => ({
                              ...p,
                              hospedaje: alo.nombre,
                              numero_huespedes: String(Math.min(Number(p.numero_huespedes) || 1, mx)),
                              ...(isDDS ? { servicio_adicional: "N/A" } : {}),
                            }));
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            !alo.disponible
                              ? "border-red-100 bg-red-50/60 cursor-not-allowed"
                              : selected
                                ? "border-[#8a6038] bg-[#f0f5ec] cursor-pointer shadow-sm"
                                : "border-gray-200 bg-white hover:border-[#8a6038]/50 hover:bg-gray-50 cursor-pointer"
                          )}
                        >
                          {/* Imagen */}
                          <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            {localData?.image ? (
                              <img
                                src={localData.image}
                                alt={alo.nombre}
                                className={cn(
                                  "w-full h-full object-cover transition-opacity",
                                  !alo.disponible && "opacity-40 grayscale"
                                )}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm font-semibold leading-tight",
                                  !alo.disponible ? "text-red-400" : "text-gray-900"
                                )}
                                style={{ fontFamily: "'Playfair Display', serif" }}
                              >
                                {alo.nombre}
                              </p>
                              <span
                                className={cn(
                                  "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                  alo.disponible
                                    ? "text-[#8a6038] bg-[#8a6038]/10"
                                    : "text-red-500 bg-red-100"
                                )}
                                style={{ fontFamily: "'DM Mono', monospace" }}
                              >
                                {alo.disponible ? "Disponible" : "Ocupado"}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-[11px] mt-0.5 mb-1.5",
                                !alo.disponible ? "text-red-300" : "text-gray-400"
                              )}
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {alo.tipo}
                            </p>
                            {localData?.features && alo.disponible && (
                              <div className="flex flex-wrap gap-1">
                                {localData.features.slice(0, 3).map((f) => (
                                  <span
                                    key={f}
                                    className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Check de seleccionado */}
                          {selected && alo.disponible && (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-[#8a6038] flex items-center justify-center">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  )}

                  {form.check_in && !form.check_out && (
                    <p
                      className="text-center text-gray-400 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Selecciona la fecha de salida
                    </p>
                  )}
                </>
              )}

              {/* Resumen del rango */}
              {form.check_in && form.check_out && (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="text-center">
                    <p
                      className="text-[#8a6038] text-[9px] tracking-widest uppercase mb-0.5"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Llegada
                    </p>
                    <p className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {formatDateEs(form.check_in)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                    <span className="text-gray-500 text-xs shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {nights} {nights === 1 ? "noche" : "noches"}
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                  </div>
                  <div className="text-center">
                    <p
                      className="text-[#8a6038] text-[9px] tracking-widest uppercase mb-0.5"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Salida
                    </p>
                    <p className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {formatDateEs(form.check_out)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: Datos personales ── */}
          {!exito && step === 2 && (
            <form id="form-datos" onSubmit={handleSubmit} className="space-y-4">
              {/* Resumen compacto */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#3d2010] font-medium">{form.hospedaje}</span>
                <span className="text-gray-400"> · </span>
                <span className="text-gray-600">{formatDateEs(form.check_in)} → {formatDateEs(form.check_out)}</span>
                <span className="text-gray-400"> · </span>
                <span className="text-[#8a6038] font-medium">{nights} {nights === 1 ? "noche" : "noches"}</span>
              </div>

              {/* Precio estimado */}
              {tieneTarifa(form.hospedaje) && (() => {
                const g = Number(form.numero_huespedes);
                const total = precioTotal(form.hospedaje, form.check_in, form.check_out, g);
                const bases = tarifasBase(form.hospedaje, g)!;
                return (
                  <div className="bg-[#f9f2e8] border border-[#8a6038]/20 rounded-xl px-4 py-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#8a6038] text-[10px] tracking-widest uppercase font-semibold"
                        style={{ fontFamily: "'DM Mono', monospace" }}>
                        Precio estimado
                      </span>
                      <span className="text-[#3d2010] text-base font-bold"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {formatCOP(total)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px] mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                      Lun–Jue {formatCOP(bases.low)} · Fin de semana/festivo/temp. alta {formatCOP(bases.high)} — por noche
                    </p>
                    {g === 7 && form.hospedaje.toLowerCase().includes("zafiro") && (
                      <div className="flex items-start gap-1.5 mb-2">
                        <Info size={10} className="text-[#8a6038] mt-0.5 shrink-0" />
                        <p className="text-[#8a6038] text-[10px] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Tarifa 5–6 personas + {formatCOP(ZAFIRO_EXTRA_PERSONA)} por noche por la persona adicional.
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5">
                      <Info size={10} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-amber-700 text-[10px] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Precio referencial en pesos colombianos. Sujeto a cambios según disponibilidad.
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Nombre completo
                  </label>
                  <input type="text" name="nombre_huesped" value={form.nombre_huesped}
                    onChange={handleChange} required placeholder="Tu nombre completo"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                    Cédula
                  </label>
                  <input type="text" name="cedula_huesped" value={form.cedula_huesped}
                    onChange={handleChange} required placeholder="Número de cédula"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>Email</label>
                  <input type="email" name="email_huesped" value={form.email_huesped}
                    onChange={handleChange} required placeholder="correo@ejemplo.com"
                    className={inputCls} style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>WhatsApp</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#8a6038] focus-within:ring-2 focus-within:ring-[#8a6038]/10 transition-all bg-white">
                    <select
                      value={indicativo}
                      onChange={(e) => setIndicativo(e.target.value)}
                      className="w-[96px] shrink-0 bg-gray-50 border-r border-gray-200 text-gray-700 text-sm pl-2 pr-1 py-3 focus:outline-none cursor-pointer"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {INDICATIVOS_MODAL.map(({ code, flag }) => (
                        <option key={code} value={code}>{flag} {code}</option>
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
              </div>

              <div>
                <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                  Número de huéspedes
                  <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal text-[10px]">
                    (máx. {maxHuespedes(form.hospedaje)})
                  </span>
                </label>
                <select
                  name="numero_huespedes"
                  value={form.numero_huespedes}
                  onChange={e => { setForm(p => ({ ...p, numero_huespedes: e.target.value })); setError(""); }}
                  required
                  className={inputCls}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {Array.from({ length: maxHuespedes(form.hospedaje) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
                  ))}
                </select>
                {form.hospedaje.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() === "glamping zafiro" && (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden text-[10px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {tarifasZafiroTiers().map(t => (
                      <div key={t.minGuests} className={`flex justify-between px-3 py-1.5 ${Number(form.numero_huespedes) >= t.minGuests && Number(form.numero_huespedes) <= t.maxGuests ? "bg-[#f0f5ec] text-[#3d2010] font-semibold" : "bg-white text-gray-400"}`}>
                        <span>{t.minGuests === t.maxGuests ? `${t.minGuests} huésped` : `${t.minGuests}–${t.maxGuests} huéspedes`}</span>
                        <span>Lun–Jue {formatCOP(t.low)} · F.S. {formatCOP(t.high)}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between px-3 py-1.5 ${Number(form.numero_huespedes) === 7 ? "bg-[#f0f5ec] text-[#3d2010] font-semibold" : "bg-white text-gray-400"}`}>
                      <span>7 huéspedes</span>
                      <span>Precio 5–6 personas + {formatCOP(ZAFIRO_EXTRA_PERSONA)}/noche</span>
                    </div>
                  </div>
                )}
              </div>

              {serviciosDisponibles(form.hospedaje).length > 0 && (
                <>
                  <div>
                    <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                      Servicio adicional
                    </label>
                    <select
                      name="servicio_adicional"
                      value={form.servicio_adicional}
                      onChange={e => {
                        setForm(p => ({ ...p, servicio_adicional: e.target.value, color_decoracion: "", mensaje_decoracion: "" }));
                        setError("");
                      }}
                      className={inputCls}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <option value="N/A">Sin servicio adicional</option>
                      {serviciosDisponibles(form.hospedaje).map(s => (
                        <option key={s} value={s}>{labelServicio(s)}</option>
                      ))}
                    </select>
                  </div>

                  {servicioRequiereColor(form.servicio_adicional) && form.servicio_adicional !== "N/A" && (
                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Color de decoración
                      </label>
                      <select
                        name="color_decoracion"
                        value={form.color_decoracion}
                        onChange={handleChange}
                        required
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="">Selecciona un color</option>
                        {COLORES_DECORACION.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {servicioTieneMensaje(form.servicio_adicional) && (
                    <div>
                      <label className={labelCls} style={{ fontFamily: "'DM Mono', monospace" }}>
                        Mensaje personalizado
                        <span className="ml-2 font-normal normal-case text-[#9db5a0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {form.mensaje_decoracion.length}/25 caracteres
                        </span>
                      </label>
                      <input
                        type="text"
                        maxLength={25}
                        placeholder="Ej: ¡Feliz aniversario!"
                        value={form.mensaje_decoracion}
                        onChange={e => setForm(p => ({ ...p, mensaje_decoracion: e.target.value }))}
                        className={inputCls}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>
                  )}

                  {form.servicio_adicional !== "N/A" && precioServicio(form.hospedaje, form.servicio_adicional) > 0 && (
                    <div className="rounded-xl border border-[#8a6038]/25 bg-[#f9f2e8] px-4 py-3 flex items-start gap-3">
                      <span className="text-[#8a6038] mt-0.5 text-base leading-none">✓</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[#3d2010] text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {labelServicio(form.servicio_adicional)}
                            {form.color_decoracion && (
                              <span className="ml-2 font-normal text-[#8a6038]">· {form.color_decoracion}</span>
                            )}
                          </span>
                          <span className="text-[#3d2010] text-sm font-bold shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                            + {formatCOP(precioServicio(form.hospedaje, form.servicio_adicional))}
                          </span>
                        </div>
                        {servicioRequiereColor(form.servicio_adicional) && !form.color_decoracion && (
                          <p className="text-amber-600 text-[10px] mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                            Selecciona un color para continuar
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {error}
                  </p>
                </div>
              )}

              <p className="text-center text-gray-400 text-[11px] pt-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Tu reserva quedará en estado Pendiente hasta ser confirmada por el equipo.
              </p>
            </form>
          )}
        </div>

        {/* ── Footer ── */}
        {!exito && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="w-full bg-[#8a6038] hover:bg-[#7a4c28] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-full text-sm tracking-wide transition-colors font-medium"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {!form.hospedaje
                  ? modoVista === "fecha" && form.check_in && form.check_out
                    ? "Selecciona un alojamiento de la lista"
                    : "Selecciona alojamiento y fechas"
                  : !form.check_in || !form.check_out
                    ? "Selecciona las fechas en el calendario"
                    : "Continuar →"}
              </button>
            ) : (
              <button
                type="submit"
                form="form-datos"
                disabled={loading}
                className="w-full bg-[#8a6038] hover:bg-[#7a4c28] disabled:opacity-60 text-white py-3 rounded-full text-sm tracking-wide transition-colors font-medium flex items-center justify-center gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {loading ? (
                  <><Loader size={14} className="animate-spin" /> Enviando...</>
                ) : (
                  "Enviar solicitud de reserva"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
