// Tarifas por noche en pesos colombianos (COP)
// Tarifa baja: lunes a jueves (sin festivo ni temporada alta)
// Tarifa alta: viernes, sábado, domingo, festivos colombianos y temporada alta

const RATES: Record<string, { low: number; high: number }> = {
  "habitacion pareja":  { low: 370_000, high: 450_000 },
  "glamping turquesa":  { low: 480_000, high: 650_000 },
  "glamping esmeralda": { low: 480_000, high: 650_000 },
  "glamping perla":     { low: 480_000, high: 650_000 },
  "glamping diamante":  { low: 530_000, high: 690_000 },
};

// Festivos colombianos observados 2025-2027
const FESTIVOS = new Set([
  // 2025
  "2025-01-01","2025-01-06","2025-03-24","2025-04-17","2025-04-18",
  "2025-05-01","2025-06-02","2025-06-23","2025-06-30","2025-07-20",
  "2025-08-07","2025-08-18","2025-10-13","2025-11-03","2025-11-17",
  "2025-12-08","2025-12-25",
  // 2026
  "2026-01-01","2026-01-12","2026-03-23","2026-04-02","2026-04-03",
  "2026-05-01","2026-05-18","2026-06-08","2026-06-15","2026-06-29",
  "2026-07-20","2026-08-07","2026-08-17","2026-10-12","2026-11-02",
  "2026-11-16","2026-12-08","2026-12-25",
  // 2027
  "2027-01-01","2027-01-11","2027-03-22","2027-03-25","2027-03-26",
  "2027-05-01","2027-05-10","2027-05-31","2027-06-07","2027-06-28",
  "2027-07-20","2027-08-07","2027-08-16","2027-10-18","2027-11-01",
  "2027-11-15","2027-12-08","2027-12-25",
]);

// Temporadas altas: 29 mar–5 abr y 6 dic–17 ene (recurrente)
const TEMPORADA_ALTA: Array<{ from: string; to: string }> = [
  { from: "2025-03-29", to: "2025-04-05" },
  { from: "2025-12-06", to: "2026-01-17" },
  { from: "2026-03-29", to: "2026-04-05" },
  { from: "2026-12-06", to: "2027-01-17" },
  { from: "2027-03-29", to: "2027-04-05" },
  { from: "2027-12-06", to: "2028-01-17" },
];

// ─── Helpers internos ─────────────────────────────────────────────────────────

function parseLocal(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function obtenerRates(hospedaje: string): { low: number; high: number } | null {
  const n = normalizar(hospedaje);
  return RATES[n] ?? null;
}

function esTarifaAlta(dateStr: string): boolean {
  const d = parseLocal(dateStr);
  const dow = d.getDay(); // 0=Dom, 5=Vie, 6=Sáb
  const esFinDeSemana = dow === 0 || dow === 5 || dow === 6;
  const esTemporadaAlta = TEMPORADA_ALTA.some(({ from, to }) => dateStr >= from && dateStr <= to);
  const esFestivo = FESTIVOS.has(dateStr);
  return esFinDeSemana || esTemporadaAlta || esFestivo;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Precio de UNA noche (la que comienza en `dateStr`) en COP. 0 si no hay tarifa. */
export function precioNoche(hospedaje: string, dateStr: string): number {
  const rates = obtenerRates(hospedaje);
  if (!rates) return 0;
  return esTarifaAlta(dateStr) ? rates.high : rates.low;
}

/** Precio TOTAL del rango check_in → check_out (suma de noches) en COP. */
export function precioTotal(hospedaje: string, checkIn: string, checkOut: string): number {
  if (!hospedaje || !checkIn || !checkOut) return 0;
  const rates = obtenerRates(hospedaje);
  if (!rates) return 0;

  let total = 0;
  const cur = parseLocal(checkIn);
  const end = parseLocal(checkOut);
  while (cur < end) {
    const s = toDateStr(cur);
    total += esTarifaAlta(s) ? rates.high : rates.low;
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

/** Devuelve las tarifas base del alojamiento para mostrar en UI, o null si no está definido. */
export function tarifasBase(hospedaje: string): { low: number; high: number } | null {
  return obtenerRates(hospedaje);
}

/** True si el alojamiento tiene tarifa definida. */
export function tieneTarifa(hospedaje: string): boolean {
  return obtenerRates(hospedaje) !== null;
}

/** Formatea un número como moneda COP. */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** True si la fecha es festivo colombiano. */
export function esFestivo(dateStr: string): boolean {
  return FESTIVOS.has(dateStr);
}

/** Texto corto del tipo de tarifa para una fecha. */
export function labelTarifa(dateStr: string): "Alta" | "Baja" {
  return esTarifaAlta(dateStr) ? "Alta" : "Baja";
}
