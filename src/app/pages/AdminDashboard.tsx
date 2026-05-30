// Página del panel administrativo.
// Muestra estadísticas, gestiona reservas, usuarios y configuración en un dashboard.
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, BarChart3, Users, Calendar, Settings, Menu, X, Home, ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { reservasAPI, usuariosAPI } from "../../services/api";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface HuespedAdicional {
  nombre: string;
  cedula: string;
  email: string;
}

interface ReservaForm {
  nombre_huesped: string;
  cedula_huesped: string;
  email_huesped: string;
  hospedaje: string;
  check_in: string;
  check_out: string;
  numero_huespedes: number;
  servicio_adicional: string;
  valor_alojamiento: number | string;
  valor_servicio_adicional: number | string;
  abono: number | string;
  estado: string;
  huespedes_adicionales: HuespedAdicional[];
}

interface UsuarioForm {
  nombre: string;
  email: string;
  contrasena: string;
  rol: "admin" | "user";
  activo: boolean;
}

// Dashboard administrativo del sistema.
// Incluye navegación lateral, estadísticas, reservas, usuarios y configuración.
export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "reservas" | "usuarios" | "configuracion">("overview");

  // Estado para datos cargados del backend
  const [reservas, setReservas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para manejar modales de crear/editar reserva
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<any>(null);
  const [reservaModalTab, setReservaModalTab] = useState<"principal" | "adicionales">("principal");
  const [reservaForm, setReservaForm] = useState<ReservaForm>({
    nombre_huesped: "",
    cedula_huesped: "",
    email_huesped: "",
    hospedaje: "",
    check_in: "",
    check_out: "",
    numero_huespedes: 1,
    servicio_adicional: "N/A",
    valor_alojamiento: 0,
    valor_servicio_adicional: 0,
    abono: 0,
    estado: "Pendiente",
    huespedes_adicionales: [],
  });
  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [usuarioForm, setUsuarioForm] = useState<UsuarioForm>({
    nombre: "",
    email: "",
    contrasena: "",
    rol: "user",
    activo: true,
  });
  const [usuarioMessage, setUsuarioMessage] = useState("");
  const valorAlojamiento = Number(reservaForm.valor_alojamiento || 0);
  const valorServicioAdicional = Number(reservaForm.valor_servicio_adicional || 0);
  const abono = Number(reservaForm.abono || 0);
  const totalReserva =
    valorAlojamiento + valorServicioAdicional - abono;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);

  const mapReserva = (reserva: any) => ({
    id: reserva.id,
    guest: reserva.nombre_huesped,
    document: reserva.cedula_huesped || "",
    email: reserva.email_huesped,
    accommodation: reserva.hospedaje,
    checkIn: reserva.check_in,
    checkOut: reserva.check_out,
    status: reserva.estado,
    guests: reserva.numero_huespedes,
    additionalService: reserva.servicio_adicional || "N/A",
    accommodationValue: Number(reserva.valor_alojamiento || 0),
    additionalServiceValue: Number(reserva.valor_servicio_adicional || 0),
    deposit: Number(reserva.abono || 0),
    fullValue: Number(reserva.valor_alojamiento || 0) + Number(reserva.valor_servicio_adicional || 0),
    remainingValue: Number(reserva.total || 0),
    additionalGuests: reserva.huespedes_adicionales || [],
  });

  const reloadReservas = async () => {
    const reservasData = await reservasAPI.getAll();
    setReservas(reservasData.map(mapReserva));
  };

  const mapUsuario = (usuario: any) => ({
    id: usuario.id,
    name: usuario.nombre,
    email: usuario.email,
    role: usuario.rol,
    joined: usuario.fecha_registro?.split("T")[0] || "N/A",
    status: usuario.activo ? "Activo" : "Inactivo",
    active: Boolean(usuario.activo),
  });

  const reloadUsuarios = async () => {
    const usuariosData = await usuariosAPI.getAll();
    setUsuarios(usuariosData.map(mapUsuario));
  };

  // Cierra sesión y navega a la página principal.
  const handleLogout = () => {
    logout();  // Limpia el estado de autenticación
    onLogout();  // Navega a la página principal
  };

  // Cargar datos del backend al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        // Cargar reservas
        try {
          const reservasResponse = await fetch(`${apiUrl}/reservas`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (reservasResponse.ok) {
            const reservasData = await reservasResponse.json();
            setReservas(reservasData.map(mapReserva));
          }
        } catch (error) {
          console.log("No se pudo cargar reservas:", error);
        }

        // Cargar usuarios (solo admin)
        if (user?.role === "admin") {
          try {
            const usuariosResponse = await fetch(`${apiUrl}/usuarios`, {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            if (usuariosResponse.ok) {
              const usuariosData = await usuariosResponse.json();
              setUsuarios(usuariosData.map(mapUsuario));
            }
          } catch (error) {
            console.log("No se pudo cargar usuarios:", error);
          }
        }

        // Cargar alojamientos
        try {
          const alojamientosResponse = await fetch(`${apiUrl}/alojamientos`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (alojamientosResponse.ok) {
            const alojamientosData = await alojamientosResponse.json();
            setAlojamientos(alojamientosData);
          }
        } catch (error) {
          console.log("No se pudo cargar alojamientos:", error);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Funciones para manejar reservas usando el API centralizado
  const handleOpenReservaModal = (reserva?: any) => {
    if (reserva) {
      setEditingReserva(reserva);
      setReservaForm({
        nombre_huesped: reserva.guest,
        cedula_huesped: reserva.document,
        email_huesped: reserva.email,
        hospedaje: reserva.accommodation,
        check_in: reserva.checkIn,
        check_out: reserva.checkOut,
        numero_huespedes: reserva.guests || 1,
        servicio_adicional: reserva.additionalService || "N/A",
        valor_alojamiento: reserva.accommodationValue || 0,
        valor_servicio_adicional: reserva.additionalServiceValue || 0,
        abono: reserva.deposit || 0,
        estado: reserva.status,
        huespedes_adicionales: reserva.additionalGuests || [],
      });
    } else {
      setEditingReserva(null);
      setReservaForm({
        nombre_huesped: "",
        cedula_huesped: "",
        email_huesped: "",
        hospedaje: "",
        check_in: "",
        check_out: "",
        numero_huespedes: 1,
        servicio_adicional: "N/A",
        valor_alojamiento: 0,
        valor_servicio_adicional: 0,
        abono: 0,
        estado: "Pendiente",
        huespedes_adicionales: [],
      });
    }
    setReservaModalTab("principal");
    setShowReservaModal(true);
  };

  const handleCloseReservaModal = () => {
    setShowReservaModal(false);
    setEditingReserva(null);
    setReservaModalTab("principal");
    setSuccessMessage("");
  };

  const handleCantidadHuespedesChange = (cantidad: number) => {
    const numero_huespedes = Math.max(1, cantidad || 1);
    setReservaForm(form => ({
      ...form,
      numero_huespedes,
      huespedes_adicionales: Array.from(
        { length: numero_huespedes - 1 },
        (_, index) => form.huespedes_adicionales[index] || { nombre: "", cedula: "", email: "" }
      ),
    }));
    if (numero_huespedes === 1) {
      setReservaModalTab("principal");
    }
  };

  const handleHuespedAdicionalChange = (index: number, campo: keyof HuespedAdicional, valor: string) => {
    setReservaForm(form => ({
      ...form,
      huespedes_adicionales: form.huespedes_adicionales.map((huesped, posicion) =>
        posicion === index ? { ...huesped, [campo]: valor } : huesped
      ),
    }));
  };

  const handleSaveReserva = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      if (
        reservaForm.numero_huespedes > 1 &&
        reservaForm.huespedes_adicionales.some(
          huesped => !huesped.nombre.trim() || !huesped.cedula.trim() || !huesped.email.trim()
        )
      ) {
        setReservaModalTab("adicionales");
        alert("Completa los datos de los demás huéspedes");
        return;
      }
      if (abono > valorAlojamiento + valorServicioAdicional) {
        alert("El abono no puede superar el total de la reserva");
        return;
      }
      const reservaPayload = {
        ...reservaForm,
        valor_alojamiento: valorAlojamiento,
        valor_servicio_adicional: valorServicioAdicional,
        abono,
        usuario_id: user?.id,
        tipo_hospedaje: "Glamping",
      };
      if (editingReserva) {
        // Editar reserva
        await reservasAPI.editarReserva(editingReserva.id, reservaPayload, token);
        await reloadReservas();
        setSuccessMessage("Reserva actualizada correctamente");
        setTimeout(() => {
          handleCloseReservaModal();
        }, 1500);
      } else {
        // Crear reserva
        await reservasAPI.crearReserva(reservaPayload, token);
        await reloadReservas();
        setSuccessMessage("Reserva creada correctamente");
        setTimeout(() => {
          handleCloseReservaModal();
        }, 1500);
      }
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Error guardando reserva");
    }
  };

  const handleCancelReserva = async (reservaId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
        await reservasAPI.cancelarReserva(reservaId, token);
        setReservas(current => current.filter(reserva => reserva.id !== reservaId));
        setSuccessMessage("Reserva cancelada correctamente");
        setTimeout(() => {
          setSuccessMessage("");
        }, 1500);
      }
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Error cancelando reserva");
    }
  };

  const handleOpenUsuarioModal = (usuario?: any) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setUsuarioForm({
        nombre: usuario.name,
        email: usuario.email,
        contrasena: "",
        rol: usuario.role === "admin" ? "admin" : "user",
        activo: usuario.active,
      });
    } else {
      setEditingUsuario(null);
      setUsuarioForm({
        nombre: "",
        email: "",
        contrasena: "",
        rol: "user",
        activo: true,
      });
    }
    setUsuarioMessage("");
    setShowUsuarioModal(true);
  };

  const handleCloseUsuarioModal = () => {
    setShowUsuarioModal(false);
    setEditingUsuario(null);
    setUsuarioMessage("");
  };

  const handleSaveUsuario = async () => {
    try {
      if (editingUsuario) {
        await usuariosAPI.update(editingUsuario.id, usuarioForm);
        setUsuarioMessage("Usuario actualizado correctamente");
      } else {
        await usuariosAPI.create(usuarioForm);
        setUsuarioMessage("Usuario creado correctamente");
      }
      await reloadUsuarios();
      setTimeout(handleCloseUsuarioModal, 1000);
    } catch (error: any) {
      setUsuarioMessage("");
      alert(error.message || "Error guardando usuario");
    }
  };

  const handleDeleteUsuario = async (usuario: any) => {
    if (usuario.id === user?.id) {
      alert("No puedes eliminar tu propio usuario");
      return;
    }
    if (!confirm(`¿Deseas eliminar a ${usuario.name}?`)) return;
    try {
      await usuariosAPI.delete(usuario.id);
      setUsuarios(current => current.filter(item => item.id !== usuario.id));
    } catch (error: any) {
      alert(error.message || "Error eliminando usuario");
    }
  };

  // Las acciones de gestión deben operar únicamente sobre reservas persistidas.
  const reservasDisplay = reservas;
  const usuariosDisplay = usuarios;

  // Calcular estadísticas dinámicamente
  const reservasConfirmadas = reservasDisplay.filter(r => r.status === "Confirmada");
  const ingresosTotales = reservasConfirmadas.reduce((acc, r) => acc + (r.accommodationValue || 0) + (r.additionalServiceValue || 0), 0);
  // Suponiendo que la ocupación es el porcentaje de reservas confirmadas sobre el total de alojamientos * días del mes actual
  const totalAlojamientos = alojamientos.length || 1;
  const diasMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  // Sumar noches reservadas
  const nochesReservadas = reservasConfirmadas.reduce((acc, r) => {
    const inDate = new Date(r.checkIn);
    const outDate = new Date(r.checkOut);
    const noches = (outDate - inDate) / (1000 * 60 * 60 * 24);
    return acc + (noches > 0 ? noches : 0);
  }, 0);
  const ocupacion = Math.round((nochesReservadas / (totalAlojamientos * diasMes)) * 100);

  const stats = [
    { label: "Reservas Totales", value: reservasDisplay.length.toString(), icon: Calendar, change: "+12% este mes" },
    { label: "Ingresos", value: formatCurrency(ingresosTotales), icon: BarChart3, change: "+8.5% este mes" },
    { label: "Ocupación", value: `${ocupacion}%`, icon: Home, change: "+5% este mes" },
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
    <div className="min-h-screen bg-slate-50 text-[#284735]">
      {/* Encabezado principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botón de volver atrás */}
            <button
              onClick={handleLogout}
              className="text-[#46654f] hover:text-primary transition-colors hidden md:block"
              title="Volver a la página principal"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-[#46654f] hover:text-primary transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {/* Logo y título clickeables */}
            <button
              onClick={handleLogout}
              className="flex flex-col hover:opacity-80 transition-opacity cursor-pointer"
              title="Volver a la página principal"
            >
              <h1
                className="text-2xl font-semibold text-[#365b43]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Natural Sound Admin
              </h1>
              <p
                className="text-xs text-[#55735d] tracking-wide"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Panel de Control
              </p>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p
                className="text-sm text-[#365b43]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {user?.name}
              </p>
              <p
                className="text-xs text-[#55735d]"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {user?.role === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#55735d] hover:text-[#284735] hover:bg-primary/10 rounded transition-colors"
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
                      : "text-slate-600 hover:text-[#284735] hover:bg-slate-100"
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
                  className="text-3xl font-semibold text-[#365b43] mb-2"
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

              {/* Próximas Reservas */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                <h3
                  className="text-xl font-semibold text-slate-900 mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Próximas Reservas
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
                      {reservasDisplay
                        .filter(r => r.status === "Confirmada" && new Date(r.checkIn) >= new Date())
                        .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
                        .slice(0, 5)
                        .map((r) => (
                          <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-[#284735]">{r.guest}</td>
                            <td className="py-3 px-4 text-slate-700">{r.accommodation}</td>
                            <td className="py-3 px-4 text-slate-700">{r.checkIn}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {/* Si no hay próximas reservas */}
                      {reservasDisplay.filter(r => r.status === "Confirmada" && new Date(r.checkIn) >= new Date()).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                            No hay próximas reservas confirmadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reservas Tab */}
          {activeTab === "reservas" && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2
                    className="text-3xl font-semibold text-[#365b43] mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Gestión de Reservas
                  </h2>
                  <p
                    className="text-slate-700"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {reservasDisplay.length} reservas totales
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                  onClick={() => handleOpenReservaModal()}
                >
                  <Plus size={18} /> Nueva Reserva
                </button>
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
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Valor total</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Restante</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Estado</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservasDisplay.map((r) => (
                        <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-[#284735]">{r.guest}</td>
                          <td className="py-4 px-6 text-slate-700">{r.email}</td>
                          <td className="py-4 px-6 text-slate-700">{r.accommodation}</td>
                          <td className="py-4 px-6 text-slate-700 text-sm">
                            {r.checkIn} → {r.checkOut}
                          </td>
                          <td className="py-4 px-6 text-[#284735]">{r.guests}</td>
                          <td className="py-4 px-6 text-[#284735] font-medium whitespace-nowrap">
                            {formatCurrency(r.fullValue)}
                          </td>
                          <td className="py-4 px-6 text-[#284735] font-medium whitespace-nowrap">
                            {formatCurrency(r.remainingValue)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 flex gap-2">
                            <button
                              onClick={() => handleOpenReservaModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar reserva"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleCancelReserva(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Cancelar reserva"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!isLoading && reservasDisplay.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-10 px-6 text-center text-slate-500">
                            No hay reservas registradas. Crea la primera con "Nueva Reserva".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal para crear/editar reserva */}
              {showReservaModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-lg relative text-[#284735]">
                    <button
                      className="absolute top-4 right-4 text-[#728875] hover:text-[#284735] transition-colors"
                      onClick={handleCloseReservaModal}
                    >
                      <X size={20} />
                    </button>
                    <h3 className="text-xl font-semibold mb-6 text-[#365b43]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {editingReserva ? "Editar Reserva" : "Nueva Reserva"}
                    </h3>
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSaveReserva();
                      }}
                      className="space-y-4"
                    >
                      <div className="flex gap-2 border-b border-[#d7e1d8] pb-3">
                        <button
                          type="button"
                          onClick={() => setReservaModalTab("principal")}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            reservaModalTab === "principal"
                              ? "bg-[#e5eee7] text-[#284735]"
                              : "text-[#718575] hover:text-[#284735]"
                          }`}
                        >
                          Huésped principal
                        </button>
                        {reservaForm.numero_huespedes > 1 && (
                          <button
                            type="button"
                            onClick={() => setReservaModalTab("adicionales")}
                            className={`px-3 py-2 rounded-md text-sm transition-colors ${
                              reservaModalTab === "adicionales"
                                ? "bg-[#e5eee7] text-[#284735]"
                                : "text-[#718575] hover:text-[#284735]"
                            }`}
                          >
                            Demás huéspedes ({reservaForm.numero_huespedes - 1})
                          </button>
                        )}
                      </div>
                      {reservaModalTab === "principal" && (
                        <>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Nombre del huésped</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                          value={reservaForm.nombre_huesped}
                          onChange={e => setReservaForm(f => ({ ...f, nombre_huesped: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Cédula del huésped principal</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                          value={reservaForm.cedula_huesped}
                          onChange={e => setReservaForm(f => ({ ...f, cedula_huesped: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Email del huésped</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                          value={reservaForm.email_huesped}
                          onChange={e => setReservaForm(f => ({ ...f, email_huesped: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Alojamiento</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.hospedaje}
                          onChange={e => {
                            const alojamiento = alojamientos.find(item => item.nombre === e.target.value);
                            setReservaForm(f => ({
                              ...f,
                              hospedaje: e.target.value,
                              valor_alojamiento: Number(alojamiento?.precio_noche || 0),
                            }));
                          }}
                          required
                        >
                          <option value="">Selecciona...</option>
                          {alojamientos.map((a) => (
                            <option key={a.id} value={a.nombre}>{a.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm mb-1 text-[#46654f]">Check-in</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded text-[#284735]"
                            value={reservaForm.check_in}
                            onChange={e => setReservaForm(f => ({ ...f, check_in: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm mb-1 text-[#46654f]">Check-out</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded text-[#284735]"
                            value={reservaForm.check_out}
                            onChange={e => setReservaForm(f => ({ ...f, check_out: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Número de personas</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.numero_huespedes}
                          onChange={e => handleCantidadHuespedesChange(Number(e.target.value))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Servicio adicional</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.servicio_adicional}
                          onChange={e => setReservaForm(f => ({
                            ...f,
                            servicio_adicional: e.target.value,
                          }))}
                        >
                          <option value="Cumpleaños">Cumpleaños</option>
                          <option value="Quieres ser mi novia">Quieres ser mi novia</option>
                          <option value="Te amo">Te amo</option>
                          <option value="Aniversario">Aniversario</option>
                          <option value="Desayuno termal">Desayuno termal</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Valor del alojamiento</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.valor_alojamiento}
                          onChange={e => setReservaForm(f => ({ ...f, valor_alojamiento: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Valor del servicio adicional</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.valor_servicio_adicional}
                          onChange={e => setReservaForm(f => ({ ...f, valor_servicio_adicional: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Abono</label>
                        <input
                          type="number"
                          min={0}
                          max={valorAlojamiento + valorServicioAdicional}
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.abono}
                          onChange={e => setReservaForm(f => ({ ...f, abono: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="rounded-md bg-[#e5eee7] p-4">
                        <label className="block text-sm mb-1 text-[#46654f]">Total</label>
                        <p className="text-xl font-semibold text-[#284735]">{totalReserva}</p>
                        <p className="text-xs text-[#55735d] mt-1">
                          Valor alojamiento + servicio adicional - abono
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Estado</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={reservaForm.estado}
                          onChange={e => setReservaForm(f => ({ ...f, estado: e.target.value }))}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmada">Confirmada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </div>
                        </>
                      )}
                      {reservaModalTab === "adicionales" && reservaForm.numero_huespedes > 1 && (
                        <div className="space-y-4">
                          <p className="text-sm text-[#46654f]">
                            El huésped principal ya está registrado. Completa los datos de los acompañantes.
                          </p>
                          {reservaForm.huespedes_adicionales.map((huesped, index) => (
                            <div key={index} className="rounded-md border border-[#d7e1d8] p-4 space-y-3">
                              <p className="font-medium text-[#365b43]">Huésped {index + 2}</p>
                              <div>
                                <label className="block text-sm mb-1 text-[#46654f]">Nombre completo</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                                  value={huesped.nombre}
                                  onChange={e => handleHuespedAdicionalChange(index, "nombre", e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm mb-1 text-[#46654f]">Cédula</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                                  value={huesped.cedula}
                                  onChange={e => handleHuespedAdicionalChange(index, "cedula", e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm mb-1 text-[#46654f]">Email del huésped</label>
                                <input
                                  type="email"
                                  className="w-full px-3 py-2 border rounded text-[#284735] placeholder:text-[#718575]"
                                  value={huesped.email || ""}
                                  onChange={e => handleHuespedAdicionalChange(index, "email", e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full mt-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                      >
                        {editingReserva ? "Guardar Cambios" : "Crear Reserva"}
                      </button>
                      {successMessage && (
                        <div className="mt-4 text-green-600 text-center">{successMessage}</div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === "usuarios" && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2
                    className="text-3xl font-semibold text-[#365b43] mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Gestión de Usuarios
                  </h2>
                  <p
                    className="text-slate-700"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {usuariosDisplay.length} usuarios registrados
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                  onClick={() => handleOpenUsuarioModal()}
                >
                  <Plus size={18} /> Nuevo Usuario
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuariosDisplay && usuariosDisplay.length > 0 ? usuariosDisplay.map((u) => (
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
                        <span className="text-[#284735]">{u.joined}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#55735d]">Estado:</span>
                        <span className={`px-2 py-1 rounded text-xs border ${
                          u.active
                            ? "bg-green-500/20 text-green-600 border-green-500/30"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenUsuarioModal(u)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar usuario"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUsuario(u)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:text-slate-300 disabled:hover:bg-transparent"
                        title={u.id === user?.id ? "No puedes eliminar tu usuario" : "Eliminar usuario"}
                        disabled={u.id === user?.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-[#55735d]">
                      {isLoading ? "Cargando usuarios..." : "No hay usuarios registrados."}
                    </p>
                  </div>
                )}
              </div>

              {showUsuarioModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative text-[#284735]">
                    <button
                      className="absolute top-4 right-4 text-[#728875] hover:text-[#284735] transition-colors"
                      onClick={handleCloseUsuarioModal}
                    >
                      <X size={20} />
                    </button>
                    <h3 className="text-xl font-semibold mb-6 text-[#365b43]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                    </h3>
                    <form
                      className="space-y-4"
                      onSubmit={event => {
                        event.preventDefault();
                        handleSaveUsuario();
                      }}
                    >
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Nombre</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={usuarioForm.nombre}
                          onChange={event => setUsuarioForm(form => ({ ...form, nombre: event.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Email</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={usuarioForm.email}
                          onChange={event => setUsuarioForm(form => ({ ...form, email: event.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">
                          Contraseña {editingUsuario && "(opcional)"}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={usuarioForm.contrasena}
                          onChange={event => setUsuarioForm(form => ({ ...form, contrasena: event.target.value }))}
                          required={!editingUsuario}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#46654f]">Rol</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#284735]"
                          value={usuarioForm.rol}
                          onChange={event => setUsuarioForm(form => ({
                            ...form,
                            rol: event.target.value === "admin" ? "admin" : "user",
                          }))}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#46654f]">
                        <input
                          type="checkbox"
                          checked={usuarioForm.activo}
                          onChange={event => setUsuarioForm(form => ({ ...form, activo: event.target.checked }))}
                        />
                        Usuario activo
                      </label>
                      <button
                        type="submit"
                        className="w-full mt-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                      >
                        {editingUsuario ? "Guardar Cambios" : "Crear Usuario"}
                      </button>
                      {usuarioMessage && (
                        <div className="text-green-600 text-center">{usuarioMessage}</div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuración Tab */}
          {activeTab === "configuracion" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-[#365b43] mb-2"
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
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded text-[#284735]"
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
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded text-[#284735]"
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
                        className="text-[#284735] text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Recibir notificaciones por email
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span
                        className="text-[#284735] text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Actualizar sobre nuevas reservas
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span
                        className="text-[#284735] text-sm"
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
