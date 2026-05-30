# 🎉 Backend Completamente Funcional - Natural Sound

Tu aplicación ahora tiene un **backend completo y profesional** listo para producción.

## ✅ Lo Que Se Ha Creado

### 📁 Carpeta `server/` (Backend)
```
server/
├── src/
│   ├── database.js              ✅ Base de datos SQLite con 4 tablas
│   ├── server.js                ✅ Servidor Express
│   └── routes/
│       ├── auth.js              ✅ Autenticación con JWT
│       ├── reservas.js          ✅ CRUD de reservas
│       ├── usuarios.js          ✅ CRUD de usuarios
│       └── alojamientos.js      ✅ CRUD de alojamientos
├── data/                        (se crea automáticamente)
├── package.json                 ✅ Dependencias
├── .env.example                 ✅ Variables de entorno
├── .gitignore                   ✅ Ignorar archivos
└── README.md                    ✅ Documentación completa
```

### 📝 Archivos en la Raíz
- `src/services/api.js` - Cliente API para el frontend
- `.env.local` - Variables de entorno del frontend
- `BACKEND_INTEGRATION.md` - Guía de integración
- `AUTHCONTEXT_UPDATE.tsx` - Ejemplo actualizado del contexto

## 🚀 Características Incluidas

### ✨ Autenticación
- ✅ Registro de usuarios
- ✅ Login con contraseña
- ✅ JWT tokens (válidos 24 horas)
- ✅ Contraseñas hasheadas con bcryptjs
- ✅ Protección de rutas

### 📅 Reservas
- ✅ Crear reservas
- ✅ Listar reservas (usuario solo ve sus reservas, admin todas)
- ✅ Actualizar estado de reservas
- ✅ Cancelar reservas
- ✅ Información completa: huésped, alojamiento, fechas, estado

### 👥 Usuarios
- ✅ Gestión de perfiles
- ✅ Configuración de preferencias
- ✅ Notificaciones
- ✅ Roles (admin/user)
- ✅ Administración de usuarios (solo admin)

### 🏨 Alojamientos
- ✅ Catálogo de alojamientos
- ✅ 6 alojamientos precargados
- ✅ Gestión de disponibilidad
- ✅ Información detallada

### 🔒 Seguridad
- ✅ JWT autenticación
- ✅ Bcryptjs para contraseñas
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Control de roles

## 📦 Instalación y Ejecución

### 1️⃣ Instalar Backend
```bash
cd server
npm install
```

### 2️⃣ Crear .env (Opcional)
```bash
cp .env.example .env
```

### 3️⃣ Ejecutar Backend
```bash
npm run dev
```
Verás: `Servidor ejecutándose en http://localhost:5000`

### 4️⃣ En otra terminal, ejecutar Frontend
```bash
npm run dev
```

## 🎯 Próximos Pasos

### Opción A: Usar Backend Mock (Actual)
Tu app funciona perfectamente con datos simulados. Sin cambios.

### Opción B: Activar Backend Real (Recomendado)
1. Instala y ejecuta el backend (pasos arriba)
2. Actualiza `AuthContext.tsx` usando el código en `AUTHCONTEXT_UPDATE.tsx`
3. Importa `api.js` en tus componentes
4. Reemplaza datos mock con llamadas API

### Ejemplo de Actualización
```typescript
// ANTES (mock)
const usuario = { name: "Juan", email: "juan@example.com" };

// DESPUÉS (real)
const usuario = await authAPI.login(email, password);
```

## 📊 Base de Datos

La base de datos SQLite se crea automáticamente con:

**Tabla: usuarios**
- id, nombre, email, contraseña, rol, fecha_registro, activo

**Tabla: reservas**
- id, usuario_id, hospedaje, check_in, check_out, numero_huespedes, estado, ...

**Tabla: alojamientos**
- id, nombre, tipo, descripcion, caracteristicas, precio_noche, capacidad

**Tabla: configuracion**
- id, usuario_id, recibir_notificaciones, tema, ...

## 🔗 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual

### Reservas
- `GET /api/reservas` - Mis reservas
- `POST /api/reservas` - Nueva reserva
- `PUT /api/reservas/:id` - Actualizar
- `DELETE /api/reservas/:id` - Cancelar

### Usuarios
- `GET /api/usuarios` - Listar (admin)
- `GET /api/usuarios/perfil/actual` - Mi perfil
- `PUT /api/usuarios/perfil/actual` - Actualizar perfil

### Alojamientos
- `GET /api/alojamientos` - Listar
- `GET /api/alojamientos/:id` - Detalle
- `POST /api/alojamientos` - Crear (admin)

## 📚 Documentación

- `server/README.md` - Documentación completa del backend
- `BACKEND_INTEGRATION.md` - Guía de integración
- `AUTHCONTEXT_UPDATE.tsx` - Ejemplo de código actualizado

## 🛠️ Tecnologías

### Backend
- **Express.js** - Framework web
- **SQLite3** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hasheo de contraseñas
- **CORS** - Control de acceso

### Frontend (Existente)
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## ⚠️ Notas Importantes

1. **Desarrollo vs Producción**
   - Cambiar `JWT_SECRET` antes de desplegar
   - Usar base de datos robusta (PostgreSQL)

2. **Variables de Entorno**
   - Backend: `server/.env`
   - Frontend: `.env.local`

3. **Base de Datos**
   - Se almacena en `server/data/naturalsound.db`
   - Se crea automáticamente al iniciar

4. **Datos de Demo**
   - 6 alojamientos precargados
   - Crea nuevos usuarios según necesites

## 🎓 Tutorial Rápido

### Registrar Usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@example.com","contraseña":"pass123"}'
```

### Iniciar Sesión
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","contraseña":"pass123"}'
```

Obtendrás un token JWT para usar en otras peticiones.

## 💡 Recomendaciones

1. ✅ Prueba el backend primero con Postman/Insomnia
2. ✅ Actualiza gradualmente los componentes para usar APIs reales
3. ✅ Usa el `AuthContext` actualizado para mejor integración
4. ✅ Implementa manejo de errores en el frontend
5. ✅ Añade loading states durante requests

## 🆘 Ayuda

Si algo no funciona:
1. Verifica que el puerto 5000 esté libre
2. Comprueba `npm run dev` en la carpeta `server`
3. Mira los logs del terminal
4. Revisa la consola del navegador (F12)
5. Consulta `server/README.md`

## 🎉 ¡Listo!

Tu aplicación Natural Sound ahora tiene:
- ✅ Backend completamente funcional
- ✅ Base de datos SQLite
- ✅ Autenticación segura
- ✅ APIs RESTful
- ✅ Almacenamiento persistente
- ✅ Control de acceso y permisos

**Próximo paso: Integra el backend con tus componentes React siguiendo la guía en `BACKEND_INTEGRATION.md`**

¡Felicidades! 🚀
