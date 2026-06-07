// Tarifas por noche en pesos colombianos (COP)
// Tarifa baja: lunes a jueves (sin festivo ni temporada alta)
// Tarifa alta: viernes, sábado, domingo, festivos colombianos y temporada alta

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SimpleRates { low: number; high: number }

// Zafiro: 2 franjas tarifarias (lun–jue / fin sem·festivos) según número de huéspedes
interface ZafiroTier {
  minGuests: number;
  maxGuests: number;
  low: number;   // lun–jue, no festivo, no temporada
  high: number;  // vie, sáb, dom, festivos, temporada alta
}

// ─── Tarifas simples ──────────────────────────────────────────────────────────

const RATES: Record<string, SimpleRates> = {
  "habitacion pareja":     { low: 370_000, high: 450_000 },
  "habitacion cuadruple":  { low: 620_000, high: 750_000 },
  "glamping turquesa":     { low: 480_000, high: 650_000 },
  "glamping esmeralda":    { low: 480_000, high: 650_000 },
  "glamping perla":        { low: 480_000, high: 650_000 },
  "glamping diamante":     { low: 530_000, high: 690_000 },
};

// ─── Tarifa Día de Sol (entrada + consumibles por persona) ───────────────────

interface DiaSolTarifa { entrada: number; consumibles: number }

const DIA_DE_SOL_RATES: { low: DiaSolTarifa; high: DiaSolTarifa } = {
  low:  { entrada: 120_000, consumibles: 30_000 },  // lun–jue
  high: { entrada: 170_000, consumibles: 50_000 },  // fin sem, festivos, temporada alta
};

// ─── Tarifas Zafiro (por número de huéspedes) ─────────────────────────────────

const ZAFIRO_TIERS: ZafiroTier[] = [
  { minGuests: 1, maxGuests: 2, low: 590_000,   high: 850_000   },
  { minGuests: 3, maxGuests: 4, low: 850_000,   high: 950_000   },
  { minGuests: 5, maxGuests: 6, low: 1_290_000, high: 1_390_000 },
];

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

function obtenerRates(hospedaje: string): SimpleRates | null {
  const n = normalizar(hospedaje);
  return RATES[n] ?? null;
}

function esZafiro(hospedaje: string): boolean {
  return normalizar(hospedaje) === "glamping zafiro";
}

function esDiaDeSol(hospedaje: string): boolean {
  return normalizar(hospedaje) === "dia de sol";
}

function esTarifaAlta(dateStr: string): boolean {
  const d = parseLocal(dateStr);
  const dow = d.getDay(); // 0=Dom, 5=Vie, 6=Sáb
  const esFinDeSemana = dow === 0 || dow === 5 || dow === 6;
  const esTemporadaAlta = TEMPORADA_ALTA.some(({ from, to }) => dateStr >= from && dateStr <= to);
  const esFestivo = FESTIVOS.has(dateStr);
  return esFinDeSemana || esTemporadaAlta || esFestivo;
}

/** Devuelve el tier de Zafiro según número de huéspedes. */
function getZafiroTier(guests: number): ZafiroTier {
  return (
    ZAFIRO_TIERS.find(t => guests >= t.minGuests && guests <= t.maxGuests) ??
    ZAFIRO_TIERS[ZAFIRO_TIERS.length - 1]
  );
}

/** Precio de una noche en Zafiro según día y número de huéspedes. */
function precioNocheZafiro(dateStr: string, guests: number): number {
  const tier = getZafiroTier(guests);
  return esTarifaAlta(dateStr) ? tier.high : tier.low;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Precio de UNA noche (la que comienza en `dateStr`) en COP. 0 si no hay tarifa. */
export function precioNoche(hospedaje: string, dateStr: string, guests = 2): number {
  if (esZafiro(hospedaje)) return precioNocheZafiro(dateStr, guests);
  const rates = obtenerRates(hospedaje);
  if (!rates) return 0;
  return esTarifaAlta(dateStr) ? rates.high : rates.low;
}

/** Precio TOTAL del rango check_in → check_out (suma de noches) en COP. */
export function precioTotal(hospedaje: string, checkIn: string, checkOut: string, guests = 2): number {
  if (!hospedaje || !checkIn) return 0;

  if (esDiaDeSol(hospedaje)) {
    const rates = esTarifaAlta(checkIn) ? DIA_DE_SOL_RATES.high : DIA_DE_SOL_RATES.low;
    return rates.entrada * guests;
  }

  if (!checkOut) return 0;

  let total = 0;
  const cur = parseLocal(checkIn);
  const end = parseLocal(checkOut);

  if (esZafiro(hospedaje)) {
    while (cur < end) {
      total += precioNocheZafiro(toDateStr(cur), guests);
      cur.setDate(cur.getDate() + 1);
    }
    return total;
  }

  const rates = obtenerRates(hospedaje);
  if (!rates) return 0;
  while (cur < end) {
    const s = toDateStr(cur);
    total += esTarifaAlta(s) ? rates.high : rates.low;
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

/** Devuelve las tarifas base del alojamiento para mostrar en UI, o null si no está definido. */
export function tarifasBase(hospedaje: string, guests = 2): SimpleRates | null {
  if (esZafiro(hospedaje)) {
    const tier = getZafiroTier(guests);
    return { low: tier.low, high: tier.high };
  }
  if (esDiaDeSol(hospedaje)) {
    return {
      low: DIA_DE_SOL_RATES.low.entrada,
      high: DIA_DE_SOL_RATES.high.entrada,
    };
  }
  return obtenerRates(hospedaje);
}

/** Devuelve todos los tiers de Zafiro (para mostrar tabla de tarifas en UI). */
export function tarifasZafiroTiers(): ZafiroTier[] {
  return ZAFIRO_TIERS;
}

/** Devuelve las tarifas de Día de Sol (entrada + consumibles) para mostrar en UI. */
export function tarifasDiaDeSol(): { low: DiaSolTarifa; high: DiaSolTarifa } {
  return DIA_DE_SOL_RATES;
}

/** True si el alojamiento tiene tarifa definida. */
export function tieneTarifa(hospedaje: string): boolean {
  return esZafiro(hospedaje) || esDiaDeSol(hospedaje) || obtenerRates(hospedaje) !== null;
}

/** Máximo de huéspedes permitido según alojamiento. */
export function maxHuespedes(hospedaje: string): number {
  const n = normalizar(hospedaje);
  if (n === 'glamping zafiro') return 7;
  if (n.startsWith('glamping')) return 2;
  if (n === 'habitacion pareja') return 2;
  if (n === 'habitacion cuadruple') return 4;
  if (n.includes('dia de sol') || n.includes('día de sol')) return 8;
  return 8;
}

// ─── Servicios adicionales ────────────────────────────────────────────────────

type GrupoServicio = 'perla-diamante' | 'esmeralda' | 'zafiro-turquesa' | 'habitacion-pareja' | 'habitacion-cuadruple' | 'dia-de-sol';

function getGrupoServicio(hospedaje: string): GrupoServicio | null {
  const n = normalizar(hospedaje);
  if (!n) return null;
  if (n.includes('zafiro') || n.includes('turquesa')) return 'zafiro-turquesa';
  if (n.includes('esmeralda')) return 'esmeralda';
  if (n.includes('glamping')) return 'perla-diamante';
  if (n.includes('pareja')) return 'habitacion-pareja';
  if (n.includes('cuadruple') || n.includes('familiar')) return 'habitacion-cuadruple';
  if (n.includes('dia de sol') || n.includes('día de sol')) return 'dia-de-sol';
  return null;
}

interface ServicioConfig {
  label: string;
  precios: Partial<Record<GrupoServicio, number>>;
  requiereColor: boolean;
  precioDinamico?: (grupo: GrupoServicio, huespedes: number) => number;
}

const SERVICIOS: Record<string, ServicioConfig> = {
  'Decoracion de cumpleaños': {
    label: 'Decoración de cumpleaños',
    precios: { 'perla-diamante': 135_000, 'esmeralda': 135_000, 'zafiro-turquesa': 190_000, 'habitacion-pareja': 120_000, 'habitacion-cuadruple': 135_000 },
    requiereColor: true,
  },
  'Decoracion de aniversario': {
    label: 'Decoración de aniversario',
    precios: { 'perla-diamante': 120_000, 'esmeralda': 120_000, 'zafiro-turquesa': 160_000, 'habitacion-pareja': 120_000, 'habitacion-cuadruple': 135_000 },
    requiereColor: true,
  },
  'Decoracion romantica': {
    label: 'Decoración romántica',
    precios: { 'perla-diamante': 120_000, 'esmeralda': 120_000, 'zafiro-turquesa': 160_000, 'habitacion-pareja': 120_000, 'habitacion-cuadruple': 135_000 },
    requiereColor: false,
  },
  'Desayuno privado en termal': {
    label: 'Desayuno privado en termal',
    precios: {
      'perla-diamante': 120_000,
      'esmeralda': 120_000,
      'zafiro-turquesa': 120_000,
      'habitacion-pareja': 120_000,
      'habitacion-cuadruple': 120_000,
    },
    requiereColor: false,
  },
  'Decoracion cena': {
    label: 'Decoración cena',
    precios: {
      'perla-diamante': 30_000,
      'esmeralda': 30_000,
      'zafiro-turquesa': 30_000,
      'habitacion-pareja': 30_000,
      'habitacion-cuadruple': 30_000,
      'dia-de-sol': 30_000,
    },
    requiereColor: true,
    precioDinamico: (_grupo, huespedes) => huespedes > 2 ? 45_000 : 30_000,
  },
  'Decoracion quieres ser mi novia': {
    label: '¿Quieres ser mi novia? 💍',
    precios: { 'perla-diamante': 150_000, 'zafiro-turquesa': 190_000 },
    requiereColor: false,
  },
};

export const COLORES_DECORACION = ['Rosada', 'Roja', 'Plateado', 'Dorado'] as const;

/** Lista de servicios disponibles para un alojamiento (sin incluir N/A). */
export function serviciosDisponibles(hospedaje: string): string[] {
  const grupo = getGrupoServicio(hospedaje);
  if (!grupo) return [];
  return Object.entries(SERVICIOS)
    .filter(([, cfg]) => grupo in cfg.precios)
    .map(([key]) => key);
}

/** Precio del servicio adicional según alojamiento y número de huéspedes. */
export function precioServicio(hospedaje: string, servicio: string, huespedes = 1): number {
  if (!servicio || servicio === 'N/A') return 0;
  const cfg = SERVICIOS[servicio];
  if (!cfg) return 0;
  const grupo = getGrupoServicio(hospedaje);
  if (!grupo) return 0;
  if (cfg.precioDinamico) return cfg.precioDinamico(grupo, huespedes);
  return cfg.precios[grupo] ?? 0;
}

/** Nombre de display del servicio (con acentos). */
export function labelServicio(servicio: string): string {
  return SERVICIOS[servicio]?.label ?? servicio;
}

/** True si el servicio requiere selección de color. */
export function servicioRequiereColor(servicio: string): boolean {
  return SERVICIOS[servicio]?.requiereColor ?? false;
}

/** True si el servicio requiere mensaje personalizado. */
export function servicioTieneMensaje(servicio: string): boolean {
  return servicio === 'Decoracion cena';
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
