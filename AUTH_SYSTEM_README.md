# Sistema de Autenticación y Admin Panel - Natural Sound

## 📋 Descripción

Se ha creado un sistema completo de autenticación con página de login y dashboard administrativo para Natural Sound.

## 🗂️ Estructura de Archivos Nuevos

```
src/app/
├── context/
│   └── AuthContext.tsx          # Contexto global de autenticación
├── pages/
│   ├── LoginPage.tsx            # Página full de login/registro
│   └── AdminDashboard.tsx       # Dashboard administrativo
└── AppRouter.tsx                # Manejador de rutas y lógica
```

## 🚀 Cómo Funciona

### 1. **AuthContext.tsx**
Proporciona:
- Estado global del usuario autenticado
- Funciones: `login()`, `register()`, `logout()`
- Persistencia de datos en localStorage
- Hook `useAuth()` para acceder a la autenticación

### 2. **LoginPage.tsx**
Página completa de login con:
- Formulario de iniciar sesión
- Formulario de registro
- Cambio entre modos (login ↔ registro)
- Validación básica
- Contraseña visible/oculta

### 3. **AdminDashboard.tsx**
Panel de administración con:
- **Panel General**: Estadísticas y métricas
- **Gestión de Reservas**: Listado completo de reservas
- **Gestión de Usuarios**: Perfil de usuarios registrados
- **Configuración**: Información personal y preferencias
- Navegación por tabs
- Sidebar responsivo

### 4. **AppRouter.tsx**
Maneja:
- La lógica de rutas
- Redirección automática a login si no está autenticado
- Navegación entre la app principal, login y dashboard

## 👤 Credenciales Demo

Para acceder como **administrador**:
- **Email**: `admin@naturalsound.com`
- **Contraseña**: Cualquier contraseña (es simulado)

Otros usuarios crean cuenta regularmente con rol "user".

## 🎯 Flujo de Uso

### En la página principal:
1. Hacer clic en el botón **"Iniciar Sesión"** en la navbar
2. Se abre el modal de login
3. Ingresar credenciales o crear nueva cuenta
4. Al completar, ir al dashboard administrativo

### En el dashboard:
- Navegar entre secciones (Panel, Reservas, Usuarios, Config)
- Ver estadísticas en tiempo real
- Gestionar reservas y usuarios
- Cerrar sesión con el botón LogOut

## 📱 Características

✅ **Responsivo**: Funciona en desktop y móvil
✅ **Persistencia**: Los datos se guardan en localStorage
✅ **Validación**: Campos requeridos y validación de email
✅ **UI Consistente**: Mantiene el diseño de Natural Sound
✅ **Animaciones**: Transiciones suaves y loading states
✅ **Datos Demo**: Incluye datos ficticios para demostración

## 🔧 Integración con API

Para conectar con un backend real, modifica `AuthContext.tsx`:

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  setUser(data.user);
  localStorage.setItem("user", JSON.stringify(data.user));
};
```

## 📝 Notas

- La autenticación actual es **simulada con setTimeout**
- Los datos se guardan en **localStorage** (no es seguro para producción)
- Para producción, implementar JWT, HTTPS y backend seguro
- El dashboard muestra datos ficticios de demostración

## 🎨 Personalización

Todos los componentes usan:
- Colores y fuentes de Natural Sound
- Estilos Tailwind CSS
- Sistema de temas consistente
- Tipografía: Playfair Display (títulos), DM Sans (body), DM Mono (monospace)
