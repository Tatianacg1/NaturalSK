import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcryptjs from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/naturalsound.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conectado a SQLite');
    initializeDatabase();
  }
});

// Promisify para usar async/await
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Inicializar tablas
const initializeDatabase = async () => {
  try {
    // Tabla de usuarios
    await run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contraseña TEXT NOT NULL,
        rol TEXT DEFAULT 'user',
        fecha_registro TEXT DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER DEFAULT 1
      )
    `);

    // Insertar usuario admin de demostración si no existe
    const adminExists = await get('SELECT COUNT(*) as count FROM usuarios WHERE email = ?', ['admin@naturalsound.com']);
    if (adminExists.count === 0) {
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      await run(
        'INSERT INTO usuarios (nombre, email, contraseña, rol, activo) VALUES (?, ?, ?, ?, ?)',
        ['Admin Natural Sound', 'admin@naturalsound.com', hashedPassword, 'admin', 1]
      );
      console.log('Usuario admin de demostración creado: admin@naturalsound.com / admin123');
    }

    // Tabla de reservas
    await run(`
      CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        hospedaje TEXT NOT NULL,
        tipo_hospedaje TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        numero_huespedes INTEGER NOT NULL,
        estado TEXT DEFAULT 'Pendiente',
        email_huesped TEXT NOT NULL,
        nombre_huesped TEXT NOT NULL,
        cedula_huesped TEXT,
        huespedes_adicionales TEXT DEFAULT '[]',
        servicio_adicional TEXT DEFAULT 'N/A',
        valor_alojamiento REAL DEFAULT 0,
        valor_servicio_adicional REAL DEFAULT 0,
        abono REAL DEFAULT 0,
        total REAL DEFAULT 0,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    // Agregar campos nuevos a bases ya existentes.
    const columnasReserva = await all('PRAGMA table_info(reservas)');
    if (!columnasReserva.some((columna) => columna.name === 'cedula_huesped')) {
      await run('ALTER TABLE reservas ADD COLUMN cedula_huesped TEXT');
    }
    if (!columnasReserva.some((columna) => columna.name === 'huespedes_adicionales')) {
      await run("ALTER TABLE reservas ADD COLUMN huespedes_adicionales TEXT DEFAULT '[]'");
    }
    if (!columnasReserva.some((columna) => columna.name === 'servicio_adicional')) {
      await run("ALTER TABLE reservas ADD COLUMN servicio_adicional TEXT DEFAULT 'N/A'");
    }
    if (!columnasReserva.some((columna) => columna.name === 'valor_alojamiento')) {
      await run('ALTER TABLE reservas ADD COLUMN valor_alojamiento REAL DEFAULT 0');
    }
    if (!columnasReserva.some((columna) => columna.name === 'valor_servicio_adicional')) {
      await run('ALTER TABLE reservas ADD COLUMN valor_servicio_adicional REAL DEFAULT 0');
    }
    if (!columnasReserva.some((columna) => columna.name === 'abono')) {
      await run('ALTER TABLE reservas ADD COLUMN abono REAL DEFAULT 0');
    }
    if (!columnasReserva.some((columna) => columna.name === 'total')) {
      await run('ALTER TABLE reservas ADD COLUMN total REAL DEFAULT 0');
    }

    // Impedir reservas activas superpuestas del mismo alojamiento, incluso ante solicitudes simultaneas.
    await run(`
      CREATE TRIGGER IF NOT EXISTS prevenir_reservas_solapadas_insert
      BEFORE INSERT ON reservas
      WHEN NEW.estado <> 'Cancelada'
        AND EXISTS (
          SELECT 1 FROM reservas
          WHERE hospedaje = NEW.hospedaje
            AND estado <> 'Cancelada'
            AND check_in < NEW.check_out
            AND check_out > NEW.check_in
        )
      BEGIN
        SELECT RAISE(ABORT, 'El alojamiento ya tiene una reserva para las fechas seleccionadas');
      END
    `);

    await run(`
      CREATE TRIGGER IF NOT EXISTS prevenir_reservas_solapadas_update
      BEFORE UPDATE ON reservas
      WHEN NEW.estado <> 'Cancelada'
        AND EXISTS (
          SELECT 1 FROM reservas
          WHERE hospedaje = NEW.hospedaje
            AND estado <> 'Cancelada'
            AND id <> NEW.id
            AND check_in < NEW.check_out
            AND check_out > NEW.check_in
        )
      BEGIN
        SELECT RAISE(ABORT, 'El alojamiento ya tiene una reserva para las fechas seleccionadas');
      END
    `);

    // Tabla de configuración
    await run(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        recibir_notificaciones INTEGER DEFAULT 1,
        notificaciones_reservas INTEGER DEFAULT 1,
        compartir_datos INTEGER DEFAULT 0,
        tema TEXT DEFAULT 'light',
        fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    // Tabla de alojamientos
    await run(`
      CREATE TABLE IF NOT EXISTS alojamientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        caracteristicas TEXT,
        imagen_url TEXT,
        precio_noche REAL,
        capacidad INTEGER,
        disponible INTEGER DEFAULT 1
      )
    `);

    // Insertar alojamientos de demostración si no existen
    const alojamientosCount = await get('SELECT COUNT(*) as count FROM alojamientos');
    if (alojamientosCount.count === 0) {
      const alojamientos = [
        {
          nombre: 'Glamping Perla',
          tipo: 'Glamping',
          descripcion: 'Un refugio romántico diseñado para desconectarte',
          caracteristicas: 'Cama king size, Baño privado, Jacuzzi privado, Desayuno incluido',
          precio_noche: 250,
          capacidad: 2
        },
        {
          nombre: 'Glamping Esmeralda',
          tipo: 'Glamping',
          descripcion: 'Un espacio exclusivo para vivir una experiencia de descanso',
          caracteristicas: 'Chimenea, Ducha al aire libre, Jacuzzi privado, Desayuno incluido',
          precio_noche: 280,
          capacidad: 2
        },
        {
          nombre: 'Glamping Diamante',
          tipo: 'Glamping',
          descripcion: 'Plataforma elevada entre las copas de los árboles',
          caracteristicas: 'Desayuno incluido, Jacuzzi privado, Chimenea, Cama King',
          precio_noche: 320,
          capacidad: 2
        },
        {
          nombre: 'Glamping Zafiro',
          tipo: 'Glamping',
          descripcion: 'El espacio ideal para compartir momentos inolvidables',
          caracteristicas: 'Chimenea interior, Desayuno incluido, Malla catamarán, Jacuzzi privado',
          precio_noche: 350,
          capacidad: 6
        },
        {
          nombre: 'Habitación Pareja',
          tipo: 'Habitación',
          descripcion: 'Una acogedora habitación diseñada para disfrutar en pareja',
          caracteristicas: 'Balcón privado, Desayuno incluido, TV, WiFi',
          precio_noche: 150,
          capacidad: 2
        },
        {
          nombre: 'Habitación Cuadruple',
          tipo: 'Habitación',
          descripcion: 'La opción perfecta para compartir en familia o con amigos',
          caracteristicas: 'Balcón privado, Mayor capacidad, TV, WiFi',
          precio_noche: 200,
          capacidad: 4
        }
      ];

      for (const alojamiento of alojamientos) {
        await run(
          'INSERT INTO alojamientos (nombre, tipo, descripcion, caracteristicas, precio_noche, capacidad) VALUES (?, ?, ?, ?, ?, ?)',
          [alojamiento.nombre, alojamiento.tipo, alojamiento.descripcion, alojamiento.caracteristicas, alojamiento.precio_noche, alojamiento.capacidad]
        );
      }
      console.log('Alojamientos de demostración insertados');
    }

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
};

export { db, run, get, all };
