// Esquema de codigos de identificacion para alojamientos y usuarios.
// Formato: PREFIJO-NNN  (ej. GLM-001, HAB-001, SOL-001, ADM-001, USR-001)

export const PREFIJOS_ALOJAMIENTO = {
  Glamping: 'GLM',
  Habitación: 'HAB',
  'Día de Sol': 'SOL',
} as const;

export const PREFIJOS_USUARIO = {
  admin: 'ADM',
  user: 'USR',
} as const;

// Codigos asignados a los alojamientos existentes (seed data)
export const CODIGOS_ALOJAMIENTO: Record<string, string> = {
  'Glamping Perla':       'GLM-001',
  'Glamping Esmeralda':   'GLM-002',
  'Glamping Diamante':    'GLM-003',
  'Glamping Zafiro':      'GLM-004',
  'Glamping Turquesa':    'GLM-005',
  'Día de Sol':           'SOL-001',
  'Habitación Pareja':    'HAB-001',
  'Habitación Cuadruple': 'HAB-002',
};
