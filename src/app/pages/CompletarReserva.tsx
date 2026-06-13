import { useState, useEffect } from "react";
import { reservaPublicaAPI } from "../../services/api";
import { INDICATIVOS } from "../data/indicativos";
import {
  serviciosDisponibles, servicioRequiereColor, servicioTieneMensaje,
  labelServicio, COLORES_DECORACION,
} from "../data/pricing";

interface Props {
  token: string;
}

interface HuespedAdicional {
  nombre: string;
  cedula: string;
  email: string;
  celular: string;
}

interface ReservaInfo {
  id: number;
  hospedaje: string;
  tipo_hospedaje: string;
  codigo_alojamiento: string;
  check_in: string;
  check_out: string;
  usuario_id: number;
  nombre_admin: string;
  valor_alojamiento: number;
  valor_servicio_adicional: number;
  abono: number;
  total: number;
  datos_completados: boolean;
  estado: string;
  servicio_adicional: string;
  nombre_huesped?: string;
  email_huesped?: string;
  color_decoracion?: string;
}

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-[#3d2010] focus:outline-none focus:border-[#5a3518] bg-white";
const labelCls = "block text-sm mb-1 text-[#7a4828]";

export function CompletarReserva({ token }: Props) {
  const [reservaInfo, setReservaInfo] = useState<ReservaInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [indicativo, setIndicativo] = useState("+57");
  const [telefono, setTelefono] = useState("");
  const [cantPersonas, setCantPersonas] = useState(1);
  const [adicionales, setAdicionales] = useState<HuespedAdicional[]>([]);
  const [servicio, setServicio] = useState("N/A");
  const [colorDecoracion, setColorDecoracion] = useState("");
  const [mensajeDecoracion, setMensajeDecoracion] = useState("");
  const [observacion, setObservacion] = useState("");

  useEffect(() => {
    reservaPublicaAPI.getByToken(token)
      .then(data => {
        setReservaInfo(data);
        if (data.servicio_adicional && data.servicio_adicional !== "N/A") {
          setServicio(data.servicio_adicional);
        }
        if (data.color_decoracion) setColorDecoracion(data.color_decoracion);
        const nombreReal = data.nombre_huesped &&
          data.nombre_huesped !== "Sin nombre" &&
          data.nombre_huesped !== "Pendiente";
        const emailReal = data.email_huesped &&
          data.email_huesped !== "pendiente@naturalsk.com";
        if (data.datos_completados && nombreReal && emailReal) setEnviado(true);
      })
      .catch(err => setError(err.message))
      .finally(() => setCargando(false));
  }, [token]);

  const maxHuespedes = () => {
    const hospedaje = reservaInfo?.hospedaje ?? "";
    const tipo = reservaInfo?.tipo_hospedaje ?? "";
    if (hospedaje.toLowerCase().includes("día de sol") || tipo.toLowerCase().includes("día de sol")) return 8;
    if (hospedaje.toLowerCase().includes("zafiro") || tipo.toLowerCase().includes("zafiro")) return 6;
    if (tipo.toLowerCase().includes("glamping")) return 2;
    return 8;
  };

  const handleCantChange = (val: number) => {
    const n = Math.min(Math.max(1, val), maxHuespedes());
    setCantPersonas(n);
    setAdicionales(prev => {
      const nuevos = [...prev];
      while (nuevos.length < n - 1) nuevos.push({ nombre: "", cedula: "", email: "", celular: "" });
      return nuevos.slice(0, Math.max(0, n - 1));
    });
  };

  const handleAdicionalChange = (i: number, campo: keyof HuespedAdicional, valor: string) => {
    setAdicionales(prev => prev.map((h, idx) => idx === i ? { ...h, [campo]: valor } : h));
  };

  const handleServicioChange = (val: string) => {
    setServicio(val);
    setColorDecoracion("");
    setMensajeDecoracion("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const local = telefono.trim().replace(/^\+/, "");
      const codSin = indicativo.replace("+", "");
      const telefonoCombinado = local
        ? (local.startsWith(codSin) ? `+${local}` : `${indicativo}${local}`)
        : "";
      const resultado = await reservaPublicaAPI.completar(token, {
        nombre_huesped: nombre,
        cedula_huesped: cedula,
        email_huesped: email,
        telefono_huesped: telefonoCombinado,
        numero_huespedes: cantPersonas,
        huespedes_adicionales: adicionales,
        servicio_adicional: servicio,
        color_decoracion: colorDecoracion,
        mensaje_decoracion: mensajeDecoracion,
        observacion,
      });
      setMensajeExito(resultado.mensaje);
      setEnviado(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar los datos");
    } finally {
      setEnviando(false);
    }
  };

  const formatFecha = (f: string) => {
    if (!f) return "—";
    const [y, m, d] = f.split("-");
    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${d} ${meses[parseInt(m) - 1]}. ${y}`;
  };

  const noches = () => {
    if (!reservaInfo) return 0;
    const diff = new Date(reservaInfo.check_out).getTime() - new Date(reservaInfo.check_in).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f7ede0] flex items-center justify-center">
        <p className="text-[#7a4828]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Cargando...</p>
      </div>
    );
  }

  if (error && !reservaInfo) {
    return (
      <div className="min-h-screen bg-[#f7ede0] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <p className="text-2xl mb-2">🔗</p>
          <h2 className="text-xl font-semibold text-[#3d2010] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Enlace no válido
          </h2>
          <p className="text-slate-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#f7ede0] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#3d2010] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            ¡Datos registrados!
          </h2>
          <p className="text-slate-500 text-sm mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {mensajeExito || "Tu reserva ha sido completada. El equipo de Natural Sound te contactará pronto."}
          </p>
          {reservaInfo && (
            <div className="bg-[#f5e8d5] rounded-xl p-4 text-left text-sm space-y-1 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <p className="font-semibold text-[#3d2010]">{reservaInfo.hospedaje}</p>
              <p className="text-[#8b5e38]">{formatFecha(reservaInfo.check_in)} → {formatFecha(reservaInfo.check_out)}</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = "/"}
            className="w-full py-3 bg-[#5a3518] text-white rounded-xl font-medium hover:bg-[#3d2010] transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Volver a la página principal
          </button>
        </div>
      </div>
    );
  }

  const n = noches();
  const valorTotal = reservaInfo
    ? (reservaInfo.valor_alojamiento || 0) + (reservaInfo.valor_servicio_adicional || 0)
    : 0;
  const serviciosOpciones = serviciosDisponibles(reservaInfo?.hospedaje ?? "");

  return (
    <div className="min-h-screen bg-[#f7ede0] relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/logo.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity: 0.09,
        }}
      />
      <div className="relative z-10">
        <header className="bg-[#5a3518] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
            <img src="/images/sk.png" alt="Natural Sound" className="w-14 h-14 object-contain" />
            <span className="font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Natural Sound
            </span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Resumen de la reserva */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#5a3518] px-6 py-4">
              <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Completa tu reserva
              </h1>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Alojamiento</p>
                <p className="font-semibold text-[#3d2010]">{reservaInfo?.hospedaje}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Tipo</p>
                <p className="text-[#3d2010]">{reservaInfo?.tipo_hospedaje}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Check-in</p>
                <p className="font-medium text-[#3d2010]">{formatFecha(reservaInfo?.check_in || "")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  {reservaInfo?.tipo_hospedaje === "Día de Sol" ? "Fecha" : "Check-out"}
                </p>
                <p className="font-medium text-[#3d2010]">{formatFecha(reservaInfo?.check_out || "")}</p>
              </div>
              {n > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Noches</p>
                  <p className="text-[#3d2010]">{n}</p>
                </div>
              )}
              {valorTotal > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Valor total</p>
                  <p className="font-semibold text-[#3d2010]">
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valorTotal)}
                  </p>
                </div>
              )}
              {reservaInfo && reservaInfo.abono > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Abono</p>
                  <p className="font-semibold text-amber-700">
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(reservaInfo.abono)}
                  </p>
                </div>
              )}
              {reservaInfo && reservaInfo.total > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Valor restante</p>
                  <p className="font-semibold text-amber-600">
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(reservaInfo.total)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tus datos
            </h2>

            {/* Nombre */}
            <div>
              <label className={labelCls}>Nombre completo *</label>
              <input type="text" className={inputCls} value={nombre}
                onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre completo" />
            </div>

            {/* Cédula */}
            <div>
              <label className={labelCls}>Cédula / documento *</label>
              <input type="text" className={inputCls} value={cedula}
                onChange={e => setCedula(e.target.value)} required placeholder="Número de documento" />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Correo electrónico *</label>
              <input type="email" className={inputCls} value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="tu@correo.com" />
            </div>

            {/* WhatsApp con indicativo */}
            <div>
              <label className={labelCls}>WhatsApp *</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:border-[#5a3518] transition-colors">
                <select
                  value={indicativo}
                  onChange={e => setIndicativo(e.target.value)}
                  className="shrink-0 bg-slate-50 border-r border-slate-200 text-[#3d2010] text-sm px-2 py-2 focus:outline-none cursor-pointer"
                  style={{ width: "90px" }}
                >
                  {INDICATIVOS.map(({ code, flag }) => (
                    <option key={code} value={code}>{flag} {code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="tel"
                  className="flex-1 px-3 py-2 text-[#3d2010] focus:outline-none bg-white"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  required
                  placeholder="300 000 0000"
                />
              </div>
            </div>

            {/* Número de personas */}
            <div>
              <label className={labelCls}>
                Número de personas *
                <span className="ml-2 text-slate-400 font-normal text-xs">(máx. {maxHuespedes()})</span>
              </label>
              <select
                className={inputCls}
                value={cantPersonas}
                onChange={e => handleCantChange(Number(e.target.value))}
                required
              >
                {Array.from({ length: maxHuespedes() }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? "persona" : "personas"}</option>
                ))}
              </select>
            </div>

            {/* Huéspedes adicionales */}
            {adicionales.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-[#5a3518]">Demás huéspedes</p>
                {adicionales.map((h, i) => (
                  <div key={i} className="bg-[#f7ede0] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#8b5e38] uppercase tracking-wide">Huésped {i + 2}</p>
                    <input type="text" className={inputCls} placeholder="Nombre completo"
                      value={h.nombre} onChange={e => handleAdicionalChange(i, "nombre", e.target.value)} required />
                    <input type="text" className={inputCls} placeholder="Número de documento"
                      value={h.cedula} onChange={e => handleAdicionalChange(i, "cedula", e.target.value)} required />
                    <input type="email" className={inputCls} placeholder="Correo electrónico"
                      value={h.email} onChange={e => handleAdicionalChange(i, "email", e.target.value)} />
                    <input type="tel" inputMode="tel" className={inputCls} placeholder="Celular (ej: 300 000 0000)"
                      value={h.celular} onChange={e => handleAdicionalChange(i, "celular", e.target.value)} required />
                  </div>
                ))}
              </div>
            )}

            {/* Servicio adicional */}
            {serviciosOpciones.length > 0 && (
              <div>
                <label className={labelCls}>Servicio adicional</label>
                <select
                  className={inputCls}
                  value={servicio}
                  onChange={e => handleServicioChange(e.target.value)}
                >
                  <option value="N/A">Sin servicio adicional</option>
                  {serviciosOpciones.map(s => (
                    <option key={s} value={s}>{labelServicio(s)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Color de decoración */}
            {servicio !== "N/A" && servicioRequiereColor(servicio) && (
              <div>
                <label className={labelCls}>Color de decoración *</label>
                <select
                  className={inputCls}
                  value={colorDecoracion}
                  onChange={e => setColorDecoracion(e.target.value)}
                  required
                >
                  <option value="">Selecciona un color</option>
                  {COLORES_DECORACION.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Mensaje personalizado para decoración */}
            {servicio !== "N/A" && servicioTieneMensaje(servicio) && (
              <div>
                <label className={labelCls}>
                  Mensaje para la decoración
                  <span className="ml-2 text-xs text-slate-400">{mensajeDecoracion.length}/25 caracteres</span>
                </label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="Ej: ¡Feliz aniversario!"
                  className={inputCls}
                  value={mensajeDecoracion}
                  onChange={e => setMensajeDecoracion(e.target.value)}
                />
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className={labelCls}>
                Observaciones
                <span className="ml-2 text-xs text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Alergias, necesidades especiales, solicitudes adicionales..."
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 bg-[#5a3518] text-white rounded-xl font-medium hover:bg-[#3d2010] transition-colors disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Confirmar mis datos"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 pb-8">
            Natural Sound · Los datos ingresados quedan vinculados a esta reserva y no pueden modificarse una vez enviados.
          </p>
        </main>
      </div>
    </div>
  );
}
