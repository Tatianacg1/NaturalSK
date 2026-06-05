# Backend Natural Sound

Backend completamente funcional para la aplicación Natural Sound Glamping.

## Características

✅ Autenticación con JWT
✅ Base de datos SQLite
✅ CRUD de reservas
✅ Gestión de usuarios
✅ Gestión de alojamientos
✅ Sistema de roles (admin/user)
✅ Contraseñas hasheadas con bcryptjs
✅ CORS habilitado para el frontend

## Instalación

### Requisitos
- Node.js 16+
- npm o pnpm

### Pasos

1. **Instalar dependencias**
```bash
cd server
npm install
```

2. **Crear archivo .env**
```bash
cp .env.example .env
```

3. **Iniciar el servidor**
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:5000`

## Estructura de Carpetas

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.js         # Autenticación y login
│   │   ├── reservas.js     # Gestión de reservas
│   │   ├── usuarios.js     # Gestión de usuarios
│   │   └── alojamientos.js # Gestión de alojamientos
│   ├── database.js         # Configuración SQLite
│   └── server.js           # Servidor principal
├── data/
│   └── naturalsound.db     # Base de datos (se crea automáticamente)
├── .env.example            # Variables de entorno de ejemplo
└── package.json
```

## Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)

### Reservas
- `GET /api/reservas` - Obtener reservas (requiere token)
- `POST /api/reservas` - Crear reserva (requiere token)
- `GET /api/reservas/:id` - Obtener reserva específica (requiere token)
- `PUT /api/reservas/:id` - Actualizar reserva (requiere token)
- `DELETE /api/reservas/:id` - Eliminar reserva (requiere token)

### Usuarios
- `GET /api/usuarios` - Obtener todos los usuarios (solo admin)
- `GET /api/usuarios/perfil/actual` - Obtener perfil actual (requiere token)
- `PUT /api/usuarios/perfil/actual` - Actualizar perfil (requiere token)
- `GET /api/usuarios/config/:userId` - Obtener configuración
- `PUT /api/usuarios/config/:userId` - Actualizar configuración
- `DELETE /api/usuarios/:id` - Eliminar usuario (solo admin)

### Alojamientos
- `GET /api/alojamientos` - Obtener todos los alojamientos
- `GET /api/alojamientos/:id` - Obtener alojamiento específico
- `POST /api/alojamientos` - Crear alojamiento (solo admin, requiere token)
- `PUT /api/alojamientos/:id` - Actualizar alojamiento (solo admin)
- `DELETE /api/alojamientos/:id` - Eliminar alojamiento (solo admin)

## Ejemplos de Uso

### Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@example.com","contraseña":"password123"}'
```

### Iniciar sesión
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@naturalsound.com","contraseña":"admin123"}'
```

### Crear reserva
```bash
curl -X POST http://localhost:5000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "hospedaje":"Glamping Perla",
    "tipo_hospedaje":"Glamping",
    "check_in":"2026-05-25",
    "check_out":"2026-05-28",
    "numero_huespedes":2,
    "email_huesped":"huesped@example.com",
    "nombre_huesped":"Nombre Huesped"
  }'
```

## Datos de Demostración

El sistema crea automáticamente 6 alojamientos de demostración:
- Glamping Perla
- Glamping Esmeralda
- Glamping Diamante
- Glamping Zafiro
- Habitación Pareja
- Habitación Cuadruple

## Base de Datos

Tablas principales:
- **usuarios** - Información de usuarios registrados
- **reservas** - Todas las reservas realizadas
- **alojamientos** - Información de los alojamientos
- **configuracion** - Preferencias de cada usuario

## Seguridad

- Contraseñas hasheadas con bcryptjs
- JWT para autenticación
- Middleware de verificación de token
- Control de roles (admin/user)
- CORS configurado
- Validación de entrada

## Próximas Mejoras

- [ ] Integración con sistema de pagos (Stripe/PayPal)
- [ ] Sistema de notificaciones por email
- [ ] Historial de cambios
- [ ] Reseñas y comentarios
- [ ] Sistema de disponibilidad de fechas
- [ ] Reportes y estadísticas avanzadas

## Soporte

Para más información, contacta al equipo de desarrollo.
