import express from 'express';
import { all, get, run } from '../database.js';
import { verificarToken } from './auth.js';

const router = express.Router();

const PREFIJOS_TIPO = { 'Glamping': 'GLM', 'Habitación': 'HAB', 'Día de Sol': 'SOL' };

const generarCodigoAlojamiento = async (tipo) => {
  const prefijo = PREFIJOS_TIPO[tipo] || 'ALO';
  const ultimo = await get(
    `SELECT codigo FROM alojamientos WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1`,
    [`${prefijo}-%`]
  );
  const siguiente = ultimo?.codigo ? parseInt(ultimo.codigo.split('-')[1], 10) + 1 : 1;
  return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
};

// Obtener todos los alojamientos
router.get('/', async (req, res) => {
  try {
    const alojamientos = await all(`SELECT * FROM alojamientos WHERE disponible = 1
      ORDER BY CASE tipo WHEN 'Glamping' THEN 1 WHEN 'Habitación' THEN 2 ELSE 3 END, nombre`);
    res.json(alojamientos);
  } catch (error) {
    console.error('Error al obtener alojamientos:', error);
    res.status(500).json({ error: 'Error al obtener alojamientos' });
  }
});

// Obtener un alojamiento específico
router.get('/:id', async (req, res) => {
  try {
    const alojamiento = await get('SELECT * FROM alojamientos WHERE id = ?', [req.params.id]);
    
    if (!alojamiento) {
      return res.status(404).json({ error: 'Alojamiento no encontrado' });
    }

    res.json(alojamiento);
  } catch (error) {
    console.error('Error al obtener alojamiento:', error);
    res.status(500).json({ error: 'Error al obtener alojamiento' });
  }
});

// Crear alojamiento (solo admin)
router.post('/', verificarToken, async (req, res) => {
  try {
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear alojamientos' });
    }

    const { nombre, tipo, descripcion, caracteristicas, imagen_url, precio_noche, capacidad } = req.body;

    if (!nombre || !tipo || !precio_noche || !capacidad) {
      return res.status(400).json({ error: 'Completa los campos obligatorios' });
    }

    const resultado = await run(
      'INSERT INTO alojamientos (nombre, tipo, descripcion, caracteristicas, imagen_url, precio_noche, capacidad) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, tipo, descripcion, caracteristicas, imagen_url, precio_noche, capacidad]
    );

    const codigo = await generarCodigoAlojamiento(tipo);
    await run('UPDATE alojamientos SET codigo = ? WHERE id = ?', [codigo, resultado.lastID]);

    res.json({
      mensaje: 'Alojamiento creado correctamente',
      id: resultado.lastID,
      codigo
    });
  } catch (error) {
    console.error('Error al crear alojamiento:', error);
    res.status(500).json({ error: 'Error al crear alojamiento' });
  }
});

// Actualizar alojamiento (solo admin)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar alojamientos' });
    }

    const alojamiento = await get('SELECT * FROM alojamientos WHERE id = ?', [req.params.id]);
    if (!alojamiento) {
      return res.status(404).json({ error: 'Alojamiento no encontrado' });
    }

    const { nombre, tipo, descripcion, caracteristicas, imagen_url, precio_noche, capacidad, disponible } = req.body;

    await run(
      'UPDATE alojamientos SET nombre = ?, tipo = ?, descripcion = ?, caracteristicas = ?, imagen_url = ?, precio_noche = ?, capacidad = ?, disponible = ? WHERE id = ?',
      [
        nombre || alojamiento.nombre,
        tipo || alojamiento.tipo,
        descripcion || alojamiento.descripcion,
        caracteristicas || alojamiento.caracteristicas,
        imagen_url || alojamiento.imagen_url,
        precio_noche || alojamiento.precio_noche,
        capacidad || alojamiento.capacidad,
        disponible !== undefined ? disponible : alojamiento.disponible,
        req.params.id
      ]
    );

    res.json({ mensaje: 'Alojamiento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar alojamiento:', error);
    res.status(500).json({ error: 'Error al actualizar alojamiento' });
  }
});

// Eliminar alojamiento (solo admin)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar alojamientos' });
    }

    const alojamiento = await get('SELECT * FROM alojamientos WHERE id = ?', [req.params.id]);
    if (!alojamiento) {
      return res.status(404).json({ error: 'Alojamiento no encontrado' });
    }

    await run('DELETE FROM alojamientos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Alojamiento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alojamiento:', error);
    res.status(500).json({ error: 'Error al eliminar alojamiento' });
  }
});

export default router;
