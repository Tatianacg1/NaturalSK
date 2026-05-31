import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import reservasRoutes from './routes/reservas.js';
import usuariosRoutes from './routes/usuarios.js';
import alojamientosRoutes from './routes/alojamientos.js';
import correosRoutes from './routes/correos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/alojamientos', alojamientosRoutes);
app.use('/api/correos', correosRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando correctamente' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Frontend en http://localhost:5173`);
  console.log(`\nEndpoints disponibles:`);
  console.log(`POST   /api/auth/register`);
  console.log(`POST   /api/auth/login`);
  console.log(`GET    /api/auth/me`);
  console.log(`GET    /api/reservas`);
  console.log(`POST   /api/reservas`);
  console.log(`PUT    /api/reservas/:id`);
  console.log(`DELETE /api/reservas/:id`);
  console.log(`GET    /api/usuarios`);
  console.log(`GET    /api/usuarios/perfil/actual`);
  console.log(`PUT    /api/usuarios/perfil/actual`);
  console.log(`GET    /api/alojamientos`);
  console.log(`GET    /api/alojamientos/:id`);
});

export default app;
