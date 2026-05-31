import express from 'express';
import { randomUUID } from 'crypto';
import { get, all, run } from '../database.js';
import { verificarToken } from './auth.js';
import { enviarEmailConfirmacion, enviarWhatsAppMeta, generarMensajeWhatsApp } from '../notifications.js';

const router = express.Router();
const mensajeSinDisponibilidad = 'El alojamiento ya tiene una reserva para las fechas seleccionadas';

const mapReserva = (reserva) => ({
  ...reserva,
  huespedes_adicionales: reserva.huespedes_adicionales
    ? JSON.parse(reserva.huespedes_adicionales)
    : [],
  datos_completados: !!reserva.datos_completados,
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

// Crear nueva reserva — solo hospedaje, check_in y check_out son obligatorios.
// Se genera un token público para que el huésped complete sus datos via enlace.
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      hospedaje,
      tipo_hospedaje,
      check_in,
      check_out,
      numero_huespedes = 1,
      email_huesped = '',
      nombre_huesped = '',
      cedula_huesped = '',
      telefono_huesped = '',
      huespedes_adicionales = [],
      servicio_adicional = 'N/A',
      valor_alojamiento,
      valor_servicio_adicional = 0,
      abono = 0,
      estado = 'Pendiente'
    } = req.body;

    if (!hospedaje || !check_in || !check_out) {
      return res.status(400).json({ error: 'Hospedaje, check-in y check-out son obligatorios' });
    }

    // Solo validar huéspedes adicionales cuando el admin ya ingresó los datos del principal
    if (nombre_huesped && cedula_huesped) {
      const errorHuespedes = validarHuespedes(numero_huespedes, cedula_huesped, huespedes_adicionales);
      if (errorHuespedes) {
        return res.status(400).json({ error: errorHuespedes });
      }
    }

    const errorFechas = validarFechas(check_in, check_out, hospedaje);
    if (errorFechas) {
      return res.status(400).json({ error: errorFechas });
    }

    if (estado !== 'Cancelada' && await buscarCruceDeReserva(hospedaje, check_in, check_out)) {
      return res.status(409).json({ error: mensajeSinDisponibilidad });
    }

    const valores = await calcularValoresReserva(hospedaje, valor_alojamiento, valor_servicio_adicional, abono);
    if (valores.error) {
      return res.status(400).json({ error: valores.error });
    }

    const token_publico = randomUUID();
    const datosCompletos = !!(nombre_huesped && cedula_huesped && email_huesped);

    const resultado = await run(
      `INSERT INTO reservas
        (usuario_id, hospedaje, tipo_hospedaje, check_in, check_out, numero_huespedes, estado,
         email_huesped, nombre_huesped, cedula_huesped, telefono_huesped, huespedes_adicionales,
         servicio_adicional, valor_alojamiento, valor_servicio_adicional, abono, total,
         token_publico, datos_completados)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id, hospedaje, tipo_hospedaje || 'Glamping', check_in, check_out,
        numero_huespedes, estado, email_huesped, nombre_huesped, cedula_huesped, telefono_huesped,
        JSON.stringify(huespedes_adicionales), servicio_adicional,
        valores.valor_alojamiento, valores.valor_servicio_adicional, valores.abono, valores.total,
        token_publico, datosCompletos ? 1 : 0
      ]
    );

    if (estado === 'Confirmada' && datosCompletos) {
      const reservaCreada = {
        id: resultado.lastID, hospedaje, check_in, check_out, numero_huespedes,
        estado, email_huesped, nombre_huesped, telefono_huesped,
        servicio_adicional, valor_alojamiento: valores.valor_alojamiento,
        valor_servicio_adicional: valores.valor_servicio_adicional,
        abono: valores.abono, total: valores.total
      };
      await enviarEmailConfirmacion(reservaCreada);
    }

    res.json({ mensaje: 'Reserva creada correctamente', id: resultado.lastID, token_publico });
  } catch (error) {
    if (error.message?.includes(mensajeSinDisponibilidad)) {
      return res.status(409).json({ error: mensajeSinDisponibilidad });
    }
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// ─── Rutas públicas (sin autenticación) ───────────────────────────────────────

// Consultar datos bloqueados de una reserva por token (para que el huésped vea el enlace)
router.get('/publica/:token', async (req, res) => {
  try {
    const reserva = await get(
      `SELECT r.id, r.hospedaje, r.tipo_hospedaje, r.check_in, r.check_out,
              r.usuario_id, r.datos_completados, r.estado,
              r.valor_alojamiento, r.valor_servicio_adicional, r.abono, r.total,
              u.nombre AS nombre_admin,
              a.codigo AS codigo_alojamiento, a.tipo AS tipo_alo
       FROM reservas r
       LEFT JOIN usuarios u ON r.usuario_id = u.id
       LEFT JOIN alojamientos a ON r.hospedaje = a.nombre
       WHERE r.token_publico = ?`,
      [req.params.token]
    );

    if (!reserva) {
      return res.status(404).json({ error: 'El enlace no es válido o ha expirado' });
    }

    res.json({
      id: reserva.id,
      hospedaje: reserva.hospedaje,
      tipo_hospedaje: reserva.tipo_hospedaje || reserva.tipo_alo,
      codigo_alojamiento: reserva.codigo_alojamiento,
      check_in: reserva.check_in,
      check_out: reserva.check_out,
      usuario_id: reserva.usuario_id,
      nombre_admin: reserva.nombre_admin,
      valor_alojamiento: reserva.valor_alojamiento || 0,
      valor_servicio_adicional: reserva.valor_servicio_adicional || 0,
      abono: reserva.abono || 0,
      total: reserva.total || 0,
      datos_completados: !!reserva.datos_completados,
      estado: reserva.estado,
    });
  } catch (error) {
    console.error('Error al consultar reserva pública:', error);
    res.status(500).json({ error: 'Error al consultar la reserva' });
  }
});

// Completar datos del huésped en una reserva via token
router.put('/publica/:token', async (req, res) => {
  try {
    const reserva = await get(
      `SELECT id, datos_completados, hospedaje, tipo_hospedaje, check_in, check_out,
              estado, valor_alojamiento, valor_servicio_adicional, abono, total, servicio_adicional
       FROM reservas WHERE token_publico = ?`,
      [req.params.token]
    );

    if (!reserva) {
      return res.status(404).json({ error: 'El enlace no es válido o ha expirado' });
    }
    if (reserva.datos_completados) {
      return res.status(400).json({ error: 'Esta reserva ya fue completada anteriormente' });
    }

    const {
      nombre_huesped,
      cedula_huesped,
      email_huesped,
      telefono_huesped = '',
      numero_huespedes = 1,
      huespedes_adicionales = [],
      servicio_adicional = 'N/A',
    } = req.body;

    if (!nombre_huesped || !cedula_huesped || !email_huesped) {
      return res.status(400).json({ error: 'Nombre, cédula y email son obligatorios' });
    }

    const errorHuespedes = validarHuespedes(numero_huespedes, cedula_huesped, huespedes_adicionales);
    if (errorHuespedes) {
      return res.status(400).json({ error: errorHuespedes });
    }

    await run(
      `UPDATE reservas
       SET nombre_huesped = ?, cedula_huesped = ?, email_huesped = ?, telefono_huesped = ?,
           numero_huespedes = ?, huespedes_adicionales = ?, servicio_adicional = ?,
           datos_completados = 1
       WHERE token_publico = ?`,
      [
        nombre_huesped, cedula_huesped, email_huesped, telefono_huesped,
        numero_huespedes, JSON.stringify(huespedes_adicionales), servicio_adicional,
        req.params.token
      ]
    );

    if (reserva.estado === 'Confirmada') {
      await enviarEmailConfirmacion({
        id: reserva.id,
        hospedaje: reserva.hospedaje,
        tipo_hospedaje: reserva.tipo_hospedaje,
        check_in: reserva.check_in,
        check_out: reserva.check_out,
        estado: reserva.estado,
        nombre_huesped,
        email_huesped,
        telefono_huesped,
        numero_huespedes,
        servicio_adicional,
        valor_alojamiento: reserva.valor_alojamiento,
        valor_servicio_adicional: reserva.valor_servicio_adicional,
        abono: reserva.abono,
        total: reserva.total,
      });
    }

    res.json({ mensaje: 'Datos registrados correctamente. El equipo de Natural Sound te contactará pronto.' });
  } catch (error) {
    console.error('Error al completar reserva pública:', error);
    res.status(500).json({ error: 'Error al guardar los datos' });
  }
});

// Obtener todas las reservas (cualquier usuario autenticado)
router.get('/', verificarToken, async (req, res) => {
  try {
    const reservas = await all('SELECT * FROM reservas ORDER BY fecha_creacion DESC');
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
      telefono_huesped,
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
      telefono_huesped: telefono_huesped !== undefined ? telefono_huesped : (reserva.telefono_huesped || ''),
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
      'UPDATE reservas SET estado = ?, hospedaje = ?, tipo_hospedaje = ?, check_in = ?, check_out = ?, numero_huespedes = ?, email_huesped = ?, nombre_huesped = ?, cedula_huesped = ?, telefono_huesped = ?, huespedes_adicionales = ?, servicio_adicional = ?, valor_alojamiento = ?, valor_servicio_adicional = ?, abono = ?, total = ? WHERE id = ?',
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
        reservaActualizada.telefono_huesped,
        JSON.stringify(datosAdicionales),
        reservaActualizada.servicio_adicional,
        valores.valor_alojamiento,
        valores.valor_servicio_adicional,
        valores.abono,
        valores.total,
        req.params.id
      ]
    );

    // Enviar notificaciones solo cuando se cambia a Confirmada por primera vez
    const seConfirmaAhora = reserva.estado !== 'Confirmada' && reservaActualizada.estado === 'Confirmada';
    if (seConfirmaAhora) {
      const reservaCompleta = { ...reservaActualizada, id: req.params.id, ...valores };
      await enviarEmailConfirmacion(reservaCompleta);
    }

    res.json({ mensaje: 'Reserva actualizada correctamente' });
  } catch (error) {
    if (error.message?.includes(mensajeSinDisponibilidad)) {
      return res.status(409).json({ error: mensajeSinDisponibilidad });
    }
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
});

// Reenviar correo de confirmación
router.post('/:id/email', verificarToken, async (req, res) => {
  try {

    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (!reserva.email_huesped) return res.status(400).json({ error: 'El huésped no tiene correo registrado' });

    const resultado = await enviarEmailConfirmacion({ ...reserva, id: req.params.id });
    if (!resultado.enviado) return res.status(500).json({ error: resultado.razon || 'No se pudo enviar el correo' });

    res.json({ enviado: true, mensaje: `Correo enviado a ${reserva.email_huesped}` });
  } catch (error) {
    console.error('Error al reenviar email:', error);
    res.status(500).json({ error: 'Error interno al enviar correo' });
  }
});

// Enviar WhatsApp manualmente a un huésped
router.post('/:id/whatsapp', verificarToken, async (req, res) => {
  try {
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    if (!reserva.telefono_huesped) {
      return res.status(400).json({ error: 'El huésped no tiene número de teléfono registrado' });
    }

    const datos = {
      id: reserva.id,
      nombre_huesped: reserva.nombre_huesped,
      hospedaje: reserva.hospedaje,
      check_in: reserva.check_in,
      check_out: reserva.check_out,
      numero_huespedes: reserva.numero_huespedes,
      servicio_adicional: reserva.servicio_adicional,
      telefono_huesped: reserva.telefono_huesped,
      total: reserva.total,
    };

    const resultado = await enviarWhatsAppMeta(datos);
    if (!resultado.enviado) {
      return res.status(500).json({ error: resultado.razon || 'No se pudo enviar el mensaje' });
    }

    res.json({ mensaje: 'WhatsApp enviado correctamente', messageId: resultado.messageId });
  } catch (error) {
    console.error('Error al enviar WhatsApp manual:', error);
    res.status(500).json({ error: 'Error interno al enviar WhatsApp' });
  }
});

// Eliminar reserva
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    await run('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

export default router;
