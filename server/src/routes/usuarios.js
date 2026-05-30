import express from 'express';
import bcryptjs from 'bcryptjs';
import { all, get, run } from '../database.js';
import { verificarToken } from './auth.js';

const router = express.Router();

const verificarAdmin = async (usuarioId) => {
  const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [usuarioId]);
  return usuario?.rol === 'admin';
};

// Obtener todos los usuarios (solo admin)
router.get('/', verificarToken, async (req, res) => {
  try {
    const usuario = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver usuarios' });
    }

    const usuarios = await all('SELECT id, nombre, email, rol, fecha_registro, activo FROM usuarios ORDER BY fecha_registro DESC');
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear usuario desde el panel administrativo
router.post('/', verificarToken, async (req, res) => {
  try {
    if (!await verificarAdmin(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
    }

    const { nombre, email, contrasena, rol = 'user', activo = 1 } = req.body;
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Completa nombre, email y contraseña' });
    }

    const usuarioExistente = await get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    const contrasenaHash = await bcryptjs.hash(contrasena, 10);
    const resultado = await run(
      'INSERT INTO usuarios (nombre, email, contraseña, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, contrasenaHash, rol === 'admin' ? 'admin' : 'user', activo ? 1 : 0]
    );
    await run('INSERT INTO configuracion (usuario_id) VALUES (?)', [resultado.lastID]);

    res.json({ mensaje: 'Usuario creado correctamente', id: resultado.lastID });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Obtener perfil del usuario actual
router.get('/perfil/actual', verificarToken, async (req, res) => {
  try {
    const usuario = await get(
      'SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil del usuario
router.put('/perfil/actual', verificarToken, async (req, res) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Completa todos los campos' });
    }

    // Verificar que el email no esté en uso por otro usuario
    const usuarioExistente = await get(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, req.usuario.id]
    );

    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    await run(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, req.usuario.id]
    );

    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Obtener configuración del usuario
router.get('/config/:userId', verificarToken, async (req, res) => {
  try {
    // Verificar que sea el mismo usuario o admin
    const usuarioActual = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuarioActual.rol !== 'admin' && parseInt(req.params.userId) !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta configuración' });
    }

    let config = await get('SELECT * FROM configuracion WHERE usuario_id = ?', [req.params.userId]);

    if (!config) {
      await run('INSERT INTO configuracion (usuario_id) VALUES (?)', [req.params.userId]);
      config = await get('SELECT * FROM configuracion WHERE usuario_id = ?', [req.params.userId]);
    }

    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Actualizar configuración del usuario
router.put('/config/:userId', verificarToken, async (req, res) => {
  try {
    // Verificar que sea el mismo usuario o admin
    const usuarioActual = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuarioActual.rol !== 'admin' && parseInt(req.params.userId) !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta configuración' });
    }

    const { recibir_notificaciones, notificaciones_reservas, compartir_datos, tema } = req.body;

    await run(
      'UPDATE configuracion SET recibir_notificaciones = ?, notificaciones_reservas = ?, compartir_datos = ?, tema = ? WHERE usuario_id = ?',
      [recibir_notificaciones, notificaciones_reservas, compartir_datos, tema, req.params.userId]
    );

    res.json({ mensaje: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// Editar usuario desde el panel administrativo
router.put('/:id', verificarToken, async (req, res) => {
  try {
    if (!await verificarAdmin(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo administradores pueden editar usuarios' });
    }

    const usuario = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { nombre, email, contrasena, rol, activo } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Completa nombre y email' });
    }

    const usuarioExistente = await get(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, req.params.id]
    );
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    const contrasenaHash = contrasena
      ? await bcryptjs.hash(contrasena, 10)
      : usuario.contraseña;
    await run(
      'UPDATE usuarios SET nombre = ?, email = ?, contraseña = ?, rol = ?, activo = ? WHERE id = ?',
      [
        nombre,
        email,
        contrasenaHash,
        rol === 'admin' ? 'admin' : 'user',
        activo ? 1 : 0,
        req.params.id
      ]
    );

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioActual = await get('SELECT rol FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (usuarioActual.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar usuarios' });
    }

    // No permitir auto-eliminación
    if (parseInt(req.params.id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    await run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
