// Página del panel administrativo.
// Muestra estadísticas, gestiona reservas, usuarios y configuración en un dashboard.
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, BarChart3, Users, Calendar, Settings, Menu, X, Home } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

// Dashboard administrativo del sistema.
// Incluye navegación lateral, estadísticas, reservas, usuarios y configuración.
export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "reservas" | "usuarios" | "configuracion">("overview");

  const handleLogout = () => {
    onLogout();
  };

  // Datos de estadísticas
  const stats = [
    { label: "Reservas Totales", value: "124", icon: Calendar, change: "+12% este mes" },
    { label: "Usuarios Activos", value: "856", icon: Users, change: "+45% este mes" },
    { label: "Ingresos", value: "$18,500", icon: BarChart3, change: "+8.5% este mes" },
    { label: "Ocupación", value: "87%", icon: Home, change: "+5% este mes" },
  ];

  // Datos ficticios de reservas
  const reservas = [
    {
      id: 1,
      guest: "Juan García",
      email: "juan@example.com",
      accommodation: "Glamping Perla",
      checkIn: "2026-05-25",
      checkOut: "2026-05-28",
      status: "Confirmada",
      guests: 2,
    },
    {
      id: 2,
      guest: "María López",
      email: "maria@example.com",
      accommodation: "Glamping Esmeralda",
      checkIn: "2026-05-26",
      checkOut: "2026-05-29",
      status: "Pendiente",
      guests: 4,
    },
    {
      id: 3,
      guest: "Carlos Rodríguez",
      email: "carlos@example.com",
      accommodation: "Habitación Pareja",
      checkIn: "2026-05-27",
      checkOut: "2026-05-30",
      status: "Confirmada",
      guests: 2,
    },
  ];

  // Datos ficticios de usuarios
  const usuarios = [
    { id: 1, name: "Juan García", email: "juan@example.com", joined: "2026-01-15", status: "Activo" },
    { id: 2, name: "María López", email: "maria@example.com", joined: "2026-02-20", status: "Activo" },
    { id: 3, name: "Carlos Rodríguez", email: "carlos@example.com", joined: "2026-03-10", status: "Activo" },
  ];

  // Devuelve clases de estilo según el estado de la reserva.
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Pendiente":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      {/* Encabezado principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-foreground hover:text-primary transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1
                className="text-2xl font-semibold text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Natural Sound Admin
              </h1>
              <p
                className="text-xs text-muted-foreground tracking-wide"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Panel de Control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p
                className="text-sm text-foreground"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {user?.name}
              </p>
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {user?.role === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Barra lateral de navegación */}
        {sidebarOpen && (
          <aside className="hidden md:block w-64 bg-white border-r border-slate-200 p-6 min-h-[calc(100vh-80px)]">
            <nav className="space-y-2">
              {[
                { id: "overview", label: "Panel General", icon: BarChart3 },
                { id: "reservas", label: "Reservas", icon: Calendar },
                { id: "usuarios", label: "Usuarios", icon: Users },
                { id: "configuracion", label: "Configuración", icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                    activeTab === item.id
                      ? "bg-primary/15 border border-primary text-primary"
                      : "text-slate-600 hover:text-foreground hover:bg-slate-100"
                  }`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-6 md:p-8">
          {/* Pestaña de resumen */}
          {activeTab === "overview" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Panel General
                </h2>
                <p
                  className="text-slate-700"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Bienvenido al panel de administración de Natural Sound
                </p>
              </div>

              {/* Cuadrícula de estadísticas */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p
                          className="text-slate-700 text-sm mb-1 font-medium"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {stat.label}
                        </p>
                        <p
                          className="text-3xl font-bold text-slate-900"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {stat.value}
                        </p>
                      </div>
                      <stat.icon size={24} className="text-primary/60" />
                    </div>
                    <p
                      className="text-xs text-green-400"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {stat.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Reservas */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3
                  className="text-xl font-semibold text-slate-900 mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Reservas Recientes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-slate-800 font-semibold">Huésped</th>
                        <th className="text-left py-3 px-4 text-slate-800 font-semibold">Alojamiento</th>
                        <th className="text-left py-3 px-4 text-slate-800 font-semibold">Check-in</th>
                        <th className="text-left py-3 px-4 text-slate-800 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.slice(0, 3).map((r) => (
                        <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium">{r.guest}</td>
                          <td className="py-3 px-4 text-slate-700">{r.accommodation}</td>
                          <td className="py-3 px-4 text-slate-700">{r.checkIn}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reservas Tab */}
          {activeTab === "reservas" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Gestión de Reservas
                </h2>
                <p
                  className="text-slate-700"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {reservas.length} reservas totales
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Huésped</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Email</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Alojamiento</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Fechas</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Personas</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map((r) => (
                        <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-medium">{r.guest}</td>
                          <td className="py-4 px-6 text-slate-700">{r.email}</td>
                          <td className="py-4 px-6 text-slate-700">{r.accommodation}</td>
                          <td className="py-4 px-6 text-slate-700 text-sm">
                            {r.checkIn} → {r.checkOut}
                          </td>
                          <td className="py-4 px-6">{r.guests}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === "usuarios" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Gestión de Usuarios
                </h2>
                <p
                  className="text-slate-700"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {usuarios.length} usuarios registrados
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuarios.map((u) => (
                  <div key={u.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="mb-4">
                      <h3
                        className="text-lg font-semibold text-slate-900"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {u.name}
                      </h3>
                      <p
                        className="text-sm text-slate-700"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {u.email}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Registrado:</span>
                        <span className="text-foreground">{u.joined}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado:</span>
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                          {u.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuración Tab */}
          {activeTab === "configuracion" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Configuración
                </h2>
                <p
                  className="text-slate-700"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Personaliza tu cuenta y preferencias
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Información personal */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3
                    className="text-xl font-semibold text-slate-900 mb-6"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Información Personal
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm text-slate-600 mb-2"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded text-foreground"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm text-slate-600 mb-2"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferencias */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3
                    className="text-xl font-semibold text-slate-900 mb-6"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Preferencias
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span
                        className="text-foreground text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Recibir notificaciones por email
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span
                        className="text-foreground text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Actualizar sobre nuevas reservas
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span
                        className="text-foreground text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Compartir datos para análisis
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
