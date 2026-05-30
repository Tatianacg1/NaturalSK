# Guía de Integración Backend-Frontend

Este documento explica cómo integrar el backend con tu aplicación React.

## Instalación Rápida

### 1. Instalar Dependencias del Backend
```bash
cd server
npm install
```

### 2. Iniciar el Backend
```bash
npm run dev
```
El servidor se ejecutará en `http://localhost:5000`

### 3. Iniciar el Frontend
En otra terminal:
```bash
npm run dev
```
El frontend se ejecutará en `http://localhost:5173`

## Estructura de Carpetas Creada

```
naturalsound/
├── server/
│   ├── src/
│   │   ├── database.js         ← Configuración SQLite
│   │   ├── server.js           ← Servidor Express
│   │   └── routes/
│   │       ├── auth.js         ← Autenticación
│   │       ├── reservas.js     ← Reservas CRUD
│   │       ├── usuarios.js     ← Usuarios CRUD
│   │       └── alojamientos.js ← Alojamientos CRUD
│   ├── data/
│   │   └── naturalsound.db     ← Base de datos (se crea automáticamente)
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── src/
│   └── services/
│       └── api.js              ← Cliente API para el frontend
├── .env.local                  ← Variables de entorno frontend
└── ...resto del proyecto

```

## Funcionalidades del Backend

### Base de Datos
- **SQLite** con 4 tablas principales:
  - `usuarios` - Información de usuarios registrados
  - `reservas` - Todas las reservas
  - `alojamientos` - Catálogo de alojamientos
  - `configuracion` - Preferencias de usuarios

### Autenticación
- Registro de usuarios
- Login con JWT
- Contraseñas hasheadas con bcryptjs
- Protección de rutas privadas

### Datos Precargados
El sistema crea automáticamente 6 alojamientos:
- Glamping Perla ($250/noche)
- Glamping Esmeralda ($280/noche)
- Glamping Diamante ($320/noche)
- Glamping Zafiro ($350/noche)
- Habitación Pareja ($150/noche)
- Habitación Cuadruple ($200/noche)

## Próximos Pasos para Integración Completa

### 1. Actualizar AuthContext (Recomendado)
Actualmente el `AuthContext.tsx` usa datos mock. Para usar el backend real:

```typescript
// src/app/context/AuthContext.tsx - Cambios necesarios

import { authAPI } from '../services/api.js';

const login = async (email: string, password: string) => {
  const response = await authAPI.login({ email, contraseña: password });
  localStorage.setItem('authToken', response.token);
  // Actualizar state con el usuario...
};

const register = async (name: string, email: string, password: string) => {
  const response = await authAPI.register({ 
    nombre: name, 
    email, 
    contraseña: password 
  });
  // Manejar el nuevo usuario...
};
```

### 2. Conectar Reservas al Backend
En el AdminDashboard, reemplazar datos mock con API:

```typescript
useEffect(() => {
  const fetchReservas = async () => {
    const data = await reservasAPI.getAll();
    setReservas(data);
  };
  fetchReservas();
}, []);
```

### 3. Conectar Usuarios al Backend
En el AdminDashboard:

```typescript
useEffect(() => {
  const fetchUsuarios = async () => {
    const data = await usuariosAPI.getAll();
    setUsuarios(data);
  };
  fetchUsuarios();
}, []);
```

### 4. Conectar Alojamientos
En la página principal, cargar alojamientos reales:

```typescript
useEffect(() => {
  const fetchAlojamientos = async () => {
    const data = await alojamientosAPI.getAll();
    setAccommodations(data);
  };
  fetchAlojamientos();
}, []);
```

## Variables de Entorno

### Backend (.env)
```
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## Credenciales de Demo

El backend viene con datos de demostración. Para crear un nuevo usuario admin:

```bash
# POST /api/auth/register
{
  "nombre": "Admin",
  "email": "admin@naturalsound.com",
  "contraseña": "admin123"
}
```

## Endpoints Disponibles

### 🔐 Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Obtener usuario actual |

### 📅 Reservas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reservas` | Obtener mis reservas |
| POST | `/reservas` | Crear reserva |
| GET | `/reservas/:id` | Obtener reserva |
| PUT | `/reservas/:id` | Actualizar reserva |
| DELETE | `/reservas/:id` | Cancelar reserva |

### 👥 Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Listar usuarios (admin) |
| GET | `/usuarios/perfil/actual` | Mi perfil |
| PUT | `/usuarios/perfil/actual` | Actualizar perfil |
| GET | `/usuarios/config/:id` | Obtener configuración |
| PUT | `/usuarios/config/:id` | Guardar configuración |

### 🏨 Alojamientos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alojamientos` | Listar alojamientos |
| GET | `/alojamientos/:id` | Obtener alojamiento |
| POST | `/alojamientos` | Crear (admin) |
| PUT | `/alojamientos/:id` | Actualizar (admin) |
| DELETE | `/alojamientos/:id` | Eliminar (admin) |

## Uso del Cliente API

El archivo `src/services/api.js` proporciona funciones listas para usar:

```typescript
import { reservasAPI, usuariosAPI, alojamientosAPI } from '../services/api';

// Obtener todas las reservas
const reservas = await reservasAPI.getAll();

// Crear reserva
const nuevaReserva = await reservasAPI.create({
  hospedaje: 'Glamping Perla',
  tipo_hospedaje: 'Glamping',
  check_in: '2026-05-25',
  check_out: '2026-05-28',
  numero_huespedes: 2,
  email_huesped: 'huesped@example.com',
  nombre_huesped: 'Juan García'
});

// Obtener alojamientos
const alojamientos = await alojamientosAPI.getAll();
```

## Troubleshooting

### Error: "Cannot GET /api/..."
- Verifica que el backend esté corriendo en puerto 5000
- Comprueba el VITE_API_URL en .env.local

### Error: "CORS error"
- El backend tiene CORS habilitado para localhost:5173
- Si usas otro puerto, actualiza `src/server.js`

### Error: "Token not provided"
- Asegúrate de que el token se guarda en localStorage
- Verifica que Authorization header se incluye en requests

### Base de datos vacía
- Elimina `server/data/naturalsound.db`
- Reinicia el servidor para reconstruir la BD

## Seguridad

⚠️ **IMPORTANTE PARA PRODUCCIÓN:**

1. Cambiar `JWT_SECRET` en .env
2. Configurar CORS properly (no usar localhost)
3. Usar HTTPS
4. Usar base de datos más robusta (PostgreSQL)
5. Añadir validación de input más estricta
6. Implementar rate limiting
7. Añadir logging y monitoreo

## Soporte

Para dudas o problemas, revisa:
- `server/README.md` - Documentación del backend
- Logs del servidor: `npm run dev`
- Logs del navegador: F12 → Console
