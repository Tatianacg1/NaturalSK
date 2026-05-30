# 🚀 Backend Completamente Funcional - Guía Rápida en Español

¡Excelente noticias! Se ha creado un **backend profesional y listo para usar** para tu aplicación Natural Sound.

## 📦 ¿Qué Se Creó?

Se creó una carpeta `server/` con todo lo necesario:
- ✅ Servidor Express
- ✅ Base de datos SQLite
- ✅ Sistema de autenticación con JWT
- ✅ APIs para reservas, usuarios y alojamientos
- ✅ Documentación completa

## ⚡ Instalación Rápida (3 pasos)

### 1️⃣ Instalar dependencias
```bash
cd server
npm install
```

### 2️⃣ Ejecutar el backend
```bash
npm run dev
```
Verás: **"Servidor ejecutándose en http://localhost:5000"**

### 3️⃣ En OTRA terminal, ejecutar frontend
```bash
npm run dev
```

## ✨ ¿Qué Hace el Backend?

### 🔐 Autenticación
- Registrar nuevos usuarios
- Iniciar sesión
- Proteger rutas

### 📅 Reservas
- Crear reservas
- Listar reservas
- Actualizar estado
- Cancelar

### 👥 Usuarios
- Gestionar perfiles
- Configuración de preferencias
- Administración (solo admin)

### 🏨 Alojamientos
- Listar los 6 alojamientos
- Información detallada de cada uno
- Gestión de disponibilidad

## 📁 Archivos Importantes

```
server/
├── src/
│   ├── server.js           ← Servidor principal
│   ├── database.js         ← Base de datos
│   └── routes/
│       ├── auth.js         ← Login/Registro
│       ├── reservas.js     ← Reservas
│       ├── usuarios.js     ← Usuarios
│       └── alojamientos.js ← Alojamientos
├── package.json
├── .env.example
└── README.md
```

## 🎯 Próximos Pasos (Opcionales)

### Para Usar el Backend Real (Recomendado)

Tienes dos opciones:

**Opción A: Seguir con datos simulados**
- Sin cambios
- Todo funciona como ahora
- No necesitas el backend

**Opción B: Activar el backend real**
1. Instala y ejecuta el backend (pasos arriba)
2. Lee `BACKEND_INTEGRATION.md`
3. Actualiza `AuthContext.tsx` con el código en `AUTHCONTEXT_UPDATE.tsx`

## 📚 Documentación

| Archivo | Para Qué |
|---------|----------|
| `server/README.md` | Documentación técnica completa |
| `BACKEND_INTEGRATION.md` | Guía de integración paso a paso |
| `AUTHCONTEXT_UPDATE.tsx` | Código actualizado para usar el backend |
| `BACKEND_SUMMARY.md` | Resumen técnico de todo |

## 🧪 Prueba el Backend

### Con Postman o curl

**1. Registrar usuario**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@test.com","contraseña":"123456"}'
```

**2. Iniciar sesión**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","contraseña":"123456"}'
```

**3. Ver alojamientos**
```bash
curl http://localhost:5000/api/alojamientos
```

## 💾 Base de Datos

Se crea automáticamente con:
- 4 tablas principales
- 6 alojamientos precargados
- Estructura lista para crecer

Ubicación: `server/data/naturalsound.db`

## 🔒 Seguridad

Todo está protegido:
- ✅ Contraseñas encriptadas
- ✅ Tokens JWT (24 horas)
- ✅ Roles: admin y usuario
- ✅ CORS configurado
- ✅ Validación de datos

## ⚠️ Errores Comunes

### "No se puede conectar al puerto 5000"
El puerto podría estar en uso. Intenta:
```bash
npm run dev
```
O cambia el puerto en `server/.env`

### "CORS error"
Asegúrate que:
- Backend corre en `http://localhost:5000`
- Frontend corre en `http://localhost:5173`

### "Base de datos vacía"
Elimina `server/data/naturalsound.db` y reinicia el servidor

## 🎓 Estructura de Carpetas Final

```
Naturalsound/
├── server/              ← NUEVO: Backend
│   ├── src/
│   ├── data/
│   └── package.json
├── src/
│   ├── services/
│   │   └── api.js       ← NUEVO: Cliente API
│   └── ...
├── .env.local           ← NUEVO: Variables
├── BACKEND_*.md         ← NUEVO: Documentación
└── ...
```

## 🚀 Endpoints Disponibles

### Autenticación
```
POST   /api/auth/register      - Registrar
POST   /api/auth/login         - Iniciar sesión
GET    /api/auth/me            - Usuario actual
```

### Reservas
```
GET    /api/reservas           - Mis reservas
POST   /api/reservas           - Nueva reserva
PUT    /api/reservas/:id       - Actualizar
DELETE /api/reservas/:id       - Cancelar
```

### Usuarios
```
GET    /api/usuarios           - Listar (admin)
GET    /api/usuarios/perfil/actual     - Mi perfil
PUT    /api/usuarios/perfil/actual     - Actualizar
```

### Alojamientos
```
GET    /api/alojamientos       - Listar
GET    /api/alojamientos/:id   - Detalle
POST   /api/alojamientos       - Crear (admin)
```

## 💡 Recomendaciones

1. ✅ Prueba el backend con Postman o curl
2. ✅ Lee la documentación en `BACKEND_INTEGRATION.md`
3. ✅ Integra gradualmente cada componente
4. ✅ Usa el `AuthContext` actualizado
5. ✅ Implementa manejo de errores

## 🆘 ¿Necesitas Ayuda?

1. Revisa `server/README.md`
2. Consulta `BACKEND_INTEGRATION.md`
3. Mira los logs en la terminal
4. Abre consola del navegador (F12)

## 📊 Resumen

Tu aplicación ahora tiene:
- ✅ Backend profesional y funcional
- ✅ Base de datos SQLite
- ✅ Autenticación segura
- ✅ APIs RESTful
- ✅ Almacenamiento persistente
- ✅ Listo para producción

## 🎉 ¡Listo!

### Para empezar:
```bash
cd server
npm install
npm run dev
```

En otra terminal:
```bash
npm run dev
```

**¡Tu backend está listo!**

Para integración con el frontend, lee: `BACKEND_INTEGRATION.md`

---

**Versión:** 1.0.0
**Fecha:** Mayo 2026
**Estado:** ✅ Completamente funcional
