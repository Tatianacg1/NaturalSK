import express from 'express';
import { get, all, run } from '../database.js';
import { verificarToken } from './auth.js';

const router = express.Router();
const mensajeSinDisponibilidad = 'El alojamiento ya tiene una reserva para las fechas seleccionadas';

const mapReserva = (reserva) => ({
  ...reserva,
  huespedes_adicionales: reserva.huespedes_adicionales
    ? JSON.parse(reserva.huespedes_adicionales)
    : []
});

const validarHuespedes = (numeroHuespedes, cedulaHuesped, huespedesAdicionales = []) => {
  const cantidad = Number(numeroHuespedes);
  if (!cedulaHuesped) return 'Ingresa la cédula del huésped principal';
  if (!Number.isInteger(cantidad) || cantidad < 1) return 'El número de personas no es válido';
  if (!Array.isArray(huespedesAdicionales)) return 'Los datos de huéspedes adicionales no son válidos';
  if (huespedesAdicionales.length !== Math.max(0, cantidad - 1)) {
    return 'Completa los datos de todos los huéspedes adicionales';
  }
  if (huespedesAdicionales.some((huesped) => !huesped.nombre || !huesped.cedula || !huesped.email)) {
    return 'Completa nombre, cédula y email de cada huésped adicional';
  }
  return null;
};

const validarFechas = (checkIn, checkOut, hospedaje = '') => {
  if (Number.isNaN(Date.parse(checkIn)) || Number.isNaN(Date.parse(checkOut))) {
    return 'Ingresa fechas válidas para la reserva';
  }
  if (hospedaje !== 'Día de Sol' && checkIn >= checkOut) {
    return 'La fecha de salida debe ser posterior a la fecha de ingreso';
  }
  return null;
};

const buscarCruceDeReserva = async (hospedaje, checkIn, checkOut, reservaId = null) => {
  const alojamiento = await get('SELECT COALESCE(limite_reservas, 1) as limite FROM alojamientos WHERE nombre = ?', [hospedaje]);
  const limite = alojamiento?.limite ?? 1;

  const parametros = [hospedaje, checkOut, checkIn];
  let consulta = `
    SELECT COUNT(*) as count FROM reservas
    WHERE hospedaje = ?
      AND estado <> 'Cancelada'
      AND check_in < ?
      AND check_out > ?
  `;

  if (reservaId) {
    consulta += ' AND id <> ?';
    parametros.push(reservaId);
  }

  const resultado = await get(consulta, parametros);
  return resultado && resultado.count >= limite ? { count: resultado.count } : null;
};

const calcularValoresReserva = async (hospedaje, valorAlojamiento, valorServicioAdicional = 0, abono = 0) => {
  const alojamiento = await get('SELECT precio_noche FROM alojamientos WHERE nombre = ?', [hospedaje]);
  if (!alojamiento) {
    return { error: 'El alojamiento seleccionado no existe' };
  }

  const valor_alojamiento = Number(valorAlojamiento ?? alojamiento.precio_noche);
  const valor_servicio_adicional = Number(valorServicioAdicional);
  const valor_abono = Number(abono);

  if (
    !Number.isFinite(valor_alojamiento) ||
    !Number.isFinite(valor_servicio_adicional) ||
    !Number.isFinite(valor_abono) ||
    valor_alojamiento < 0 ||
    valor_servicio_adicional < 0 ||
    valor_abono < 0
  ) {
    return { error: 'Ingresa valores monetarios válidos' };
  }

  const subtotal = valor_alojamiento + valor_servicio_adicional;
  if (valor_abono > subtotal) {
    return { error: 'El abono no puede superar el total de la reserva' };
  }

  return {
    valor_alojamiento,
    valor_servicio_adicional,
    abono: valor_abono,
    total: subtotal - valor_abono
  };
};

// Crear nueva reserva
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      hospedaje,
      tipo_hospedaje,
      check_in,
      check_out,
      numero_huespedes,
      email_huesped,
      nombre_huesped,
      cedula_huesped,
      huespedes_adicionales = [],
      servicio_adicional = 'N/A',
      valor_alojamiento,
      valor_servicio_adicional = 0,
      abono = 0,
      estado = 'Pendiente'
    } = req.body;

    if (!hospedaje || !check_in || !check_out || !numero_huespedes || !email_huesped || !nombre_huesped) {
      return res.status(400).json({ error: 'Completa todos los campos' });
    }

    const errorHuespedes = validarHuespedes(numero_huespedes, cedula_huesped, huespedes_adicionales);
    if (errorHuespedes) {
      return res.status(400).json({ error: errorHuespedes });
    }

    const errorFechas = validarFechas(check_in, check_out, hospedaje);
    if (errorFechas) {
      return res.status(400).json({ error: errorFechas });
    }

    if (estado !== 'Cancelada' && await buscarCruceDeReserva(hospedaje, check_in, check_out)) {
      return res.status(409).json({
        error: mensajeSinDisponibilidad
      });
    }

    const valores = await calcularValoresReserva(hospedaje, valor_alojamiento, valor_servicio_adicional, abono);
    if (valores.error) {
      return res.status(400).json({ error: valores.error });
    }

    const resultado = await run(
      'INSERT INTO reservas (usuario_id, hospedaje, tipo_hospedaje, check_in, check_out, numero_huespedes, estado, email_huesped, nombre_huesped, cedula_huesped, huespedes_adicionales, servicio_adicional, valor_alojamiento, valor_servicio_adicional, abono, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.usuario.id, hospedaje, tipo_hospedaje, check_in, check_out, numero_huespedes, estado, email_huesped, nombre_huesped, cedula_huesped, JSON.stringify(huespedes_adicionales), servicio_adicional, valores.valor_alojamiento, valores.valor_servicio_adicional, valores.abono, valores.total]
    );

    res.json({ 
      mensaje: 'Reserva creada correctamente',
      id: resultado.lastID
    });
  } catch (error) {
    if (error.message?.includes(mensajeSinDisponibilidad)) {
      return res.status(409).json({ error: mensajeSinDisponibilidad });
    }
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// Obtener todas las reservas (admin)
router.get('/', verificarToken, async (req, res) => {
  try {
    // Verificar si es admin
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    let reservas;
    if (usuario.rol === 'admin') {
      // Admin ve todas las reservas
      reservas = await all('SELECT * FROM reservas ORDER BY fecha_creacion DESC');
    } else {
      // Usuario solo ve sus reservas
      reservas = await all('SELECT * FROM reservas WHERE usuario_id = ? ORDER BY fecha_creacion DESC', [req.usuario.id]);
    }

    res.json(reservas.map(mapReserva));
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// Obtener una reserva específica
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos (admin o propietario)
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (usuario.rol !== 'admin' && reserva.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta reserva' });
    }

    res.json(mapReserva(reserva));
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

// Actualizar reserva
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const {
      estado,
      hospedaje,
      tipo_hospedaje,
      check_in,
      check_out,
      numero_huespedes,
      email_huesped,
      nombre_huesped,
      cedula_huesped,
      huespedes_adicionales,
      servicio_adicional,
      valor_alojamiento,
      valor_servicio_adicional,
      abono
    } = req.body;
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (usuario.rol !== 'admin' && reserva.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta reserva' });
    }

    const datosAdicionales = huespedes_adicionales ?? JSON.parse(reserva.huespedes_adicionales || '[]');
    const errorHuespedes = validarHuespedes(
      numero_huespedes || reserva.numero_huespedes,
      cedula_huesped || reserva.cedula_huesped,
      datosAdicionales
    );
    if (errorHuespedes) {
      return res.status(400).json({ error: errorHuespedes });
    }

    const reservaActualizada = {
      estado: estado || reserva.estado,
      hospedaje: hospedaje || reserva.hospedaje,
      tipo_hospedaje: tipo_hospedaje || reserva.tipo_hospedaje,
      check_in: check_in || reserva.check_in,
      check_out: check_out || reserva.check_out,
      numero_huespedes: numero_huespedes || reserva.numero_huespedes,
      email_huesped: email_huesped || reserva.email_huesped,
      nombre_huesped: nombre_huesped || reserva.nombre_huesped,
      cedula_huesped: cedula_huesped || reserva.cedula_huesped,
      servicio_adicional: servicio_adicional || reserva.servicio_adicional || 'N/A'
    };

    const errorFechas = validarFechas(reservaActualizada.check_in, reservaActualizada.check_out, reservaActualizada.hospedaje);
    if (errorFechas) {
      return res.status(400).json({ error: errorFechas });
    }

    if (
      reservaActualizada.estado !== 'Cancelada' &&
      await buscarCruceDeReserva(
        reservaActualizada.hospedaje,
        reservaActualizada.check_in,
        reservaActualizada.check_out,
        req.params.id
      )
    ) {
      return res.status(409).json({
        error: mensajeSinDisponibilidad
      });
    }

    const valores = await calcularValoresReserva(
      reservaActualizada.hospedaje,
      valor_alojamiento ?? reserva.valor_alojamiento,
      valor_servicio_adicional ?? reserva.valor_servicio_adicional ?? 0,
      abono ?? reserva.abono ?? 0
    );
    if (valores.error) {
      return res.status(400).json({ error: valores.error });
    }

    await run(
      'UPDATE reservas SET estado = ?, hospedaje = ?, tipo_hospedaje = ?, check_in = ?, check_out = ?, numero_huespedes = ?, email_huesped = ?, nombre_huesped = ?, cedula_huesped = ?, huespedes_adicionales = ?, servicio_adicional = ?, valor_alojamiento = ?, valor_servicio_adicional = ?, abono = ?, total = ? WHERE id = ?',
      [
        reservaActualizada.estado,
        reservaActualizada.hospedaje,
        reservaActualizada.tipo_hospedaje,
        reservaActualizada.check_in,
        reservaActualizada.check_out,
        reservaActualizada.numero_huespedes,
        reservaActualizada.email_huesped,
        reservaActualizada.nombre_huesped,
        reservaActualizada.cedula_huesped,
        JSON.stringify(datosAdicionales),
        reservaActualizada.servicio_adicional,
        valores.valor_alojamiento,
        valores.valor_servicio_adicional,
        valores.abono,
        valores.total,
        req.params.id
      ]
    );

    res.json({ mensaje: 'Reserva actualizada correctamente' });
  } catch (error) {
    if (error.message?.includes(mensajeSinDisponibilidad)) {
      return res.status(409).json({ error: mensajeSinDisponibilidad });
    }
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
});

// Eliminar reserva
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (usuario.rol !== 'admin' && reserva.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reserva' });
    }

    await run('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

export default router;
