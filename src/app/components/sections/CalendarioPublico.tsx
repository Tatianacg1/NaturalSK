import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";
import { API_BASE_URL } from "../../../services/api";
import { esFestivo } from "../../data/pricing";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Rango {
  check_in: string;
  check_out: string;
  numero_huespedes?: number;  // solo para Día de Sol
}

export interface AloData {
  nombre: string;
  tipo: string;
  limite_reservas: number;
  reservas: Rango[];
  // Día de Sol
  es_dia_de_sol?: boolean;
  capacidad_semana?: number;
  capacidad_domingo?: number;
  max_por_reserva?: number;
}

interface Props {
  alojamiento?: string;
  datosGenerales?: AloData[];
  loadingGeneral?: boolean;
  checkIn: string;
  checkOut: string;
  onRangeChange: (ci: string, co: string) => void;
  eventosPrivados?: Rango[];  // rangos bloqueados por evento privado (para modoFecha)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS = ["DO","LU","MA","MI","JU","VI","SA"];

function parseLocal(str: string): Date {
  const s = str.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function advance(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((firstDow + days) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = i - firstDow + 1;
    return d >= 1 && d <= days ? d : null;
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

// Detecta Día de Sol por nombre (normalizado, sin depender de fetch)
const esDiaDeSolNombre = (nombre: string) =>
  nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() === "dia de sol";

export function CalendarioPublico({
  alojamiento = "",
  datosGenerales,
  loadingGeneral = false,
  checkIn,
  checkOut,
  onRangeChange,
  eventosPrivados = [],
}: Props) {
  const modoFecha = datosGenerales !== undefined;
  // Single-day mode: detección inmediata por nombre, sin esperar el fetch
  const esSingleDay = !modoFecha && esDiaDeSolNombre(alojamiento);

  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const [base, setBase] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [reservasAlo, setReservasAlo] = useState<Rango[]>([]);
  const [limite, setLimite] = useState(1);
  const [loadingAlo, setLoadingAlo] = useState(false);
  const [hover, setHover] = useState("");
  // Día de Sol
  const [esDiaDeSol, setEsDiaDeSol] = useState(false);
  const [capSemana, setCapSemana] = useState(25);
  const [capDomingo, setCapDomingo] = useState(30);
  // Bloqueos de evento privado (solo modo individual)
  const [eventosPrivadosLocal, setEventosPrivadosLocal] = useState<Rango[]>([]);

  useEffect(() => {
    if (modoFecha || !alojamiento) { setReservasAlo([]); setEsDiaDeSol(false); setEventosPrivadosLocal([]); return; }
    setLoadingAlo(true);
    fetch(`${API_BASE_URL}/reservas/publica/disponibilidad?hospedaje=${encodeURIComponent(alojamiento)}`)
      .then((r) => r.json())
      .then((data) => {
        setReservasAlo(Array.isArray(data.reservas) ? data.reservas : []);
        setLimite(data.limite_reservas ?? 1);
        setEsDiaDeSol(data.es_dia_de_sol ?? false);
        setCapSemana(data.capacidad_semana ?? 25);
        setCapDomingo(data.capacidad_domingo ?? 30);
        setEventosPrivadosLocal(Array.isArray(data.eventos_privados) ? data.eventos_privados : []);
      })
      .catch(() => { setReservasAlo([]); setEventosPrivadosLocal([]); })
      .finally(() => setLoadingAlo(false));
  }, [alojamiento, modoFecha]);

  // Cupos libres para Día de Sol en una fecha (modo por alojamiento)
  const getCuposDiaDeSol = useCallback(
    (y: number, m: number, d: number): number => {
      if (!esDiaDeSol) return 0;
      const esDomingo = new Date(y, m, d).getDay() === 0;
      const cap = esDomingo ? capDomingo : capSemana;
      const ds = toStr(y, m, d);
      const total = reservasAlo
        .filter((r) => r.check_in.slice(0, 10) === ds)
        .reduce((acc, r) => acc + (r.numero_huespedes ?? 0), 0);
      return Math.max(0, cap - total);
    },
    [reservasAlo, esDiaDeSol, capSemana, capDomingo]
  );

  const isBookedAlo = useCallback(
    (y: number, m: number, d: number) => {
      const date = new Date(y, m, d);
      // Bloquear si hay un evento privado que cubre esta fecha
      const bloqueadoPorEvento = eventosPrivadosLocal.some(ep => {
        const ci = parseLocal(ep.check_in);
        const co = parseLocal(ep.check_out);
        return date >= ci && date < co;
      });
      if (bloqueadoPorEvento) return true;
      if (esDiaDeSol) return getCuposDiaDeSol(y, m, d) === 0;
      return (
        reservasAlo.filter((r) => {
          const ci = parseLocal(r.check_in);
          const co = parseLocal(r.check_out);
          return date >= ci && date < co;
        }).length >= limite
      );
    },
    [reservasAlo, limite, esDiaDeSol, getCuposDiaDeSol, eventosPrivadosLocal]
  );

  const availableCountAt = useCallback(
    (y: number, m: number, d: number): number => {
      if (!datosGenerales) return 0;
      const date = new Date(y, m, d);
      const ds = toStr(y, m, d);
      // Bloquear todo si hay un evento privado que cubre esta fecha
      const bloqueadoPorEvento = eventosPrivados.some(ep => {
        const ci = parseLocal(ep.check_in);
        const co = parseLocal(ep.check_out);
        return date >= ci && date < co;
      });
      if (bloqueadoPorEvento) return 0;
      return datosGenerales.filter((alo) => {
        if (alo.es_dia_de_sol) {
          const esDomingo = date.getDay() === 0;
          const cap = esDomingo ? (alo.capacidad_domingo ?? 30) : (alo.capacidad_semana ?? 25);
          const total = alo.reservas
            .filter((r) => r.check_in.slice(0, 10) === ds)
            .reduce((acc, r) => acc + (r.numero_huespedes ?? 0), 0);
          return total < cap;
        }
        const booked = alo.reservas.filter((r) => {
          const ci = parseLocal(r.check_in);
          const co = parseLocal(r.check_out);
          return date >= ci && date < co;
        }).length;
        return booked < alo.limite_reservas;
      }).length;
    },
    [datosGenerales, eventosPrivados]
  );

  const totalAlos = datosGenerales?.length ?? 0;
  const isPast = (y: number, m: number, d: number) => new Date(y, m, d) < today;
  const isTodayDate = (y: number, m: number, d: number) =>
    new Date(y, m, d).getTime() === today.getTime();

  const effectiveEnd = checkOut || (hover && hover > checkIn ? hover : "");
  const inRange = (ds: string) => !!checkIn && !!effectiveEnd && ds > checkIn && ds < effectiveEnd;
  const isStart = (ds: string) => !!checkIn && ds === checkIn;
  const isEnd = (ds: string) => !!effectiveEnd && ds === effectiveEnd;

  const handleDayClick = (ds: string, y: number, m: number, d: number) => {
    if (isPast(y, m, d)) return;
    if (!modoFecha && isBookedAlo(y, m, d)) return;

    // Día de Sol: selección de día único (check_in = check_out)
    if (esSingleDay) {
      onRangeChange(ds, ds);
      return;
    }

    if (!checkIn || checkOut) { onRangeChange(ds, ""); return; }
    if (ds <= checkIn) { onRangeChange(ds, ""); return; }

    if (!modoFecha) {
      const cur = new Date(parseLocal(checkIn));
      cur.setDate(cur.getDate() + 1);
      const endDate = parseLocal(ds);
      while (cur < endDate) {
        if (isBookedAlo(cur.getFullYear(), cur.getMonth(), cur.getDate())) {
          onRangeChange(ds, "");
          return;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    onRangeChange(checkIn, ds);
  };

  const canGoPrev =
    base.year > today.getFullYear() ||
    (base.year === today.getFullYear() && base.month > today.getMonth());

  const loading = modoFecha ? loadingGeneral : loadingAlo;
  const showEmpty = !modoFecha && !alojamiento;

  const renderMonth = (year: number, month: number) => {
    const cells = buildCells(year, month);
    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] text-gray-400 font-medium py-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="h-11" />;

            const ds = toStr(year, month, day);
            const past = isPast(year, month, day);
            const todayCell = isTodayDate(year, month, day);
            const start = isStart(ds);
            const end = isEnd(ds);
            const ranged = inRange(ds);

            const bookedAlo = !modoFecha && !past && isBookedAlo(year, month, day);
            const cuposDiaSol = !modoFecha && esDiaDeSol && !past ? getCuposDiaDeSol(year, month, day) : null;
            const avCount = modoFecha && !past ? availableCountAt(year, month, day) : 0;
            const festivo = !past && esFestivo(ds);
            const allAvail = avCount === totalAlos;
            const noneAvail = avCount === 0;

            const disabled = past || (!modoFecha && bookedAlo);
            const showBand = !disabled && (start || end || ranged);
            const showStartBand = showBand && start && !!effectiveEnd && ds !== effectiveEnd;
            const showEndBand = showBand && end && ds !== checkIn;

            return (
              <div key={day} className="relative h-11">
                {showBand && (
                  <div
                    className="absolute inset-y-[3px] bg-[#8a6038]/15 pointer-events-none"
                    style={{
                      left: showStartBand ? "50%" : "0",
                      right: showEndBand ? "50%" : "0",
                    }}
                  />
                )}

                <button
                  className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
                  disabled={disabled}
                  onClick={() => handleDayClick(ds, year, month, day)}
                  onMouseEnter={() => {
                    if (!disabled && checkIn && !checkOut && !esSingleDay) setHover(ds);
                  }}
                  onMouseLeave={() => setHover("")}
                  title={
                    modoFecha && !past
                      ? `${avCount} de ${totalAlos} disponible${avCount !== 1 ? "s" : ""}`
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-full text-[13px] transition-colors relative z-10",
                      start || end
                        ? "bg-[#8a6038] text-white font-semibold"
                        : ranged
                          ? "text-[#8a6038] font-medium"
                          : past
                            ? "text-gray-300 cursor-default"
                            : bookedAlo
                              ? "text-red-300 line-through cursor-not-allowed"
                              : modoFecha
                                ? noneAvail
                                  ? "text-red-400 cursor-not-allowed"
                                  : festivo
                                    ? "text-orange-500 font-bold ring-2 ring-orange-400 bg-orange-50 hover:bg-orange-100 cursor-pointer"
                                    : allAvail
                                      ? todayCell
                                        ? "text-[#8a6038] ring-1 ring-[#8a6038] hover:bg-[#8a6038]/10"
                                        : "text-gray-800 hover:bg-[#8a6038]/10 cursor-pointer"
                                      : "text-amber-600 hover:bg-amber-50 cursor-pointer"
                                : festivo
                                  ? todayCell
                                    ? "text-orange-500 font-bold ring-2 ring-orange-400 bg-orange-50 hover:bg-orange-100"
                                    : "text-orange-500 font-bold ring-2 ring-orange-400 bg-orange-50 hover:bg-orange-100 cursor-pointer"
                                  : todayCell
                                    ? "text-[#8a6038] ring-1 ring-[#8a6038] hover:bg-[#8a6038]/10"
                                    : "text-gray-700 hover:bg-[#8a6038]/10 hover:text-[#3d2010] cursor-pointer"
                    )}
                  >
                    {day}
                  </span>

                  {/* Cupos Día de Sol (modo por alojamiento) */}
                  {cuposDiaSol !== null && !start && !end && (
                    <span
                      className={cn(
                        "text-[9px] leading-none font-bold",
                        cuposDiaSol === 0
                          ? "text-red-400"
                          : cuposDiaSol <= 8
                            ? "text-amber-500"
                            : "text-[#8a6038]"
                      )}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {cuposDiaSol === 0 ? "Lleno" : `${cuposDiaSol} cupos`}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Navegación */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => canGoPrev && setBase((p) => advance(p.year, p.month, -1))}
          disabled={!canGoPrev}
          className="p-2 rounded-full hover:bg-gray-100 text-[#8a6038] disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <p
          className="text-sm font-semibold text-[#3d2010]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {MONTHS[base.month]} {base.year}
        </p>
        <button
          onClick={() => setBase((p) => advance(p.year, p.month, 1))}
          className="p-2 rounded-full hover:bg-gray-100 text-[#8a6038] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Hint para modo fecha */}
      {modoFecha && !(checkIn && checkOut && checkOut !== checkIn) && !showEmpty && !loading && (
        <p
          className="text-center text-gray-400 text-xs mb-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            Para seleccionar dia de sol, elige un solo dia. Selecciona fecha de entrada y salida para alojamientos con hospedaje.                                                                                                                                                             
        </p>
      )}

      {showEmpty ? (
        <div
          className="py-10 text-center text-gray-400 text-sm"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Selecciona un alojamiento para ver disponibilidad
        </div>
      ) : loading ? (
        <div
          className="py-10 text-center text-gray-400 text-sm animate-pulse"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Verificando disponibilidad...
        </div>
      ) : (
        <div>
          {renderMonth(base.year, base.month)}
        </div>
      )}

      {/* Leyenda */}
      {!showEmpty && !loading && (
        <div
          className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-[11px]"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {modoFecha ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8a6038]" />
                <span className="text-gray-500">Todos disponibles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-gray-500">Parcialmente ocupado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-500">Sin disponibilidad</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-50 ring-2 ring-orange-400 shrink-0" />
                <span className="text-gray-500">Festivo</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8a6038]" />
                <span className="text-gray-500">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8a6038]/20 ring-1 ring-[#8a6038]/40" />
                <span className="text-gray-500">Seleccionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-200" />
                <span className="text-gray-500">No disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-50 ring-2 ring-orange-400 shrink-0" />
                <span className="text-gray-500">Festivo</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
