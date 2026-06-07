// Página del panel administrativo.
// Muestra estadísticas, gestiona reservas, usuarios y configuración en un dashboard.
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, BarChart3, Users, Calendar, CalendarDays, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Settings, Menu, X, Home, ArrowLeft, Plus, Edit2, Trash2, RefreshCw, History, Search, SlidersHorizontal, MessageCircle, Mail, CheckCircle, XCircle, Send, Link, Clock, UserCheck, UserX, Palette } from "lucide-react";
import { reservasAPI, usuariosAPI, alojamientosAPI, correosAPI } from "../../services/api";
import { precioTotal, tarifasBase, formatCOP, tieneTarifa, esFestivo, precioServicio, serviciosDisponibles, servicioRequiereColor, servicioTieneMensaje, COLORES_DECORACION, labelServicio, maxHuespedes } from "../data/pricing";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface HuespedAdicional {
  nombre: string;
  cedula: string;
  email: string;
  celular: string;
}

interface ReservaForm {
  nombre_huesped: string;
  cedula_huesped: string;
  email_huesped: string;
  telefono_huesped: string;
  hospedaje: string;
  check_in: string;
  check_out: string;
  numero_huespedes: number;
  numero_habitacion: string;
  servicio_adicional: string;
  color_decoracion: string;
  mensaje_decoracion: string;
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
  color: string;
}

const COLORES_USUARIO = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1',
  '#14B8A6', '#A855F7',
];

const INDICATIVOS_ADMIN = [
  { code: "+57", flag: "🇨🇴" }, { code: "+1",   flag: "🇺🇸" }, { code: "+52",  flag: "🇲🇽" },
  { code: "+54", flag: "🇦🇷" }, { code: "+55",  flag: "🇧🇷" }, { code: "+56",  flag: "🇨🇱" },
  { code: "+51", flag: "🇵🇪" }, { code: "+58",  flag: "🇻🇪" }, { code: "+593", flag: "🇪🇨" },
  { code: "+507", flag: "🇵🇦" }, { code: "+34", flag: "🇪🇸" }, { code: "+44",  flag: "🇬🇧" },
];

function parsearTelefono(phone: string): { indicativo: string; numero: string } {
  if (!phone) return { indicativo: "+57", numero: "" };
  // Con prefijo +
  const codigos = ["+593", "+507", "+57", "+1", "+52", "+54", "+55", "+56", "+51", "+58", "+34", "+44"];
  for (const c of codigos) {
    if (phone.startsWith(c)) return { indicativo: c, numero: phone.slice(c.length) };
  }
  // Sin prefijo + (ej: "573046643574" guardado desde el admin anterior)
  const codigosSin = ["593", "507", "57", "1", "52", "54", "55", "56", "51", "58", "34", "44"];
  for (const c of codigosSin) {
    if (phone.startsWith(c) && phone.length > c.length + 5) {
      return { indicativo: "+" + c, numero: phone.slice(c.length) };
    }
  }
  return { indicativo: "+57", numero: phone };
}

// Dashboard administrativo del sistema.
// Incluye navegación lateral, estadísticas, reservas, usuarios y configuración.
export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reservas" | "historial" | "calendario" | "pendientes" | "usuarios" | "configuracion" | "correos">(
    () => (sessionStorage.getItem("adminTab") as any) || "calendario"
  );
  const [overviewSubTab, setOverviewSubTab] = useState<"proximas" | "concluidas">("proximas");

  // Estados de búsqueda y filtros del tab Reservas
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroAlojamiento, setFiltroAlojamiento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ordenarPorFecha, setOrdenarPorFecha] = useState(false);

  // Filtros historial
  const [historialShowSearch, setHistorialShowSearch] = useState(false);
  const [historialSearchQuery, setHistorialSearchQuery] = useState("");
  const [historialShowFilters, setHistorialShowFilters] = useState(false);
  const [historialFiltroAlojamiento, setHistorialFiltroAlojamiento] = useState("");
  const [historialFiltroEstado, setHistorialFiltroEstado] = useState("");
  const [historialOrdenarPorFecha, setHistorialOrdenarPorFecha] = useState(false);

  // Estado para datos cargados del backend
  const [reservas, setReservas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Estados pestaña Correos
  const [correoEstado, setCorreoEstado] = useState<any>(null);
  const [correoEstadoCargando, setCorreoEstadoCargando] = useState(false);
  const [correoPrueba, setCorreoPrueba] = useState("");
  const [correoPruebaMsg, setCorreoPruebaMsg] = useState("");
  const [correoPruebaEnviando, setCorreoPruebaEnviando] = useState(false);
  const [correoReenviando, setCorreoReenviando] = useState<number | null>(null);

  // Autocomplete de huéspedes anteriores
  const [sugerenciasHuesped, setSugerenciasHuesped] = useState<any[]>([]);

  // Estados para manejar modales de crear/editar reserva
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<any>(null);
  const [reservaModalTab, setReservaModalTab] = useState<"principal" | "adicionales">("principal");
  const [reservaForm, setReservaForm] = useState<ReservaForm>({
    nombre_huesped: "",
    cedula_huesped: "",
    email_huesped: "",
    telefono_huesped: "",
    hospedaje: "",
    check_in: "",
    check_out: "",
    numero_huespedes: 1,
    numero_habitacion: "",
    servicio_adicional: "N/A",
    color_decoracion: "",
    mensaje_decoracion: "",
    valor_alojamiento: 0,
    valor_servicio_adicional: 0,
    abono: 0,
    estado: "Pendiente",
    huespedes_adicionales: [],
  });
  const [adminServiciosSeleccionados, setAdminServiciosSeleccionados] = useState<
    Array<{ servicio: string; color: string; mensaje: string }>
  >([]);
  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [enlaceGenerado, setEnlaceGenerado] = useState<string | null>(null);
  const [showEnlaceModal, setShowEnlaceModal] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [indicativoAdmin, setIndicativoAdmin] = useState("+57");
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [usuarioForm, setUsuarioForm] = useState<UsuarioForm>({
    nombre: "",
    email: "",
    contrasena: "",
    rol: "user",
    activo: true,
    color: COLORES_USUARIO[0],
  });
  const [usuarioMessage, setUsuarioMessage] = useState("");
  const [usuarioError, setUsuarioError] = useState("");

  // Estado para el modal de detalle del historial
  const [historialReserva, setHistorialReserva] = useState<any>(null);

  // Estados para los modales interactivos del Panel General
  const [overviewModal, setOverviewModal] = useState<{
    type: "reservas" | "ingresos" | "ocupacion";
    filtroAlojamiento: string;
    filtroEstado?: string;
  } | null>(null);
  const [overviewDetailReserva, setOverviewDetailReserva] = useState<any>(null);

  // Estado para el calendario
  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [calFiltroAlojamiento, setCalFiltroAlojamiento] = useState("");
  const [calSelectedDay, setCalSelectedDay] = useState<{ year: number; month: number; day: number } | null>(null);

  // Estado para la pestaña de Configuración
  const [config, setConfig] = useState({
    recibir_notificaciones: true,
    notificaciones_reservas: true,
    compartir_datos: false,
  });
  const [perfilForm, setPerfilForm] = useState({ nombre: "", email: "" });
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [configMessage, setConfigMessage] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  // Refs para sincronizar scroll horizontal superior e inferior en la tabla de reservas
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncMirrorWidth = () => {
      if (tableScrollRef.current && mirrorRef.current) {
        mirrorRef.current.style.width = `${tableScrollRef.current.scrollWidth}px`;
      }
    };
    syncMirrorWidth();
    const observer = new ResizeObserver(syncMirrorWidth);
    if (tableScrollRef.current) observer.observe(tableScrollRef.current);
    return () => observer.disconnect();
  }, [reservas, activeTab]);

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

  // Formatea un número como entero COP con separador de miles (punto).
  // Devuelve '' cuando el valor es 0 para que el placeholder "0" sea visible.
  const displayCOP = (val: number | string): string => {
    const n = Number(String(val).replace(/\./g, "") || 0);
    if (!n) return "";
    return n.toLocaleString("es-CO");
  };

  // Extrae el entero del string formateado (elimina puntos y caracteres no numéricos).
  const parseCOP = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, "");
    return cleaned === "" ? 0 : parseInt(cleaned, 10);
  };

  const mapReserva = (reserva: any) => {
    let additionalGuests: HuespedAdicional[] = [];
    try {
      const raw = typeof reserva.huespedes_adicionales === "string"
        ? JSON.parse(reserva.huespedes_adicionales || "[]")
        : (reserva.huespedes_adicionales || []);
      additionalGuests = (raw as any[]).map(g => ({
        nombre:  g?.nombre  ?? "",
        cedula:  g?.cedula  ?? "",
        email:   g?.email   ?? "",
        celular: g?.celular ?? "",
      }));
    } catch { additionalGuests = []; }

    return {
      id: reserva.id,
      numeroReserva: reserva.numero_reserva ?? null,
      guest: reserva.nombre_huesped,
      document: reserva.cedula_huesped || "",
      email: reserva.email_huesped,
      phone: reserva.telefono_huesped || "",
      accommodation: reserva.hospedaje,
      checkIn: reserva.check_in,
      checkOut: reserva.check_out,
      status: reserva.estado,
      guests: reserva.numero_huespedes,
      additionalService: reserva.servicio_adicional || "N/A",
      color_decoracion: reserva.color_decoracion || "",
      mensaje_decoracion: reserva.mensaje_decoracion || "",
      servicios_adicionales: reserva.servicios_adicionales || null,
      numeroHabitacion: reserva.numero_habitacion ?? null,
      accommodationValue: Number(reserva.valor_alojamiento || 0),
      additionalServiceValue: Number(reserva.valor_servicio_adicional || 0),
      deposit: Number(reserva.abono || 0),
      fullValue: Number(reserva.valor_alojamiento || 0) + Number(reserva.valor_servicio_adicional || 0),
      remainingValue: Number(reserva.total || 0),
      additionalGuests,
      tokenPublico: reserva.token_publico || null,
      datosCompletados: !!reserva.datos_completados,
      creadorColor: reserva.creador_color ?? null,
      creadorNombre: reserva.creador_nombre ?? null,
    };
  };

  const mapUsuario = (usuario: any) => ({
    id: usuario._id || usuario.id,
    codigo: usuario.codigo || "—",
    name: usuario.nombre,
    email: usuario.email,
    role: usuario.rol,
    joined: usuario.fecha_registro?.split("T")[0] || "N/A",
    status: usuario.activo ? "Activo" : "Inactivo",
    active: Boolean(usuario.activo),
    color: usuario.color ?? null,
  });

  // Cierra sesión y navega a la página principal.
  const handleLogout = () => {
    logout();  // Limpia el estado de autenticación
    onLogout();  // Navega a la página principal
  };

  // Carga todos los datos del backend; silent=true omite el spinner manual
  const loadData = useCallback(async (silent = false) => {
    const token = localStorage.getItem("authToken");
    if (!token) { setIsLoading(false); return; }
    if (!silent) setIsRefreshing(true);
    try {
      const [reservasData, alojamientosData] = await Promise.all([
        reservasAPI.getAll(),
        alojamientosAPI.getAll(),
      ]);
      setReservas(reservasData.map(mapReserva));
      setAlojamientos(alojamientosData);

      if (user?.role === "admin") {
        const usuariosData = await usuariosAPI.getAll();
        setUsuarios(usuariosData.map(mapUsuario));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.role]);

  // Carga inicial + polling cada 30 segundos
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const reloadReservas = () => loadData(true);
  const reloadUsuarios = () => loadData(true);

  // Cargar perfil y configuración del usuario cuando hay sesión
  useEffect(() => {
    if (!user) return;
    setPerfilForm({ nombre: user.name || "", email: user.email || "" });
    usuariosAPI.getPerfil()
      .then((perfil: any) => {
        const id = perfil.id ?? user.id;
        setPerfilId(id);
        if (id) {
          usuariosAPI.getConfig(id)
            .then((cfg: any) => setConfig({
              recibir_notificaciones: Boolean(cfg.recibir_notificaciones),
              notificaciones_reservas: Boolean(cfg.notificaciones_reservas),
              compartir_datos: Boolean(cfg.compartir_datos),
            }))
            .catch(() => {});
        }
      })
      .catch(() => {
        if (user.id) {
          setPerfilId(user.id);
          usuariosAPI.getConfig(user.id)
            .then((cfg: any) => setConfig({
              recibir_notificaciones: Boolean(cfg.recibir_notificaciones),
              notificaciones_reservas: Boolean(cfg.notificaciones_reservas),
              compartir_datos: Boolean(cfg.compartir_datos),
            }))
            .catch(() => {});
        }
      });
  }, [user]);

  // Funciones para manejar reservas usando el API centralizado
  const handleOpenReservaModal = (reserva?: any, prefillDate?: string) => {
    if (reserva) {
      setEditingReserva(reserva);
      const isDiaSol = reserva.accommodation.toLowerCase().includes("de sol");
      const calcOut = isDiaSol ? reserva.checkIn : reserva.checkOut;
      const calc = tieneTarifa(reserva.accommodation)
        ? precioTotal(reserva.accommodation, reserva.checkIn, calcOut, reserva.guests || 1)
        : 0;
      const parsed = parsearTelefono(reserva.phone || "");
      setIndicativoAdmin(parsed.indicativo);
      setReservaForm({
        nombre_huesped: reserva.guest,
        cedula_huesped: reserva.document,
        email_huesped: reserva.email,
        telefono_huesped: parsed.numero,
        hospedaje: reserva.accommodation,
        check_in: reserva.checkIn,
        check_out: reserva.checkOut,
        numero_huespedes: reserva.guests || 1,
        numero_habitacion: reserva.numeroHabitacion != null ? String(reserva.numeroHabitacion) : (reserva.accommodation?.toLowerCase().includes("cuadruple") ? "5" : ""),
        servicio_adicional: reserva.additionalService || "N/A",
        color_decoracion: reserva.color_decoracion || "",
        mensaje_decoracion: reserva.mensaje_decoracion || "",
        valor_alojamiento: calc > 0 ? calc : (reserva.accommodationValue || 0),
        valor_servicio_adicional: reserva.additionalServiceValue || 0,
        abono: reserva.deposit || 0,
        estado: reserva.status,
        huespedes_adicionales: (() => {
          const numGuests = reserva.guests || 1;
          const existing = reserva.additionalGuests || [];
          return Array.from(
            { length: Math.max(0, numGuests - 1) },
            (_, i) => existing[i] || { nombre: "", cedula: "", email: "", celular: "" }
          );
        })(),
      });
      if (reserva.servicios_adicionales && Array.isArray(reserva.servicios_adicionales)) {
        setAdminServiciosSeleccionados(reserva.servicios_adicionales.map((x: any) => ({
          servicio: x.nombre,
          color: x.color || "",
          mensaje: x.mensaje || "",
        })));
      } else if (reserva.additionalService && reserva.additionalService !== "N/A") {
        setAdminServiciosSeleccionados([{
          servicio: reserva.additionalService,
          color: reserva.color_decoracion || "",
          mensaje: reserva.mensaje_decoracion || "",
        }]);
      } else {
        setAdminServiciosSeleccionados([]);
      }
    } else {
      setEditingReserva(null);
      setReservaForm({
        nombre_huesped: "",
        cedula_huesped: "",
        email_huesped: "",
        telefono_huesped: "",
        hospedaje: "",
        check_in: prefillDate || "",
        check_out: "",
        numero_huespedes: 1,
        numero_habitacion: "",
        servicio_adicional: "N/A",
        color_decoracion: "",
        mensaje_decoracion: "",
        valor_alojamiento: 0,
        valor_servicio_adicional: 0,
        abono: 0,
        estado: "Pendiente",
        huespedes_adicionales: [],
      });
      setAdminServiciosSeleccionados([]);
      setIndicativoAdmin("+57");
    }
    setReservaModalTab("principal");
    setShowReservaModal(true);
  };

  const handleCloseReservaModal = () => {
    setShowReservaModal(false);
    setEditingReserva(null);
    setReservaModalTab("principal");
    setSuccessMessage("");
    setAdminServiciosSeleccionados([]);
  };

  const handleCloseEnlaceModal = () => {
    setShowEnlaceModal(false);
    setEnlaceGenerado(null);
    setEnlaceCopiado(false);
  };

  const toggleAdminServicio = (s: string, hospedaje: string, numHuespedes: number) => {
    setAdminServiciosSeleccionados(prev => {
      const next = prev.some(x => x.servicio === s)
        ? prev.filter(x => x.servicio !== s)
        : [...prev, { servicio: s, color: "", mensaje: "" }];
      const total = next.reduce((acc, x) => acc + precioServicio(hospedaje, x.servicio, numHuespedes), 0);
      setReservaForm(f => ({ ...f, valor_servicio_adicional: total }));
      return next;
    });
  };

  const setColorAdminServicio = (s: string, color: string) => {
    setAdminServiciosSeleccionados(prev => prev.map(x => x.servicio === s ? { ...x, color } : x));
  };

  const setMensajeAdminServicio = (s: string, mensaje: string) => {
    setAdminServiciosSeleccionados(prev => prev.map(x => x.servicio === s ? { ...x, mensaje } : x));
  };

  const handleCantidadHuespedesChange = (cantidad: number) => {
    const numero_huespedes = Math.max(1, cantidad || 1);
    const totalServicios = adminServiciosSeleccionados.reduce(
      (acc, x) => acc + precioServicio(reservaForm.hospedaje, x.servicio, numero_huespedes), 0
    );
    setReservaForm(form => ({
      ...form,
      numero_huespedes,
      huespedes_adicionales: Array.from(
        { length: numero_huespedes - 1 },
        (_, index) => form.huespedes_adicionales[index] || { nombre: "", cedula: "", email: "", celular: "" }
      ),
      valor_servicio_adicional: adminServiciosSeleccionados.length > 0
        ? totalServicios
        : form.valor_servicio_adicional,
    }));
    if (numero_huespedes === 1) {
      setReservaModalTab("principal");
    }
  };

  // Auto-calcula valor_alojamiento cuando se crea una reserva nueva y hay tarifa definida
  useEffect(() => {
    if (editingReserva) return;
    const { hospedaje, check_in, check_out } = reservaForm;
    const isDiaSol = hospedaje.toLowerCase().includes("de sol");
    const calcOut = isDiaSol ? check_in : check_out;
    const calc = precioTotal(hospedaje, check_in, calcOut, reservaForm.numero_huespedes);
    if (calc > 0) {
      setReservaForm(f => ({ ...f, valor_alojamiento: calc }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservaForm.hospedaje, reservaForm.check_in, reservaForm.check_out, reservaForm.numero_huespedes, editingReserva]);

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
          huesped => !huesped.nombre?.trim() || !huesped.cedula?.trim() || !huesped.celular?.trim()
        )
      ) {
        setReservaModalTab("adicionales");
        alert("Completa nombre, cédula y celular de cada huésped adicional");
        return;
      }
      if (abono > valorAlojamiento + valorServicioAdicional) {
        alert("El abono no puede superar el total de la reserva");
        return;
      }
      const localTel = reservaForm.telefono_huesped.trim().replace(/^\+/, "");
      const codSinPlus = indicativoAdmin.replace("+", "");
      const telefonoCombinado = localTel
        ? (localTel.startsWith(codSinPlus) ? `+${localTel}` : `${indicativoAdmin}${localTel}`)
        : "";
      const servicioLabel = adminServiciosSeleccionados.length > 0
        ? adminServiciosSeleccionados.map(x => labelServicio(x.servicio)).join(", ")
        : "N/A";
      const reservaPayload = {
        ...reservaForm,
        servicio_adicional: servicioLabel,
        color_decoracion: adminServiciosSeleccionados.find(x => x.color)?.color ?? "",
        mensaje_decoracion: adminServiciosSeleccionados.find(x => x.mensaje)?.mensaje ?? "",
        telefono_huesped: telefonoCombinado,
        valor_alojamiento: valorAlojamiento,
        valor_servicio_adicional: valorServicioAdicional,
        abono,
        usuario_id: user?.id,
        tipo_hospedaje: "Glamping",
        ...(adminServiciosSeleccionados.length > 0 && {
          servicios_adicionales: adminServiciosSeleccionados.map(x => ({
            nombre: x.servicio,
            label: labelServicio(x.servicio),
            color: x.color || null,
            mensaje: x.mensaje || null,
            precio: precioServicio(reservaForm.hospedaje, x.servicio, reservaForm.numero_huespedes),
          })),
        }),
      };
      if (editingReserva) {
        await reservasAPI.editarReserva(editingReserva.id, reservaPayload, token);
        await reloadReservas();
        setSuccessMessage("Reserva actualizada correctamente");
        setTimeout(() => handleCloseReservaModal(), 1500);
      } else {
        const resultado = await reservasAPI.crearReserva(reservaPayload, token);
        await reloadReservas();
        handleCloseReservaModal();
        if (resultado?.token_publico) {
          setEnlaceGenerado(`${window.location.origin}/reservar/${resultado.token_publico}`);
          setShowEnlaceModal(true);
        }
      }
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Error guardando reserva");
    }
  };

  const buscarHuespedes = (query: string) => {
    if (query.length < 2) { setSugerenciasHuesped([]); return; }
    const q = query.toLowerCase();
    const vistos = new Set<string>();
    const matches = reservas.filter(r => {
      if (!r.guest?.toLowerCase().includes(q)) return false;
      const key = r.document || r.guest;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    }).slice(0, 6);
    setSugerenciasHuesped(matches);
  };

  const seleccionarHuesped = (r: any) => {
    const parsed = parsearTelefono(r.phone || "");
    setIndicativoAdmin(parsed.indicativo);
    setReservaForm(f => ({
      ...f,
      nombre_huesped: r.guest || "",
      cedula_huesped: r.document || "",
      email_huesped: r.email || "",
      telefono_huesped: parsed.numero,
    }));
    setSugerenciasHuesped([]);
  };

  const handleVerEstadoCorreo = async () => {
    setCorreoEstadoCargando(true);
    try {
      const data = await correosAPI.estado();
      setCorreoEstado(data);
    } catch {
      setCorreoEstado({ configurado: false, mensaje: "Error al verificar" });
    } finally {
      setCorreoEstadoCargando(false);
    }
  };

  const handleEnviarCorreoPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correoPrueba) return;
    setCorreoPruebaEnviando(true);
    setCorreoPruebaMsg("");
    try {
      const data = await correosAPI.prueba(correoPrueba);
      setCorreoPruebaMsg(data.mensaje || "Correo enviado correctamente");
    } catch (error: any) {
      setCorreoPruebaMsg(`Error: ${error.message}`);
    } finally {
      setCorreoPruebaEnviando(false);
    }
  };

  const handleReenviarCorreo = async (reservaId: number) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setCorreoReenviando(reservaId);
    try {
      const data = await correosAPI.reenviar(reservaId, token);
      setSuccessMessage(data.mensaje || "Correo reenviado correctamente");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (error: any) {
      alert(error.message || "Error al reenviar correo");
    } finally {
      setCorreoReenviando(null);
    }
  };

  const handleEnviarWhatsApp = async (reservaId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      await reservasAPI.enviarWhatsApp(reservaId, token);
      setSuccessMessage("WhatsApp enviado correctamente");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error: any) {
      alert(error.message || "Error al enviar WhatsApp");
    }
  };

  const handleCancelReserva = async (reservaId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
        const reserva = reservas.find(r => r.id === reservaId);
        if (!reserva) return;
        await reservasAPI.editarReserva(reservaId, {
          nombre_huesped: reserva.guest,
          cedula_huesped: reserva.document,
          email_huesped: reserva.email,
          telefono_huesped: reserva.phone,
          hospedaje: reserva.accommodation,
          check_in: reserva.checkIn,
          check_out: reserva.checkOut,
          numero_huespedes: reserva.guests,
          numero_habitacion: reserva.numeroHabitacion != null ? String(reserva.numeroHabitacion) : "",
          servicio_adicional: reserva.additionalService,
          color_decoracion: reserva.color_decoracion || "",
          mensaje_decoracion: reserva.mensaje_decoracion || "",
          valor_alojamiento: reserva.accommodationValue,
          valor_servicio_adicional: reserva.additionalServiceValue,
          abono: reserva.deposit,
          estado: "Cancelada",
          huespedes_adicionales: reserva.additionalGuests,
          usuario_id: user?.id,
          tipo_hospedaje: "Glamping",
        }, token);
        setReservas(current =>
          current.map(r => r.id === reservaId ? { ...r, status: "Cancelada" } : r)
        );
        setSuccessMessage("Reserva cancelada correctamente");
        setTimeout(() => setSuccessMessage(""), 1500);
      }
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Error cancelando reserva");
    }
  };

  const handleRecalcularValorReserva = async (reserva: any) => {
    const isDiaSol = reserva.accommodation.toLowerCase().includes("de sol");
    const calcOut = isDiaSol ? reserva.checkIn : reserva.checkOut;
    const calc = precioTotal(reserva.accommodation, reserva.checkIn, calcOut, reserva.guests);
    if (calc <= 0) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      await reservasAPI.editarReserva(reserva.id, {
        nombre_huesped: reserva.guest,
        cedula_huesped: reserva.document,
        email_huesped: reserva.email,
        telefono_huesped: reserva.phone,
        hospedaje: reserva.accommodation,
        check_in: reserva.checkIn,
        check_out: reserva.checkOut,
        numero_huespedes: reserva.guests,
        numero_habitacion: reserva.numeroHabitacion != null ? String(reserva.numeroHabitacion) : "",
        servicio_adicional: reserva.additionalService,
        color_decoracion: reserva.color_decoracion || "",
        mensaje_decoracion: reserva.mensaje_decoracion || "",
        valor_alojamiento: calc,
        valor_servicio_adicional: reserva.additionalServiceValue,
        abono: reserva.deposit,
        estado: reserva.status,
        huespedes_adicionales: reserva.additionalGuests,
        usuario_id: user?.id,
        tipo_hospedaje: "Glamping",
      }, token);
      await reloadReservas();
      setToastMsg(`Precio actualizado a ${formatCurrency(calc)}`);
      setTimeout(() => setToastMsg(""), 2500);
    } catch (error: any) {
      alert(error.message || "Error al actualizar precio");
    }
  };

  const handleDeleteReserva = async (reservaId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.")) return;
    try {
      await reservasAPI.delete(reservaId);
      setReservas(current => current.filter(r => r.id !== reservaId));
      setHistorialReserva(null);
    } catch (error: any) {
      alert(error.message || "Error eliminando reserva");
    }
  };

  const handleConfirmarReserva = async (reservaId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const reserva = reservas.find(r => r.id === reservaId);
      if (!reserva) return;
      const isDiaSol = reserva.accommodation.toLowerCase().includes("de sol");
      const calcOut = isDiaSol ? reserva.checkIn : reserva.checkOut;
      const calc = tieneTarifa(reserva.accommodation)
        ? precioTotal(reserva.accommodation, reserva.checkIn, calcOut, reserva.guests)
        : 0;
      const valorAloj = calc > 0 ? calc : reserva.accommodationValue;
      await reservasAPI.editarReserva(reservaId, {
        nombre_huesped: reserva.guest,
        cedula_huesped: reserva.document,
        email_huesped: reserva.email,
        telefono_huesped: reserva.phone,
        hospedaje: reserva.accommodation,
        check_in: reserva.checkIn,
        check_out: reserva.checkOut,
        numero_huespedes: reserva.guests,
        numero_habitacion: reserva.numeroHabitacion != null ? String(reserva.numeroHabitacion) : "",
        servicio_adicional: reserva.additionalService,
        color_decoracion: reserva.color_decoracion || "",
        mensaje_decoracion: reserva.mensaje_decoracion || "",
        valor_alojamiento: valorAloj,
        valor_servicio_adicional: reserva.additionalServiceValue,
        abono: reserva.deposit,
        estado: "Confirmada",
        huespedes_adicionales: reserva.additionalGuests,
        usuario_id: user?.id,
        tipo_hospedaje: "Glamping",
      }, token);
      await reloadReservas();
      setSuccessMessage("Reserva confirmada correctamente");
      setTimeout(() => setSuccessMessage(""), 1500);
    } catch (error: any) {
      alert(error.message || "Error al confirmar reserva");
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
        color: usuario.color ?? COLORES_USUARIO[0],
      });
    } else {
      setEditingUsuario(null);
      setUsuarioForm({
        nombre: "",
        email: "",
        contrasena: "",
        rol: "user",
        activo: true,
        color: COLORES_USUARIO[0],
      });
    }
    setUsuarioMessage("");
    setShowUsuarioModal(true);
  };

  const handleCloseUsuarioModal = () => {
    setShowUsuarioModal(false);
    setEditingUsuario(null);
    setUsuarioMessage("");
    setUsuarioError("");
  };

  const handleSaveUsuario = async () => {
    setUsuarioError("");
    setUsuarioMessage("");
    try {
      if (editingUsuario) {
        await usuariosAPI.update(editingUsuario.id, usuarioForm);
        setUsuarioMessage("Usuario actualizado correctamente");
      } else {
        await usuariosAPI.create(usuarioForm);
        setUsuarioMessage("Usuario creado correctamente");
      }
      await reloadUsuarios();
      setTimeout(handleCloseUsuarioModal, 1500);
    } catch (error: any) {
      setUsuarioError(error.message || "Error guardando usuario");
    }
  };

  const handleToggleActivo = async (usuario: any) => {
    if (usuario.id === user?.id) return;
    const nuevoEstado = !usuario.active;
    try {
      await usuariosAPI.toggleActivo(usuario.id, nuevoEstado);
      setUsuarios(current =>
        current.map(u =>
          u.id === usuario.id
            ? { ...u, active: nuevoEstado, status: nuevoEstado ? "Activo" : "Inactivo" }
            : u
        )
      );
    } catch (error: any) {
      alert(error.message || "Error al cambiar estado del usuario");
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
  const hoy = new Date().toISOString().slice(0, 10);
  const reservasConfirmadas = reservasDisplay.filter(r => r.status === "Confirmada");
  // Reservas cuyo checkout ya ocurrió generan ingreso total; las activas solo el abono recibido.
  const ingresosTotales = reservasConfirmadas.reduce((acc, r) => {
    const completada = r.checkOut <= hoy;
    return acc + (completada ? r.fullValue : r.deposit);
  }, 0);
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
    { label: "Reservas Totales", value: reservasDisplay.length.toString(), icon: Calendar, change: "+12% este mes", modalType: "reservas" as const },
    { label: "Ingresos", value: formatCurrency(ingresosTotales), icon: BarChart3, change: "+8.5% este mes", modalType: "ingresos" as const },
    { label: "Ocupación", value: `${ocupacion}%`, icon: Home, change: "+5% este mes", modalType: "ocupacion" as const },
  ];

  // Devuelve clases de estilo según el estado de la reserva.
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-amber-600/20 text-amber-400 border-amber-600/30";
      case "Pendiente":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Cancelada":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const effectiveCollapsed = sidebarCollapsed && !sidebarHovered;

  return (
    <div className="min-h-screen bg-slate-50 text-[#3d2010] overflow-x-hidden">
      {/* Encabezado principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-4">
            {/* Botón de volver atrás */}
            <button
              onClick={handleLogout}
              className="text-[#7a4828] hover:text-primary transition-colors hidden md:block"
              title="Volver a la página principal"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-[#7a4828] hover:text-primary transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {/* Logo y título clickeables */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              title="Volver a la página principal"
            >
              <img
                src="/images/skblack.png"
                alt="Natural Sound"
                className="h-9 sm:h-11 w-auto object-contain"
              />
              <div className="flex flex-col text-left">
                <h1
                  className="text-lg sm:text-2xl font-semibold text-[#5a3518]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Natural Sound Admin
                </h1>
                <p
                  className="hidden sm:block text-xs text-[#8b5e38] tracking-wide"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Panel de Control
                </p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p
                className="text-sm text-[#5a3518]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {user?.name}
              </p>
              <p
                className="text-xs text-[#8b5e38]"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {user?.role === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#8b5e38] hover:text-[#3d2010] hover:bg-primary/10 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Overlay para cerrar el sidebar en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Barra lateral de navegación */}
        <aside
          className={`
            fixed top-[72px] left-0 h-[calc(100vh-72px)] z-40
            md:static md:top-auto md:left-auto md:h-auto md:z-auto
            bg-white border-r border-slate-200 md:min-h-[calc(100vh-80px)]
            transition-all duration-300 flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${effectiveCollapsed ? "md:w-[68px]" : "w-64"}
          `}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          {/* Botón toggle superior — solo desktop */}
          <div className="hidden md:flex border-b border-slate-200 p-3 justify-end">
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3d2010] hover:bg-slate-100 transition-colors"
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {effectiveCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {[
              { id: "overview", label: "Panel General", icon: BarChart3 },
              { id: "calendario", label: "Calendario", icon: CalendarDays },
              { id: "pendientes", label: "Pendientes", icon: Clock },
              { id: "reservas", label: "Reservas", icon: Calendar },
              { id: "historial", label: "Historial", icon: History },
              ...(user?.role === "admin" ? [{ id: "usuarios", label: "Usuarios", icon: Users }] : []),
              { id: "correos", label: "Correos", icon: Mail },
              { id: "configuracion", label: "Configuración", icon: Settings },
            ].map((item) => {
              const pendientesCount = item.id === "pendientes"
                ? reservasDisplay.filter(r => r.status === "Pendiente").length
                : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    sessionStorage.setItem("adminTab", item.id);
                    if (item.id === "correos") loadData(true);
                    setSidebarOpen(false);
                    setSidebarCollapsed(true);
                    setOverviewModal(null);
                    setOverviewDetailReserva(null);
                  }}
                  title={effectiveCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                    activeTab === item.id
                      ? "bg-primary/15 border border-primary text-primary"
                      : "text-slate-600 hover:text-[#3d2010] hover:bg-slate-100"
                  } ${effectiveCollapsed ? "justify-center" : ""}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!effectiveCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {pendientesCount > 0 && !effectiveCollapsed && (
                    <span className="ml-auto bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                      {pendientesCount}
                    </span>
                  )}
                  {pendientesCount > 0 && effectiveCollapsed && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Botón colapsar/expandir — solo desktop */}
          <div className="hidden md:flex border-t border-slate-200 p-3 justify-end">
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3d2010] hover:bg-slate-100 transition-colors"
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {effectiveCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          {/* Pestaña de resumen */}
          {activeTab === "overview" && (
            <div>
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2
                    className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2"
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
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => loadData()}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded bg-white hover:bg-slate-50 text-[#7a4828] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    Actualizar
                  </button>
                  {lastUpdated && (
                    <span
                      className="text-xs text-slate-400"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Cuadrícula de estadísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} onClick={() => setOverviewModal({ type: stat.modalType, filtroAlojamiento: "" })} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
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
                      className="text-xs text-amber-400"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {stat.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sub-pestañas: Próximas / Concluidas */}
              <div className="bg-white border border-slate-200 rounded-lg mb-8">
                {/* Encabezado con tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setOverviewSubTab("proximas")}
                    className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      overviewSubTab === "proximas"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-[#3d2010]"
                    }`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Próximas Reservas
                  </button>
                  <button
                    onClick={() => setOverviewSubTab("concluidas")}
                    className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      overviewSubTab === "concluidas"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-[#3d2010]"
                    }`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Reservas Concluidas
                  </button>
                </div>

                <div className="p-6 overflow-x-auto">
                  {overviewSubTab === "proximas" && (() => {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const proximas = reservasDisplay
                      .filter(r => r.status !== "Cancelada" && new Date(r.checkIn) >= hoy)
                      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
                      .slice(0, 5);
                    return (
                      <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Huésped</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold hidden sm:table-cell">Alojamiento</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Check-in</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold hidden md:table-cell">Check-out</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proximas.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 px-4 text-center text-slate-500">
                                No hay próximas reservas.
                              </td>
                            </tr>
                          ) : proximas.map((r) => (
                            <tr key={r.id} onClick={() => setOverviewDetailReserva(r)} className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="py-3 px-3 font-medium text-[#3d2010]">{r.guest}</td>
                              <td className="py-3 px-3 text-slate-700 hidden sm:table-cell">{r.accommodation}</td>
                              <td className="py-3 px-3 text-slate-700">{r.checkIn}</td>
                              <td className="py-3 px-3 text-slate-700 hidden md:table-cell">{r.checkOut}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}

                  {overviewSubTab === "concluidas" && (() => {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const concluidas = reservasDisplay
                      .filter(r => new Date(r.checkOut) < hoy)
                      .sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
                    return (
                      <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Huésped</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold hidden sm:table-cell">Alojamiento</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold hidden md:table-cell">Check-in</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Check-out</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold hidden sm:table-cell">Valor Total</th>
                            <th className="text-left py-3 px-3 text-slate-800 font-semibold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {concluidas.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                                No hay reservas concluidas aún.
                              </td>
                            </tr>
                          ) : concluidas.map((r) => (
                            <tr key={r.id} onClick={() => setOverviewDetailReserva(r)} className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="py-3 px-3 font-medium text-[#3d2010]">{r.guest}</td>
                              <td className="py-3 px-3 text-slate-700 hidden sm:table-cell">{r.accommodation}</td>
                              <td className="py-3 px-3 text-slate-700 hidden md:table-cell">{r.checkIn}</td>
                              <td className="py-3 px-3 text-slate-700">{r.checkOut}</td>
                              <td className="py-3 px-3 hidden sm:table-cell">
                                <p className="font-medium text-[#3d2010] whitespace-nowrap">{formatCurrency(r.fullValue)}</p>
                                <span className="text-xs text-amber-700 font-medium">✓ Completado</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>

              {/* Modal detalle de reserva individual — desde Panel General */}
              {overviewDetailReserva && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
                  onClick={() => setOverviewDetailReserva(null)}
                >
                  <div
                    className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between p-6 border-b border-slate-200">
                      <div>
                        <h3 className="text-xl font-semibold text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Detalle de Reserva
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ID #{overviewDetailReserva.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(overviewDetailReserva.status)}`}>
                          {overviewDetailReserva.status}
                        </span>
                        <button onClick={() => setOverviewDetailReserva(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Huésped Principal</p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Nombre</span><span className="font-medium text-[#3d2010]">{overviewDetailReserva.guest}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Cédula</span><span className="text-[#3d2010]">{overviewDetailReserva.document || "—"}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Email</span><span className="text-[#3d2010] break-all text-right max-w-[60%]">{overviewDetailReserva.email}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Personas</span><span className="text-[#3d2010]">{overviewDetailReserva.guests}</span></div>
                        </div>
                      </div>
                      {overviewDetailReserva.additionalGuests?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Huéspedes Adicionales</p>
                          <div className="space-y-2">
                            {overviewDetailReserva.additionalGuests.map((h: any, i: number) => (
                              <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                                <div className="flex justify-between"><span className="text-slate-500">Nombre</span><span className="text-[#3d2010] font-medium">{h.nombre}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Cédula</span><span className="text-[#3d2010]">{h.cedula}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-[#3d2010] break-all text-right max-w-[60%]">{h.email}</span></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Alojamiento y Fechas</p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Alojamiento</span><span className="font-medium text-[#3d2010]">{overviewDetailReserva.accommodation}</span></div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{overviewDetailReserva.accommodation === "Día de Sol" ? "Fecha" : "Check-in"}</span>
                            <span className="text-[#3d2010]">{overviewDetailReserva.checkIn}</span>
                          </div>
                          {overviewDetailReserva.accommodation !== "Día de Sol" && (
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Check-out</span><span className="text-[#3d2010]">{overviewDetailReserva.checkOut}</span></div>
                          )}
                          {overviewDetailReserva.additionalService && overviewDetailReserva.additionalService !== "N/A" && (
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Servicio adicional</span><span className="text-[#3d2010]">{overviewDetailReserva.additionalService}</span></div>
                          )}
                          {overviewDetailReserva.color_decoracion && (
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Color decoración</span><span className="text-[#3d2010]">{overviewDetailReserva.color_decoracion}</span></div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Resumen Financiero</p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm"><span className="text-slate-500">Valor alojamiento</span><span className="text-[#3d2010]">{formatCurrency(overviewDetailReserva.accommodationValue)}</span></div>
                          {overviewDetailReserva.additionalServiceValue > 0 && (
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Servicio adicional</span><span className="text-[#3d2010]">{formatCurrency(overviewDetailReserva.additionalServiceValue)}</span></div>
                          )}
                          {overviewDetailReserva.deposit > 0 && (
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Abono</span><span className="text-amber-700">− {formatCurrency(overviewDetailReserva.deposit)}</span></div>
                          )}
                          <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2 mt-1">
                            <span className="text-[#3d2010]">Total</span>
                            <span className="text-[#3d2010]">{formatCurrency(overviewDetailReserva.fullValue)}</span>
                          </div>
                          {overviewDetailReserva.checkOut < new Date().toISOString().slice(0, 10) && (
                            <div className="mt-3 flex items-center gap-2 py-2.5 px-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <span className="text-amber-700 font-bold text-base leading-none">✓</span>
                              <span className="text-sm font-medium text-amber-800">Pago completado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => { setOverviewDetailReserva(null); setOverviewModal(null); setActiveTab("reservas"); handleOpenReservaModal(overviewDetailReserva); }}
                        className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Editar Reserva
                      </button>
                      <button
                        onClick={() => setOverviewDetailReserva(null)}
                        className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal interactivo Panel General — Reservas / Ingresos / Ocupación */}
              {overviewModal && (() => {
                const filtroAlo = overviewModal.filtroAlojamiento;
                const filtroEst = overviewModal.filtroEstado || "";
                let modalReservas = reservasDisplay;
                if (filtroAlo) modalReservas = modalReservas.filter(r => r.accommodation === filtroAlo);
                if (filtroEst) modalReservas = modalReservas.filter(r => r.status === filtroEst);
                const modalTitles = { reservas: "Reservas Totales", ingresos: "Resumen de Ingresos", ocupacion: "Ocupación General" };
                return (
                  <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                    onClick={() => setOverviewModal(null)}
                  >
                    <div
                      className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Cabecera */}
                      <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h3 className="text-xl font-semibold text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {modalTitles[overviewModal.type]}
                        </h3>
                        <button onClick={() => setOverviewModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      {/* Filtros */}
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Alojamiento</label>
                          <select
                            value={filtroAlo}
                            onChange={e => setOverviewModal(m => m ? { ...m, filtroAlojamiento: e.target.value } : null)}
                            className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] bg-white focus:outline-none focus:border-primary transition-colors"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <option value="">Todos los alojamientos</option>
                            {alojamientos.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                          </select>
                        </div>
                        {overviewModal.type === "reservas" && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Estado</label>
                            <select
                              value={filtroEst}
                              onChange={e => setOverviewModal(m => m ? { ...m, filtroEstado: e.target.value } : null)}
                              className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] bg-white focus:outline-none focus:border-primary transition-colors"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              <option value="">Todos los estados</option>
                              <option value="Pendiente">Pendiente</option>
                              <option value="Confirmada">Confirmada</option>
                              <option value="Cancelada">Cancelada</option>
                            </select>
                          </div>
                        )}
                        {(filtroAlo || filtroEst) && (
                          <button
                            onClick={() => setOverviewModal(m => m ? { ...m, filtroAlojamiento: "", filtroEstado: "" } : null)}
                            className="text-xs text-red-500 hover:text-red-700 underline self-end pb-1"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

                        {/* ── RESERVAS ── */}
                        {overviewModal.type === "reservas" && (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                              {[
                                { label: "Total", value: modalReservas.length, color: "text-slate-900" },
                                { label: "Pendientes", value: modalReservas.filter(r => r.status === "Pendiente").length, color: "text-yellow-600" },
                                { label: "Confirmadas", value: modalReservas.filter(r => r.status === "Confirmada").length, color: "text-amber-700" },
                                { label: "Canceladas", value: modalReservas.filter(r => r.status === "Cancelada").length, color: "text-red-600" },
                              ].map(s => (
                                <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                                  <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Huésped</th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold hidden sm:table-cell">Alojamiento</th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Check-in</th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold hidden sm:table-cell">Check-out</th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Estado</th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold hidden md:table-cell">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {modalReservas.length === 0 ? (
                                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">Sin reservas</td></tr>
                                  ) : modalReservas.map(r => (
                                    <tr key={r.id} onClick={() => setOverviewDetailReserva(r)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                      <td className="py-3 px-4 font-medium text-[#3d2010]">{r.guest}</td>
                                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">{r.accommodation}</td>
                                      <td className="py-3 px-4 text-slate-600">{r.checkIn}</td>
                                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">{r.checkOut}</td>
                                      <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(r.status)}`}>{r.status}</span>
                                      </td>
                                      <td className="py-3 px-4 text-[#3d2010] font-medium hidden md:table-cell whitespace-nowrap">{formatCurrency(r.fullValue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {/* ── INGRESOS ── */}
                        {overviewModal.type === "ingresos" && (() => {
                          const confirmadas = modalReservas.filter(r => r.status === "Confirmada");
                          const completadas = confirmadas.filter(r => r.checkOut <= hoy);
                          const activas = confirmadas.filter(r => r.checkOut > hoy);
                          const totalCompletadas = completadas.reduce((acc, r) => acc + r.fullValue, 0);
                          const totalAbonos = activas.reduce((acc, r) => acc + r.deposit, 0);
                          const totalIngresos = totalCompletadas + totalAbonos;
                          const totalPorCobrar = activas.reduce((acc, r) => acc + r.remainingValue, 0);
                          return (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                <div className="bg-slate-50 rounded-lg p-4 col-span-2 sm:col-span-1">
                                  <p className="text-xs text-slate-500 mb-1">Ingresos recibidos</p>
                                  <p className="text-xl font-bold text-[#3d2010]" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totalIngresos)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-xs text-slate-500 mb-1">Completadas</p>
                                  <p className="text-xl font-bold text-amber-700" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totalCompletadas)}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{completadas.length} reserva{completadas.length !== 1 ? "s" : ""}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-xs text-slate-500 mb-1">Abonos activos</p>
                                  <p className="text-xl font-bold text-amber-600" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totalAbonos)}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{activas.length} reserva{activas.length !== 1 ? "s" : ""}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-xs text-slate-500 mb-1">Por cobrar</p>
                                  <p className="text-xl font-bold text-slate-500" style={{ fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totalPorCobrar)}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">saldo pendiente</p>
                                </div>
                              </div>
                              {!filtroAlo ? (
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Por alojamiento</p>
                                  <div className="space-y-2">
                                    {alojamientos.map(a => {
                                      const aRes = reservasDisplay.filter(r => r.accommodation === a.nombre && r.status === "Confirmada");
                                      const aTotal = aRes.reduce((acc, r) => {
                                        const completada = r.checkOut <= hoy;
                                        return acc + (completada ? r.fullValue : r.deposit);
                                      }, 0);
                                      return (
                                        <div
                                          key={a.id}
                                          onClick={() => setOverviewModal(m => m ? { ...m, filtroAlojamiento: a.nombre } : null)}
                                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                        >
                                          <div>
                                            <p className="text-sm font-medium text-[#3d2010]">{a.nombre}</p>
                                            <p className="text-xs text-slate-500">{aRes.length} reserva{aRes.length !== 1 ? "s" : ""} confirmada{aRes.length !== 1 ? "s" : ""}</p>
                                          </div>
                                          <p className="text-sm font-semibold text-[#3d2010] whitespace-nowrap">{formatCurrency(aTotal)}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Detalle — {filtroAlo}</p>
                                  <div className="space-y-2">
                                    {confirmadas.length === 0 ? (
                                      <p className="text-center text-slate-400 text-sm py-4">Sin reservas confirmadas para este alojamiento</p>
                                    ) : confirmadas.map(r => (
                                      <div key={r.id} onClick={() => setOverviewDetailReserva(r)} className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-medium text-[#3d2010]">{r.guest}</p>
                                            <p className="text-xs text-slate-500">{r.checkIn}{r.accommodation !== "Día de Sol" ? ` → ${r.checkOut}` : ""}</p>
                                          </div>
                                          <p className="text-sm font-semibold text-[#3d2010] whitespace-nowrap">{formatCurrency(r.fullValue)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* ── OCUPACIÓN ── */}
                        {overviewModal.type === "ocupacion" && (() => {
                          const hoyOcup = new Date();
                          const yearOcup = hoyOcup.getFullYear();
                          const monthOcup = hoyOcup.getMonth();
                          const daysInMonthOcup = new Date(yearOcup, monthOcup + 1, 0).getDate();
                          const monthNamesOcup = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                          const alosToShow = filtroAlo ? alojamientos.filter(a => a.nombre === filtroAlo) : alojamientos;
                          return (
                            <>
                              <p className="text-xs text-slate-500 mb-5" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {monthNamesOcup[monthOcup]} {yearOcup} — {daysInMonthOcup} días disponibles por alojamiento
                              </p>
                              <div className="space-y-3">
                                {alosToShow.map(a => {
                                  const aRes = reservasDisplay.filter(r => r.accommodation === a.nombre && r.status !== "Cancelada");
                                  const noches = aRes.reduce((acc, r) => {
                                    const ci = new Date(r.checkIn + "T00:00:00");
                                    const co = new Date(r.checkOut + "T00:00:00");
                                    const mesInicio = new Date(yearOcup, monthOcup, 1);
                                    const mesFin = new Date(yearOcup, monthOcup + 1, 0);
                                    const solapInicio = ci < mesInicio ? mesInicio : ci;
                                    const solapFin = co > mesFin ? mesFin : co;
                                    const n = (solapFin.getTime() - solapInicio.getTime()) / (1000 * 60 * 60 * 24);
                                    return acc + (n > 0 ? n : 0);
                                  }, 0);
                                  const pct = Math.min(100, Math.round((noches / daysInMonthOcup) * 100));
                                  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300";
                                  return (
                                    <div key={a.id} className="bg-slate-50 rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="text-sm font-medium text-[#3d2010]">{a.nombre}</p>
                                          <p className="text-xs text-slate-500">{a.tipo} · {aRes.length} reserva{aRes.length !== 1 ? "s" : ""} activa{aRes.length !== 1 ? "s" : ""}</p>
                                        </div>
                                        <span className="text-xl font-bold text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>{pct}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                                        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                                      </div>
                                      <p className="text-xs text-slate-400">{Math.round(noches)} noches reservadas de {daysInMonthOcup} posibles este mes</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}

                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Reservas Tab */}
          {activeTab === "reservas" && (() => {
            // Aplicar búsqueda y filtros
            let reservasFiltradas = reservasDisplay;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              reservasFiltradas = reservasFiltradas.filter(r =>
                r.guest.toLowerCase().includes(q) ||
                r.accommodation.toLowerCase().includes(q) ||
                r.document.toLowerCase().includes(q)
              );
            }
            if (filtroAlojamiento) {
              reservasFiltradas = reservasFiltradas.filter(r => r.accommodation === filtroAlojamiento);
            }
            if (filtroEstado) {
              reservasFiltradas = reservasFiltradas.filter(r => r.status === filtroEstado);
            }
            if (ordenarPorFecha) {
              reservasFiltradas = [...reservasFiltradas].sort(
                (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
              );
            }

            const hayFiltrosActivos = searchQuery || filtroAlojamiento || filtroEstado || ordenarPorFecha;

            return (
            <div>
              {/* Encabezado con acciones */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Gestión de Reservas
                  </h2>
                  <p className="text-slate-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {reservasFiltradas.length} de {reservasDisplay.length} reservas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Buscador */}
                  <button
                    onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery(""); }}
                    title="Buscar reservas"
                    className={`p-2 rounded border transition-colors ${showSearch ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
                  >
                    <Search size={18} />
                  </button>
                  {/* Filtros */}
                  <button
                    onClick={() => setShowFilters(f => !f)}
                    title="Filtrar reservas"
                    className={`p-2 rounded border transition-colors relative ${showFilters || (filtroAlojamiento || filtroEstado || ordenarPorFecha) ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
                  >
                    <SlidersHorizontal size={18} />
                    {(filtroAlojamiento || filtroEstado || ordenarPorFecha) && !showFilters && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                  {/* Nueva reserva */}
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm"
                    onClick={() => handleOpenReservaModal()}
                  >
                    <Plus size={16} /> Nueva Reserva
                  </button>
                </div>
              </div>

              {/* Barra de búsqueda */}
              {showSearch && (
                <div className="mb-4 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar por huésped, cédula o alojamiento..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-[#3d2010] placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors bg-white"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Panel de filtros */}
              {showFilters && (
                <div className="mb-4 p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap gap-4 items-end">
                  {/* Ordenar por fecha */}
                  <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={ordenarPorFecha}
                      onChange={e => setOrdenarPorFecha(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-[#3d2010]">Fecha más cercana</span>
                  </label>

                  {/* Filtro por alojamiento */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                      Alojamiento
                    </label>
                    <select
                      value={filtroAlojamiento}
                      onChange={e => setFiltroAlojamiento(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] focus:outline-none focus:border-primary transition-colors bg-white"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <option value="">Todos</option>
                      {alojamientos.map(a => (
                        <option key={a.id} value={a.nombre}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por estado */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                      Estado
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={e => setFiltroEstado(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] focus:outline-none focus:border-primary transition-colors bg-white"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <option value="">Todos</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  {/* Limpiar filtros */}
                  {hayFiltrosActivos && (
                    <button
                      onClick={() => { setFiltroAlojamiento(""); setFiltroEstado(""); setOrdenarPorFecha(false); setSearchQuery(""); }}
                      className="text-xs text-red-500 hover:text-red-700 underline self-end pb-1"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Tabla */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Scrollbar espejo — parte superior */}
                <div
                  ref={topScrollRef}
                  className="overflow-x-auto overflow-y-hidden border-b border-slate-100"
                  style={{ height: 14 }}
                  onScroll={() => {
                    if (tableScrollRef.current && topScrollRef.current)
                      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
                  }}
                >
                  <div ref={mirrorRef} style={{ height: 1 }} />
                </div>

                <div
                  ref={tableScrollRef}
                  className="overflow-x-auto"
                  onScroll={() => {
                    if (topScrollRef.current && tableScrollRef.current)
                      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
                  }}
                >
                  <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Huésped</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold hidden md:table-cell">Email</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Alojamiento</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold hidden sm:table-cell">Fechas</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold hidden lg:table-cell">Personas</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold hidden sm:table-cell">Valor total</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold hidden md:table-cell">Restante</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Estado</th>
                        <th className="text-left py-4 px-6 text-slate-800 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservasFiltradas.map((r) => (
                        <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-[#3d2010]">
                            <div className="flex items-center gap-2">
                              {r.creadorColor && (
                                <span
                                  className="shrink-0 w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: r.creadorColor }}
                                  title={r.creadorNombre ? `Creado por: ${r.creadorNombre}` : "Usuario registrado"}
                                />
                              )}
                              <div>
                                <div>{r.guest}</div>
                                {r.numeroReserva && (
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    #{String(r.numeroReserva).padStart(4, "0")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 hidden md:table-cell">{r.email}</td>
                          <td className="py-4 px-6 text-slate-700">{r.accommodation}</td>
                          <td className="py-4 px-6 text-slate-700 text-sm hidden sm:table-cell">
                            {r.checkIn} → {r.checkOut}
                          </td>
                          <td className="py-4 px-6 text-[#3d2010] hidden lg:table-cell">{r.guests}</td>
                          <td className="py-4 px-6 text-[#3d2010] font-medium whitespace-nowrap hidden sm:table-cell">
                            {formatCurrency(r.fullValue)}
                          </td>
                          <td className="py-4 px-6 text-[#3d2010] font-medium whitespace-nowrap hidden md:table-cell">
                            {formatCurrency(r.remainingValue)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenReservaModal(r)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar reserva"
                              >
                                <Edit2 size={16} />
                              </button>
                              {r.tokenPublico && (
                                <button
                                  disabled={r.datosCompletados}
                                  onClick={() => {
                                    const url = `${window.location.origin}/reservar/${r.tokenPublico}`;
                                    navigator.clipboard.writeText(url);
                                    setToastMsg("¡Enlace copiado!");
                                    setTimeout(() => setToastMsg(""), 2000);
                                  }}
                                  className={`p-2 rounded transition-colors ${r.datosCompletados ? "text-slate-300 cursor-not-allowed" : "text-[#5a3518] hover:bg-[#f0e4d0] cursor-pointer"}`}
                                  title={r.datosCompletados ? "El huésped ya completó sus datos" : "Copiar enlace para el huésped"}
                                >
                                  <Link size={16} />
                                </button>
                              )}
                              {r.phone && (
                                <button
                                  onClick={() => handleEnviarWhatsApp(r.id)}
                                  className="p-2 text-amber-700 hover:bg-amber-50 rounded transition-colors"
                                  title="Enviar WhatsApp al huésped"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              )}
                              {r.status !== "Cancelada" && (
                                <button
                                  onClick={() => handleCancelReserva(r.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Cancelar reserva"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReserva(r.id)}
                                className="p-2 text-red-700 hover:bg-red-100 rounded transition-colors"
                                title="Eliminar reserva"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!isLoading && reservasFiltradas.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-10 px-6 text-center text-slate-500">
                            {hayFiltrosActivos
                              ? "Ninguna reserva coincide con los filtros aplicados."
                              : "No hay reservas registradas. Crea la primera con \"Nueva Reserva\"."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
          })()}

          {/* Historial Tab */}
          {activeTab === "historial" && (() => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            let historial = reservasDisplay.filter(r => new Date(r.checkOut) < hoy);

            if (historialSearchQuery.trim()) {
              const q = historialSearchQuery.toLowerCase();
              historial = historial.filter(r =>
                r.guest.toLowerCase().includes(q) ||
                r.accommodation.toLowerCase().includes(q) ||
                r.document.toLowerCase().includes(q)
              );
            }
            if (historialFiltroAlojamiento) {
              historial = historial.filter(r => r.accommodation === historialFiltroAlojamiento);
            }
            if (historialFiltroEstado) {
              historial = historial.filter(r => r.status === historialFiltroEstado);
            }
            historial = historialOrdenarPorFecha
              ? [...historial].sort((a, b) => new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime())
              : [...historial].sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());

            const hayFiltrosHistorial = historialSearchQuery || historialFiltroAlojamiento || historialFiltroEstado || historialOrdenarPorFecha;
            const totalHistorial = reservasDisplay.filter(r => new Date(r.checkOut) < hoy);

            return (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2
                      className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Historial de Reservas
                    </h2>
                    <p className="text-slate-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {historial.length} de {totalHistorial.length} reserva{totalHistorial.length !== 1 ? "s" : ""} concluida{totalHistorial.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Buscador */}
                    <button
                      onClick={() => { setHistorialShowSearch(s => !s); if (historialShowSearch) setHistorialSearchQuery(""); }}
                      title="Buscar en historial"
                      className={`p-2 rounded border transition-colors ${historialShowSearch ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
                    >
                      <Search size={18} />
                    </button>
                    {/* Filtros */}
                    <button
                      onClick={() => setHistorialShowFilters(f => !f)}
                      title="Filtrar historial"
                      className={`p-2 rounded border transition-colors relative ${historialShowFilters || (historialFiltroAlojamiento || historialFiltroEstado || historialOrdenarPorFecha) ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
                    >
                      <SlidersHorizontal size={18} />
                      {(historialFiltroAlojamiento || historialFiltroEstado || historialOrdenarPorFecha) && !historialShowFilters && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Barra de búsqueda */}
                {historialShowSearch && (
                  <div className="mb-4 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar por huésped, cédula o alojamiento..."
                      value={historialSearchQuery}
                      onChange={e => setHistorialSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-[#3d2010] placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors bg-white"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                    {historialSearchQuery && (
                      <button
                        onClick={() => setHistorialSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Panel de filtros */}
                {historialShowFilters && (
                  <div className="mb-4 p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap gap-4 items-end">
                    {/* Ordenar por fecha más antigua */}
                    <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <input
                        type="checkbox"
                        checked={historialOrdenarPorFecha}
                        onChange={e => setHistorialOrdenarPorFecha(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm text-[#3d2010]">Fecha más antigua primero</span>
                    </label>

                    {/* Filtro por alojamiento */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                        Alojamiento
                      </label>
                      <select
                        value={historialFiltroAlojamiento}
                        onChange={e => setHistorialFiltroAlojamiento(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] focus:outline-none focus:border-primary transition-colors bg-white"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="">Todos</option>
                        {alojamientos.map(a => (
                          <option key={a.id} value={a.nombre}>{a.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por estado */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                        Estado
                      </label>
                      <select
                        value={historialFiltroEstado}
                        onChange={e => setHistorialFiltroEstado(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-sm text-[#3d2010] focus:outline-none focus:border-primary transition-colors bg-white"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="">Todos</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </div>

                    {/* Limpiar filtros */}
                    {hayFiltrosHistorial && (
                      <button
                        onClick={() => { setHistorialFiltroAlojamiento(""); setHistorialFiltroEstado(""); setHistorialOrdenarPorFecha(false); setHistorialSearchQuery(""); }}
                        className="text-xs text-red-500 hover:text-red-700 underline self-end pb-1"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}

                {/* Resumen de ingresos del historial */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    {
                      label: "Reservas concluidas",
                      value: totalHistorial.length.toString(),
                      icon: History,
                    },
                    {
                      label: "Ingresos totales",
                      value: formatCurrency(totalHistorial.reduce((acc, r) => acc + (r.fullValue || 0), 0)),
                      icon: BarChart3,
                    },
                    {
                      label: "Confirmadas",
                      value: totalHistorial.filter(r => r.status === "Confirmada").length.toString(),
                      icon: Calendar,
                    },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-slate-600 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>{stat.label}</p>
                        <stat.icon size={20} className="text-primary/50" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold">Huésped</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold hidden sm:table-cell">Alojamiento</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold hidden md:table-cell">Check-in</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold">Check-out</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold hidden sm:table-cell">Personas</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold hidden lg:table-cell">Servicio</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold hidden sm:table-cell">Valor total</th>
                          <th className="text-left py-4 px-4 text-slate-800 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 px-4 text-center text-slate-500">
                              {hayFiltrosHistorial ? "No hay reservas que coincidan con los filtros." : "No hay reservas concluidas aún."}
                            </td>
                          </tr>
                        ) : historial.map(r => (
                          <tr
                            key={r.id}
                            onClick={() => setHistorialReserva(r)}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-4 font-medium text-[#3d2010]">
                              <div className="flex items-center gap-1.5">
                                {r.creadorColor && (
                                  <span
                                    className="shrink-0 w-2 h-2 rounded-full"
                                    style={{ backgroundColor: r.creadorColor }}
                                    title={r.creadorNombre ? `Creado por: ${r.creadorNombre}` : undefined}
                                  />
                                )}
                                <div>
                                  <div>{r.guest}</div>
                                  <div className="text-xs text-slate-500 sm:hidden">{r.accommodation}</div>
                                  {r.numeroReserva && (
                                    <div className="text-[10px] font-mono text-slate-400">#{String(r.numeroReserva).padStart(4, "0")}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-700 hidden sm:table-cell">{r.accommodation}</td>
                            <td className="py-4 px-4 text-slate-700 hidden md:table-cell">{r.checkIn}</td>
                            <td className="py-4 px-4 text-slate-700">{r.checkOut}</td>
                            <td className="py-4 px-4 text-[#3d2010] hidden sm:table-cell">{r.guests}</td>
                            <td className="py-4 px-4 text-slate-600 hidden lg:table-cell">{r.additionalService}</td>
                            <td className="py-4 px-4 hidden sm:table-cell">
                              <p className="font-medium text-[#3d2010] whitespace-nowrap">{formatCurrency(r.fullValue)}</p>
                              <span className="text-xs text-amber-700 font-medium">✓ Completado</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              {/* Modal detalle reserva concluida */}
              {historialReserva && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                  onClick={() => setHistorialReserva(null)}
                >
                  <div
                    className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Cabecera */}
                    <div className="flex items-start justify-between p-6 border-b border-slate-200">
                      <div>
                        <h3 className="text-xl font-semibold text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Detalle de Reserva
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ID #{historialReserva.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(historialReserva.status)}`}>
                          {historialReserva.status}
                        </span>
                        <button onClick={() => setHistorialReserva(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {/* Huésped principal */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                          Huésped Principal
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Nombre</span>
                            <span className="font-medium text-[#3d2010]">{historialReserva.guest}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Cédula</span>
                            <span className="text-[#3d2010]">{historialReserva.document || "—"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Email</span>
                            <span className="text-[#3d2010] break-all text-right max-w-[60%]">{historialReserva.email}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Personas</span>
                            <span className="text-[#3d2010]">{historialReserva.guests}</span>
                          </div>
                        </div>
                      </div>

                      {/* Huéspedes adicionales */}
                      {historialReserva.additionalGuests?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                            Huéspedes Adicionales
                          </p>
                          <div className="space-y-2">
                            {historialReserva.additionalGuests.map((h: any, i: number) => (
                              <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Nombre</span>
                                  <span className="text-[#3d2010] font-medium">{h.nombre}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Cédula</span>
                                  <span className="text-[#3d2010]">{h.cedula}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Email</span>
                                  <span className="text-[#3d2010] break-all text-right max-w-[60%]">{h.email}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alojamiento y fechas */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                          Alojamiento y Fechas
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Alojamiento</span>
                            <span className="font-medium text-[#3d2010]">{historialReserva.accommodation}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Check-in</span>
                            <span className="text-[#3d2010]">{historialReserva.checkIn}</span>
                          </div>
                          {historialReserva.accommodation !== "Día de Sol" && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Check-out</span>
                              <span className="text-[#3d2010]">{historialReserva.checkOut}</span>
                            </div>
                          )}
                          {historialReserva.additionalService && historialReserva.additionalService !== "N/A" && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Servicio adicional</span>
                              <span className="text-[#3d2010]">{historialReserva.additionalService}</span>
                            </div>
                          )}
                          {historialReserva.color_decoracion && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Color decoración</span>
                              <span className="text-[#3d2010]">{historialReserva.color_decoracion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resumen financiero */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                          Resumen Financiero
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Valor alojamiento</span>
                            <span className="text-[#3d2010]">{formatCurrency(historialReserva.accommodationValue)}</span>
                          </div>
                          {historialReserva.additionalServiceValue > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Servicio adicional</span>
                              <span className="text-[#3d2010]">{formatCurrency(historialReserva.additionalServiceValue)}</span>
                            </div>
                          )}
                          {historialReserva.deposit > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Abono</span>
                              <span className="text-amber-700">− {formatCurrency(historialReserva.deposit)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2 mt-1">
                            <span className="text-[#3d2010]">Total</span>
                            <span className="text-[#3d2010]">{formatCurrency(historialReserva.fullValue)}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 py-2.5 px-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <span className="text-amber-700 font-bold text-base leading-none">✓</span>
                            <span className="text-sm font-medium text-amber-800">Pago completado</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pie del modal */}
                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => handleDeleteReserva(historialReserva.id)}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                      <button
                        onClick={() => setHistorialReserva(null)}
                        className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* Calendario Tab */}
          {activeTab === "calendario" && (() => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const { year, month } = calMonth;
            const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
            const dayNames = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

            const reservasActivas = calFiltroAlojamiento
              ? reservasDisplay.filter(r => r.accommodation === calFiltroAlojamiento && r.status !== "Cancelada")
              : reservasDisplay.filter(r => r.status !== "Cancelada");

            const calAloData = calFiltroAlojamiento ? alojamientos.find(a => a.nombre === calFiltroAlojamiento) : null;
            const calLimite: number = calAloData?.limite_reservas ?? 1;

            const parseLocalDate = (dateStr: string) => {
              const [y, m, d] = dateStr.split('-').map(Number);
              return new Date(y, m - 1, d);
            };

            const getDayReservations = (day: number) => {
              const date = new Date(year, month, day);
              return reservasActivas.filter(r => {
                const ci = parseLocalDate(r.checkIn);
                const co = parseLocalDate(r.checkOut);
                if (ci.getTime() === co.getTime()) return date.getTime() === ci.getTime();
                return date >= ci && date < co;
              });
            };

            const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
            const cells = Array.from({ length: totalCells }, (_, i) => {
              const d = i - firstDow + 1;
              return d >= 1 && d <= daysInMonth ? d : null;
            });

            const reservasMes = reservasActivas
              .filter(r => {
                const ci = new Date(r.checkIn);
                const co = new Date(r.checkOut);
                return ci <= new Date(year, month + 1, 0) && co >= new Date(year, month, 1);
              })
              .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

            return (
              <div>
                {/* Encabezado */}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Calendario de Disponibilidad
                    </h2>
                    <p className="text-slate-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Fechas disponibles y reservadas por alojamiento
                    </p>
                  </div>
                  <select
                    value={calFiltroAlojamiento}
                    onChange={e => setCalFiltroAlojamiento(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm text-[#3d2010] focus:outline-none focus:border-primary bg-white"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <option value="">Todos los alojamientos</option>
                    {alojamientos.map(a => (
                      <option key={a.id} value={a.nombre}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {[
                    { color: "bg-amber-100 border-amber-300", label: "Disponible" },
                    ...(calLimite > 1 ? [{ color: "bg-amber-100 border-amber-300", label: "Parcialmente ocupado" }] : []),
                    { color: "bg-red-100 border-red-300", label: calLimite > 1 ? "Sin disponibilidad" : "Reservado" },
                    { color: "bg-primary/10 border-primary border-2", label: "Hoy" },
                    { color: "bg-slate-100 border-slate-200", label: "Pasado" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded border ${l.color}`} />
                      <span className="text-slate-500">{l.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-dashed border-yellow-400 bg-yellow-50 shrink-0" />
                    <span className="text-slate-500">Pendiente de confirmación</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-orange-500 leading-none"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      FEST
                    </span>
                    <span className="text-slate-500">Festivo</span>
                  </div>
                </div>

                {/* Tarjeta del calendario */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6">
                  {/* Navegación mes */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                      className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#3d2010] transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-base md:text-lg font-semibold text-[#5a3518] capitalize" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                      className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#3d2010] transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Cabecera días */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-xs font-medium text-slate-400 py-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Celdas del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} className="min-h-[52px]" />;
                      const date = new Date(year, month, day);
                      date.setHours(0, 0, 0, 0);
                      const isToday = date.getTime() === hoy.getTime();
                      const isPast = date < hoy;
                      const dayRes = getDayReservations(day);
                      const isFullyBooked = dayRes.length >= calLimite;
                      const isPartiallyBooked = dayRes.length > 0 && !isFullyBooked;
                      const calDateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const esFestivoDay = !isPast && esFestivo(calDateStr);

                      const base = "rounded-lg p-1 min-h-[52px] border text-xs transition-all text-left w-full ";
                      const color = isToday
                        ? "border-primary border-2 bg-primary/10 hover:bg-primary/20"
                        : isPast
                          ? "bg-slate-50 border-slate-100 hover:bg-slate-100 cursor-default"
                          : isFullyBooked
                            ? "bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer"
                            : isPartiallyBooked
                              ? "bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer"
                              : "bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer";

                      const numColor = isToday ? "text-primary" : isPast ? "text-slate-400" : isFullyBooked ? "text-red-600" : isPartiallyBooked ? "text-amber-600" : "text-amber-800";

                      return (
                        <button
                          key={day}
                          className={base + color}
                          onClick={() => setCalSelectedDay({ year, month, day })}
                          title={
                            isPast ? `${day}/${month + 1}/${year}`
                            : isFullyBooked ? `Sin disponibilidad (${dayRes.length}/${calLimite})${esFestivoDay ? " · Festivo" : ""}`
                            : isPartiallyBooked ? `${dayRes.length}/${calLimite} ocupados — crear reserva${esFestivoDay ? " · Festivo" : ""}`
                            : esFestivoDay ? "Festivo — crear reserva"
                            : "Crear reserva"
                          }
                        >
                          <div className="flex items-center justify-end gap-1 mb-0.5">
                            {esFestivoDay && (
                              <span className="text-[8px] font-bold text-orange-500 leading-none tracking-tight"
                                style={{ fontFamily: "'DM Mono', monospace" }}>
                                FEST
                              </span>
                            )}
                            <span className={`font-semibold ${numColor}`}>{day}</span>
                          </div>
                          {dayRes.length > 0 && (
                            <div className="space-y-0.5">
                              {dayRes.slice(0, 2).map(r => (
                                <div
                                  key={r.id}
                                  className={`truncate text-[10px] leading-tight rounded px-1 py-0.5 ${
                                    isPast
                                      ? "bg-slate-200 text-slate-500"
                                      : r.status === "Pendiente"
                                        ? "bg-yellow-50 text-yellow-700 border border-dashed border-yellow-400"
                                        : isFullyBooked
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                  }`}
                                  title={`${r.guest} · ${r.accommodation}${r.status === "Pendiente" ? " · Pendiente de confirmación" : ""}`}
                                >
                                  {calFiltroAlojamiento ? r.guest : r.accommodation}
                                </div>
                              ))}
                              {dayRes.length > 2 && (
                                <div className={`text-[10px] ${isPast ? "text-slate-400" : isFullyBooked ? "text-red-500" : "text-amber-500"}`}>+{dayRes.length - 2} más</div>
                              )}
                              {isPartiallyBooked && calLimite > 1 && (
                                <div className="text-[10px] text-amber-600 font-medium">{dayRes.length}/{calLimite}</div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de reservas del mes */}
                {reservasMes.length > 0 && (
                  <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#5a3518]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Reservas en {monthNames[month]}
                      </p>
                      <div className="flex items-center gap-2">
                        {reservasMes.filter(r => r.status === "Pendiente").length > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {reservasMes.filter(r => r.status === "Pendiente").length} pendiente{reservasMes.filter(r => r.status === "Pendiente").length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {reservasMes.length} reserva{reservasMes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {reservasMes.map(r => (
                        <div
                          key={r.id}
                          className="border border-slate-200 rounded-lg p-3 flex items-start gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#3d2010] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                              {r.guest}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {r.accommodation}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {r.checkIn} → {r.checkOut}
                            </p>
                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {r.status === "Pendiente" && (
                              <button
                                onClick={() => handleConfirmarReserva(r.id)}
                                className="px-2 py-1 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors font-medium"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                                title="Confirmar reserva"
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenReservaModal(r)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar reserva"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {reservasMes.length === 0 && (
                  <div className="mt-6 py-8 text-center text-slate-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    No hay reservas en {monthNames[month]} {year}.
                  </div>
                )}

                {/* Modal de detalle del día seleccionado */}
                {calSelectedDay && (() => {
                  const { year: sy, month: sm, day: sd } = calSelectedDay;
                  const selDate = new Date(sy, sm, sd);
                  selDate.setHours(0, 0, 0, 0);
                  const isPastDay = selDate < hoy;
                  const selDateStr = `${sy}-${String(sm + 1).padStart(2, "0")}-${String(sd).padStart(2, "0")}`;
                  const selRes = reservasActivas.filter(r => {
                    const ci = parseLocalDate(r.checkIn);
                    const co = parseLocalDate(r.checkOut);
                    if (ci.getTime() === co.getTime()) return selDate.getTime() === ci.getTime();
                    return selDate >= ci && selDate < co;
                  });

                  return (
                    <div
                      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                      onClick={() => setCalSelectedDay(null)}
                    >
                      <div
                        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Cabecera del popup */}
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <h3
                              className="text-lg font-semibold text-[#5a3518]"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {sd} de {monthNames[sm]} {sy}
                            </h3>
                            <p
                              className="text-sm text-slate-500 mt-0.5"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {selRes.length === 0
                                ? isPastDay ? "Sin reservas" : "Fecha disponible"
                                : `${selRes.length} reserva${selRes.length !== 1 ? "s" : ""} activa${selRes.length !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                          <button
                            onClick={() => setCalSelectedDay(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Lista de reservas del día */}
                        {selRes.length > 0 && (
                          <div className="space-y-2 mb-5">
                            {selRes.map(r => (
                              <div
                                key={r.id}
                                className="border border-slate-200 rounded-lg p-3 flex items-start gap-3 hover:border-slate-300 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {r.creadorColor && (
                                      <span
                                        className="shrink-0 w-2 h-2 rounded-full"
                                        style={{ backgroundColor: r.creadorColor }}
                                        title={r.creadorNombre ? `Creado por: ${r.creadorNombre}` : undefined}
                                      />
                                    )}
                                    <p className="font-medium text-[#3d2010] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                      {r.guest}
                                    </p>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                                    {r.accommodation}
                                    {r.numeroReserva ? ` · #${String(r.numeroReserva).padStart(4, "0")}` : ""}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                                    {r.checkIn} → {r.checkOut}
                                  </p>
                                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border ${getStatusColor(r.status)}`}>
                                    {r.status}
                                  </span>
                                </div>
                                  <div className="flex flex-col gap-1 shrink-0">
                                  {r.status === "Pendiente" && (
                                    <button
                                      onClick={() => {
                                        setCalSelectedDay(null);
                                        handleConfirmarReserva(r.id);
                                      }}
                                      className="px-2 py-1 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors font-medium"
                                      style={{ fontFamily: "'DM Mono', monospace" }}
                                      title="Confirmar reserva"
                                    >
                                      Confirmar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setCalSelectedDay(null);
                                      handleOpenReservaModal(r);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar reserva"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botón nueva reserva siempre disponible */}
                        <button
                          onClick={() => {
                            setCalSelectedDay(null);
                            handleOpenReservaModal(undefined, selDateStr);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <Plus size={16} />
                          Nueva reserva para este día
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Reservas Pendientes Tab */}
          {activeTab === "pendientes" && (() => {
            const reservasPendientes = reservasDisplay
              .filter(r => r.status === "Pendiente")
              .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
            return (
              <div>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Reservas Pendientes
                    </h2>
                    <p className="text-slate-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {reservasPendientes.length} reserva{reservasPendientes.length !== 1 ? "s" : ""} pendiente{reservasPendientes.length !== 1 ? "s" : ""} de confirmación
                    </p>
                  </div>
                  <button
                    onClick={() => loadData()}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded bg-white hover:bg-slate-50 text-[#7a4828] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    Actualizar
                  </button>
                </div>

                {reservasPendientes.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg py-16 text-center">
                    <CheckCircle size={40} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      No hay reservas pendientes de confirmación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservasPendientes.map(r => (
                      <div key={r.id} className="bg-white border border-yellow-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full text-xs font-medium">
                                Pendiente de confirmación
                              </span>
                              {r.numeroReserva && (
                                <span className="text-xs font-mono text-slate-400">
                                  #{String(r.numeroReserva).padStart(4, "0")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {r.creadorColor && (
                                <span
                                  className="shrink-0 w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: r.creadorColor }}
                                  title={r.creadorNombre ? `Creado por: ${r.creadorNombre}` : "Usuario registrado"}
                                />
                              )}
                              <p className="font-semibold text-[#3d2010]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {r.guest || "Sin nombre — pendiente de completar datos"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>
                              <span>{r.accommodation}</span>
                              <span>·</span>
                              <span>{r.checkIn}{r.accommodation !== "Día de Sol" ? ` → ${r.checkOut}` : ""}</span>
                              <span>·</span>
                              <span>{r.guests} persona{r.guests !== 1 ? "s" : ""}</span>
                            </div>
                            {r.email && (
                              <p className="text-xs text-slate-400 mt-0.5">{r.email}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleConfirmarReserva(r.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-800 transition-colors text-xs font-medium"
                              title="Confirmar reserva"
                            >
                              <CheckCircle size={13} />
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleOpenReservaModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar reserva"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleCancelReserva(r.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Cancelar reserva"
                            >
                              <X size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteReserva(r.id)}
                              className="p-2 text-red-700 hover:bg-red-100 rounded transition-colors"
                              title="Eliminar reserva"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Valor:</span>
                            {(() => {
                              const isDiaSol = r.accommodation.toLowerCase().includes("de sol");
                              const calcOut = isDiaSol ? r.checkIn : r.checkOut;
                              const calc = tieneTarifa(r.accommodation)
                                ? precioTotal(r.accommodation, r.checkIn, calcOut, r.guests)
                                : 0;
                              return (
                                <span className="font-medium text-[#3d2010]">
                                  {calc > 0 ? formatCurrency(calc) : formatCurrency(r.fullValue)}
                                </span>
                              );
                            })()}
                          </div>
                          {r.deposit > 0 && (
                            <div className="flex gap-1">
                              <span className="text-slate-400">Abono:</span>
                              <span className="font-medium text-amber-700">{formatCurrency(r.deposit)}</span>
                            </div>
                          )}
                          {r.tokenPublico && !r.datosCompletados && (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/reservar/${r.tokenPublico}`;
                                navigator.clipboard.writeText(url);
                                setToastMsg("¡Enlace copiado!");
                                setTimeout(() => setToastMsg(""), 2000);
                              }}
                              className="flex items-center gap-1 text-[#5a3518] hover:underline"
                            >
                              <Link size={11} />
                              Copiar enlace para el huésped
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Usuarios Tab */}
          {activeTab === "usuarios" && (
            <div>
              <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2"
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
                {user?.role === "admin" && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                    onClick={() => handleOpenUsuarioModal()}
                  >
                    <Plus size={18} /> Nuevo Usuario
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuariosDisplay && usuariosDisplay.length > 0 ? usuariosDisplay.map((u) => (
                  <div
                    key={u.id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-all ${
                      u.active
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-slate-50 border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {u.color && (
                          <span
                            className="shrink-0 w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: u.color }}
                            title="Color identificador en reservas"
                          />
                        )}
                        <span
                          className="text-xs font-mono bg-[#f0e4d0] text-[#5a3518] border border-[#c8aa82] px-2 py-0.5 rounded"
                          title="Código de identificación"
                        >
                          {u.codigo}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${
                          u.role === "admin"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                          {u.role === "admin" ? "Admin" : "Usuario"}
                        </span>
                        {!u.active && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">
                            Deshabilitado
                          </span>
                        )}
                      </div>
                      <h3
                        className={`text-lg font-semibold ${u.active ? "text-slate-900" : "text-slate-500"}`}
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {u.name}
                      </h3>
                      <p
                        className="text-sm text-slate-600"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {u.email}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">ID privado:</span>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded select-all">#{u.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Registrado:</span>
                        <span className="text-[#3d2010]">{u.joined}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#8b5e38]">Estado:</span>
                        <span className={`px-2 py-1 rounded text-xs border ${
                          u.active
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {u.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    {user?.role === "admin" && (
                      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenUsuarioModal(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(u)}
                          disabled={u.id === user?.id}
                          title={
                            u.id === user?.id
                              ? "No puedes deshabilitarte a ti mismo"
                              : u.active
                              ? "Deshabilitar usuario"
                              : "Habilitar usuario"
                          }
                          className={`p-2 rounded transition-colors disabled:text-slate-300 disabled:hover:bg-transparent ${
                            u.active
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
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
                    )}
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-[#8b5e38]">
                      {isLoading ? "Cargando usuarios..." : "No hay usuarios registrados."}
                    </p>
                  </div>
                )}
              </div>

              {showUsuarioModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-4 sm:p-8 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-lg relative text-[#3d2010]">
                    <button
                      className="absolute top-4 right-4 text-[#728875] hover:text-[#3d2010] transition-colors"
                      onClick={handleCloseUsuarioModal}
                    >
                      <X size={20} />
                    </button>
                    <h3 className="text-xl font-semibold mb-6 text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                        <label className="block text-sm mb-1 text-[#7a4828]">Nombre</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
                          value={usuarioForm.nombre}
                          onChange={event => setUsuarioForm(form => ({ ...form, nombre: event.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Email</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
                          value={usuarioForm.email}
                          onChange={event => setUsuarioForm(form => ({ ...form, email: event.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">
                          Contraseña {editingUsuario && "(opcional)"}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
                          value={usuarioForm.contrasena}
                          onChange={event => setUsuarioForm(form => ({ ...form, contrasena: event.target.value }))}
                          required={!editingUsuario}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Rol</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
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
                      <div>
                        <label className="flex items-center gap-1.5 text-sm text-[#7a4828] mb-2">
                          <Palette size={14} />
                          Color identificador
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COLORES_USUARIO.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setUsuarioForm(form => ({ ...form, color: c }))}
                              className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                              style={{
                                backgroundColor: c,
                                boxShadow: usuarioForm.color === c
                                  ? `0 0 0 2px white, 0 0 0 4px ${c}`
                                  : undefined,
                              }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#7a4828]">
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
                        <div className="text-center text-sm py-2 px-3 bg-amber-50 border border-amber-200 rounded text-amber-700">
                          {usuarioMessage}
                        </div>
                      )}
                      {usuarioError && (
                        <div className="text-center text-sm py-2 px-3 bg-red-50 border border-red-200 rounded text-red-600">
                          {usuarioError}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Correos Tab */}
          {activeTab === "correos" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Correos
                </h2>
                <p className="text-slate-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Gestiona el envío de confirmaciones por correo electrónico
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Estado SMTP */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#3d2010] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Estado de configuración
                  </h3>
                  {correoEstado ? (
                    <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${correoEstado.configurado ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
                      {correoEstado.configurado
                        ? <CheckCircle size={22} className="text-amber-700 shrink-0" />
                        : <XCircle size={22} className="text-red-500 shrink-0" />}
                      <div>
                        <p className={`font-medium text-sm ${correoEstado.configurado ? "text-amber-800" : "text-red-600"}`}>
                          {correoEstado.configurado ? "Conexión activa" : "Sin conexión"}
                        </p>
                        {correoEstado.correo && (
                          <p className="text-xs text-amber-700 mt-0.5">{correoEstado.correo}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">{correoEstado.mensaje}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mb-4">Haz clic en verificar para comprobar la conexión SMTP.</p>
                  )}
                  <button
                    onClick={handleVerEstadoCorreo}
                    disabled={correoEstadoCargando}
                    className="w-full py-2 bg-[#3d2010] text-white rounded-lg hover:bg-[#5a3518] transition-colors disabled:opacity-50 text-sm font-medium"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {correoEstadoCargando ? "Verificando..." : "Verificar conexión"}
                  </button>
                </div>

                {/* Correo de prueba */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#3d2010] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Enviar correo de prueba
                  </h3>
                  <form onSubmit={handleEnviarCorreoPrueba} className="space-y-3">
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={correoPrueba}
                      onChange={e => setCorreoPrueba(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2010]/30"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <button
                      type="submit"
                      disabled={correoPruebaEnviando}
                      className="w-full py-2 bg-[#3d2010] text-white rounded-lg hover:bg-[#5a3518] transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <Send size={15} />
                      {correoPruebaEnviando ? "Enviando..." : "Enviar prueba"}
                    </button>
                    {correoPruebaMsg && (
                      <p className={`text-sm text-center ${correoPruebaMsg.startsWith("Error") ? "text-red-500" : "text-amber-700"}`}>
                        {correoPruebaMsg}
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Tabla de reservas confirmadas */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-[#3d2010]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Reenviar confirmación
                  </h3>
                  <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Reservas confirmadas con correo registrado
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-left">
                        <th className="py-3 px-4 font-medium">#</th>
                        <th className="py-3 px-4 font-medium">Huésped</th>
                        <th className="py-3 px-4 font-medium">Correo</th>
                        <th className="py-3 px-4 font-medium">Alojamiento</th>
                        <th className="py-3 px-4 font-medium">Check-in</th>
                        <th className="py-3 px-4 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas
                        .filter(r => r.status === "Confirmada" && r.email)
                        .map(r => (
                          <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-400">{r.id}</td>
                            <td className="py-3 px-4 font-medium text-[#3d2010]">{r.guest}</td>
                            <td className="py-3 px-4 text-slate-600">{r.email}</td>
                            <td className="py-3 px-4 text-slate-600">{r.accommodation}</td>
                            <td className="py-3 px-4 text-slate-600">{r.checkIn}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleReenviarCorreo(r.id)}
                                disabled={correoReenviando === r.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d2010] text-white rounded-lg hover:bg-[#5a3518] transition-colors disabled:opacity-50 text-xs font-medium"
                              >
                                <Mail size={13} />
                                {correoReenviando === r.id ? "Enviando..." : "Reenviar"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {reservas.filter(r => r.status === "Confirmada" && r.email).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                            No hay reservas confirmadas con correo registrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Configuración Tab */}
          {activeTab === "configuracion" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl md:text-3xl font-semibold text-[#5a3518] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Configuración
                </h2>
                <p className="text-slate-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Personaliza tu cuenta y preferencias
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Información personal editable */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Información Personal
                  </h3>
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setConfigLoading(true);
                      setConfigMessage("");
                      try {
                        await usuariosAPI.updatePerfil(perfilForm);
                        setConfigMessage("Perfil actualizado correctamente");
                      } catch (err: any) {
                        setConfigMessage(err.message || "Error al guardar");
                      } finally {
                        setConfigLoading(false);
                        setTimeout(() => setConfigMessage(""), 3000);
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>ID de usuario</label>
                      <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded bg-slate-50">
                        <span className="text-xs font-mono text-slate-400 select-none">#</span>
                        <span className="font-mono text-[#3d2010] text-sm select-all">{perfilId ?? user?.id ?? '—'}</span>
                        <span className="ml-auto text-xs text-slate-400 italic" style={{ fontFamily: "'DM Mono', monospace" }}>solo lectura</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Nombre</label>
                      <input
                        type="text"
                        value={perfilForm.nombre}
                        onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded text-[#3d2010] focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Email</label>
                      <input
                        type="email"
                        value={perfilForm.email}
                        onChange={e => setPerfilForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded text-[#3d2010] focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={configLoading}
                      className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {configLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    {configMessage && (
                      <p className={`text-sm text-center ${configMessage.includes("Error") ? "text-red-500" : "text-amber-700"}`}>
                        {configMessage}
                      </p>
                    )}
                  </form>
                </div>

                {/* Preferencias guardadas en BD */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Preferencias
                  </h3>
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setConfigLoading(true);
                      setConfigMessage("");
                      try {
                        await usuariosAPI.updateConfig(user!.id, {
                          recibir_notificaciones: config.recibir_notificaciones ? 1 : 0,
                          notificaciones_reservas: config.notificaciones_reservas ? 1 : 0,
                          compartir_datos: config.compartir_datos ? 1 : 0,
                        });
                        setConfigMessage("Preferencias guardadas correctamente");
                      } catch (err: any) {
                        setConfigMessage(err.message || "Error al guardar");
                      } finally {
                        setConfigLoading(false);
                        setTimeout(() => setConfigMessage(""), 3000);
                      }
                    }}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.recibir_notificaciones}
                        onChange={e => setConfig(c => ({ ...c, recibir_notificaciones: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[#3d2010] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Recibir notificaciones por email
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notificaciones_reservas}
                        onChange={e => setConfig(c => ({ ...c, notificaciones_reservas: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[#3d2010] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Actualizar sobre nuevas reservas
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.compartir_datos}
                        onChange={e => setConfig(c => ({ ...c, compartir_datos: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[#3d2010] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Compartir datos para análisis
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={configLoading}
                      className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm mt-2"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {configLoading ? "Guardando..." : "Guardar Preferencias"}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}
          {/* Modal crear/editar reserva — global, visible desde cualquier pestaña */}
          {showReservaModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 sm:p-8 w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-lg relative text-[#3d2010]">
                <button
                  className="absolute top-4 right-4 text-[#728875] hover:text-[#3d2010] transition-colors"
                  onClick={handleCloseReservaModal}
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-semibold mb-6 text-[#5a3518]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {editingReserva ? "Editar Reserva" : "Nueva Reserva"}
                </h3>
                <form
                  onSubmit={e => { e.preventDefault(); handleSaveReserva(); }}
                  className="space-y-4"
                >
                  <div className="flex gap-2 border-b border-[#d7e1d8] pb-3">
                    <button
                      type="button"
                      onClick={() => setReservaModalTab("principal")}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${reservaModalTab === "principal" ? "bg-[#e5eee7] text-[#3d2010]" : "text-[#718575] hover:text-[#3d2010]"}`}
                    >
                      Huésped principal
                    </button>
                    {reservaForm.numero_huespedes > 1 && (
                      <button
                        type="button"
                        onClick={() => setReservaModalTab("adicionales")}
                        className={`px-3 py-2 rounded-md text-sm transition-colors ${reservaModalTab === "adicionales" ? "bg-[#e5eee7] text-[#3d2010]" : "text-[#718575] hover:text-[#3d2010]"}`}
                      >
                        Demás huéspedes ({reservaForm.numero_huespedes - 1})
                      </button>
                    )}
                  </div>

                  {reservaModalTab === "principal" && (
                    <>
                      <div className="relative">
                        <label className="block text-sm mb-1 text-[#7a4828]">
                          Nombre del huésped
                          {!editingReserva && <span className="text-slate-400 text-xs ml-1">(opcional — el huésped lo completa via enlace)</span>}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                          value={reservaForm.nombre_huesped}
                          onChange={e => {
                            setReservaForm(f => ({ ...f, nombre_huesped: e.target.value }));
                            buscarHuespedes(e.target.value);
                          }}
                          onBlur={() => setTimeout(() => setSugerenciasHuesped([]), 150)}
                          autoComplete="off"
                        />
                        {sugerenciasHuesped.length > 0 && (
                          <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                            {sugerenciasHuesped.map((r, i) => (
                              <li
                                key={i}
                                onMouseDown={() => seleccionarHuesped(r)}
                                className="px-3 py-2 hover:bg-[#f5e8d5] cursor-pointer border-b border-slate-100 last:border-0"
                              >
                                <p className="text-sm font-medium text-[#3d2010]">{r.guest}</p>
                                <p className="text-xs text-slate-400">{r.document} · {r.email}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Cédula del huésped principal</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                          value={reservaForm.cedula_huesped}
                          onChange={e => setReservaForm(f => ({ ...f, cedula_huesped: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Email del huésped</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                          value={reservaForm.email_huesped}
                          onChange={e => setReservaForm(f => ({ ...f, email_huesped: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">WhatsApp del huésped</label>
                        <div className="flex rounded border border-slate-200 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                          <select
                            value={indicativoAdmin}
                            onChange={e => setIndicativoAdmin(e.target.value)}
                            className="w-[82px] shrink-0 bg-slate-50 border-r border-slate-200 text-[#3d2010] text-sm pl-2 pr-1 py-2 focus:outline-none cursor-pointer"
                          >
                            {INDICATIVOS_ADMIN.map(({ code, flag }) => (
                              <option key={code} value={code}>{flag} {code}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            inputMode="tel"
                            className="flex-1 px-3 py-2 text-[#3d2010] placeholder:text-[#9db5a0] focus:outline-none bg-white text-sm"
                            placeholder="300 000 0000"
                            value={reservaForm.telefono_huesped}
                            onChange={e => setReservaForm(f => ({ ...f, telefono_huesped: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Alojamiento</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
                          value={reservaForm.hospedaje}
                          onChange={e => {
                            setAdminServiciosSeleccionados([]);
                            setReservaForm(f => ({
                              ...f,
                              hospedaje: e.target.value,
                              check_out: e.target.value === "Día de Sol" ? f.check_in : f.check_out,
                              servicio_adicional: "N/A",
                              color_decoracion: "",
                              mensaje_decoracion: "",
                              valor_servicio_adicional: 0,
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
                          <label className="block text-sm mb-1 text-[#7a4828]">
                            {reservaForm.hospedaje === "Día de Sol" ? "Fecha" : "Check-in"}
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded text-[#3d2010]"
                            value={reservaForm.check_in}
                            onChange={e => setReservaForm(f => ({
                              ...f,
                              check_in: e.target.value,
                              check_out: f.hospedaje === "Día de Sol" ? e.target.value : f.check_out,
                            }))}
                            required
                          />
                        </div>
                        {reservaForm.hospedaje !== "Día de Sol" && (
                          <div className="flex-1">
                            <label className="block text-sm mb-1 text-[#7a4828]">Check-out</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border rounded text-[#3d2010]"
                              value={reservaForm.check_out}
                              onChange={e => setReservaForm(f => ({ ...f, check_out: e.target.value }))}
                              required
                            />
                          </div>
                        )}
                      </div>
                      {reservaForm.hospedaje && (
                        <>
                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Número de personas</label>
                            <select
                              className="w-full px-3 py-2 border rounded text-[#3d2010]"
                              value={reservaForm.numero_huespedes}
                              onChange={e => handleCantidadHuespedesChange(Number(e.target.value))}
                              required
                            >
                              {Array.from({ length: maxHuespedes(reservaForm.hospedaje) }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1} persona{i + 1 !== 1 ? "s" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          {(reservaForm.hospedaje.toLowerCase().includes("pareja") || reservaForm.hospedaje.toLowerCase().includes("cuadruple")) && (
                            <div>
                              <label className="block text-sm mb-1 text-[#7a4828]">Número de habitación</label>
                              {reservaForm.hospedaje.toLowerCase().includes("cuadruple") ? (
                                <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-500 text-sm">
                                  Habitación 5
                                </div>
                              ) : (
                                <select
                                  className="w-full px-3 py-2 border rounded text-[#3d2010]"
                                  value={reservaForm.numero_habitacion}
                                  onChange={e => setReservaForm(f => ({ ...f, numero_habitacion: e.target.value }))}
                                  required
                                >
                                  <option value="">Selecciona una habitación</option>
                                  {[1, 2, 3, 4].map(n => (
                                    <option key={n} value={String(n)}>Habitación {n}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                          {(() => {
                            const serviciosAlo = serviciosDisponibles(reservaForm.hospedaje);
                            if (serviciosAlo.length === 0) return null;
                            return (
                              <div>
                                <label className="block text-sm mb-2 text-[#7a4828]">Servicios adicionales</label>
                                <div className="space-y-2">
                                  {serviciosAlo.map(s => {
                                    const isSelected = adminServiciosSeleccionados.some(x => x.servicio === s);
                                    const precio = precioServicio(reservaForm.hospedaje, s, reservaForm.numero_huespedes);
                                    const needsColor = servicioRequiereColor(s);
                                    const needsMensaje = servicioTieneMensaje(s);
                                    const selectedData = adminServiciosSeleccionados.find(x => x.servicio === s);
                                    return (
                                      <div key={s}>
                                        <button
                                          type="button"
                                          onClick={() => toggleAdminServicio(s, reservaForm.hospedaje, reservaForm.numero_huespedes)}
                                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-sm font-medium transition-all text-left ${
                                            isSelected
                                              ? "bg-[#8a6038]/10 border-[#8a6038] text-[#3d2010]"
                                              : "bg-white border-gray-200 text-gray-600 hover:border-[#8a6038]/40"
                                          }`}
                                        >
                                          <span>{labelServicio(s)}</span>
                                          <div className="flex items-center gap-2 shrink-0">
                                            {precio > 0 && (
                                              <span className="text-xs font-semibold text-[#8a6038]">
                                                +{formatCOP(precio)}
                                              </span>
                                            )}
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                              isSelected ? "bg-[#8a6038] border-[#8a6038]" : "border-gray-300"
                                            }`}>
                                              {isSelected && (
                                                <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                                                  <path d="M1 2.5L2.5 4L6 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                              )}
                                            </div>
                                          </div>
                                        </button>

                                        {isSelected && needsColor && (
                                          <div className="mt-1 pl-1">
                                            <select
                                              className={`w-full px-3 py-2 border rounded text-[#3d2010] text-sm ${!selectedData?.color ? "border-amber-400" : ""}`}
                                              value={selectedData?.color ?? ""}
                                              onChange={e => setColorAdminServicio(s, e.target.value)}
                                            >
                                              <option value="">Selecciona un color</option>
                                              {COLORES_DECORACION.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))}
                                            </select>
                                            {!selectedData?.color && (
                                              <p className="text-amber-600 text-[10px] mt-0.5 ml-1">Selecciona un color</p>
                                            )}
                                          </div>
                                        )}

                                        {isSelected && needsMensaje && (
                                          <div className="mt-1 pl-1">
                                            <div className="relative">
                                              <input
                                                type="text"
                                                maxLength={25}
                                                placeholder="Ej: ¡Feliz aniversario!"
                                                className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#9db5a0] text-sm pr-14"
                                                value={selectedData?.mensaje ?? ""}
                                                onChange={e => setMensajeAdminServicio(s, e.target.value)}
                                              />
                                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                                {(selectedData?.mensaje ?? "").length}/25
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {adminServiciosSeleccionados.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {adminServiciosSeleccionados.map(x => {
                                      const precio = precioServicio(reservaForm.hospedaje, x.servicio, reservaForm.numero_huespedes);
                                      return (
                                        <div key={x.servicio} className="flex items-center justify-between bg-[#f9f2e8] border border-[#8a6038]/20 rounded px-3 py-2 text-sm">
                                          <span className="text-[#3d2010] font-medium">
                                            ✓ {labelServicio(x.servicio)}
                                            {x.color && <span className="ml-1 font-normal text-[#8a6038]">· {x.color}</span>}
                                          </span>
                                          {precio > 0 && (
                                            <span className="text-[#3d2010] font-semibold shrink-0">+{formatCOP(precio)}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">
                              Valor del alojamiento
                              {tieneTarifa(reservaForm.hospedaje) && reservaForm.check_in && (() => {
                                const g = reservaForm.numero_huespedes;
                                const isDiaSol = reservaForm.hospedaje.toLowerCase().includes("de sol");
                                const calcOut = isDiaSol ? reservaForm.check_in : reservaForm.check_out;
                                const bases = tarifasBase(reservaForm.hospedaje, g);
                                if (!bases) return null;
                                const calc = precioTotal(reservaForm.hospedaje, reservaForm.check_in, calcOut, g);
                                const unit = isDiaSol ? "/día/pers" : "/noche";
                                return (
                                  <>
                                    {calc > 0 && (
                                      <span className="ml-2 text-[10px] font-normal text-[#8a6038] bg-[#f0e4d0] px-1.5 py-0.5 rounded">
                                        Tarifa: {formatCOP(bases.low)}{unit} lun–jue · {formatCOP(bases.high)}{unit} fin sem/festivo
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db5a0] text-sm">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="w-full pl-7 pr-3 py-2 border rounded text-[#3d2010] placeholder:text-[#9db5a0]"
                                placeholder="0"
                                value={displayCOP(reservaForm.valor_alojamiento)}
                                onFocus={e => { if (Number(reservaForm.valor_alojamiento) !== 0) e.target.select(); }}
                                onChange={e => setReservaForm(f => ({ ...f, valor_alojamiento: parseCOP(e.target.value) }))}
                              />
                            </div>
                            <p className="text-[10px] text-amber-600 mt-1">
                              ⚠ Precio en pesos colombianos. Puede modificarse según disponibilidad o condiciones especiales.
                            </p>
                          </div>

                          {adminServiciosSeleccionados.length > 0 && (
                            <div>
                              <label className="block text-sm mb-1 text-[#7a4828]">Valor total servicios adicionales</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db5a0] text-sm">$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="w-full pl-7 pr-3 py-2 border rounded text-[#3d2010] placeholder:text-[#9db5a0]"
                                  placeholder="0"
                                  value={displayCOP(reservaForm.valor_servicio_adicional)}
                                  onFocus={e => { if (Number(reservaForm.valor_servicio_adicional) !== 0) e.target.select(); }}
                                  onChange={e => setReservaForm(f => ({ ...f, valor_servicio_adicional: parseCOP(e.target.value) }))}
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Abono</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db5a0] text-sm">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="w-full pl-7 pr-3 py-2 border rounded text-[#3d2010] placeholder:text-[#9db5a0]"
                                placeholder="0"
                                value={displayCOP(reservaForm.abono)}
                                onFocus={e => { if (Number(reservaForm.abono) !== 0) e.target.select(); }}
                                onChange={e => {
                                  const val = parseCOP(e.target.value);
                                  if (val <= valorAlojamiento + valorServicioAdicional) {
                                    setReservaForm(f => ({ ...f, abono: val }));
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="rounded-md bg-[#f0e4d0] p-4">
                            <label className="block text-sm mb-1 text-[#7a4828]">Total a pagar</label>
                            <p className="text-xl font-semibold text-[#3d2010]">{formatCurrency(totalReserva)}</p>
                            <p className="text-xs text-[#8b5e38] mt-1">Valor alojamiento + servicio adicional − abono</p>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm mb-1 text-[#7a4828]">Estado</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-[#3d2010]"
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
                      <p className="text-sm text-[#7a4828]">
                        El huésped principal ya está registrado. Completa los datos de los acompañantes.
                      </p>
                      {reservaForm.huespedes_adicionales.map((huesped, index) => (
                        <div key={index} className="rounded-md border border-[#d7e1d8] p-4 space-y-3">
                          <p className="font-medium text-[#5a3518]">Huésped {index + 2}</p>
                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Nombre completo</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                              value={huesped.nombre}
                              onChange={e => handleHuespedAdicionalChange(index, "nombre", e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Cédula</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                              value={huesped.cedula}
                              onChange={e => handleHuespedAdicionalChange(index, "cedula", e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Celular *</label>
                            <input
                              type="tel"
                              inputMode="tel"
                              placeholder="300 000 0000"
                              className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                              value={huesped.celular}
                              onChange={e => handleHuespedAdicionalChange(index, "celular", e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1 text-[#7a4828]">Correo electrónico</label>
                            <input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              className="w-full px-3 py-2 border rounded text-[#3d2010] placeholder:text-[#718575]"
                              value={huesped.email}
                              onChange={e => handleHuespedAdicionalChange(index, "email", e.target.value)}
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
                    <div className="mt-4 text-amber-700 text-sm text-center">{successMessage}</div>
                  )}
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Botón flotante superior */}
      <button
        onClick={() => window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" })}
        className="fixed right-4 top-24 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-md text-[#7a4828] hover:bg-primary/10 hover:border-primary transition-colors"
        title="Subir"
      >
        <ChevronUp size={18} />
      </button>

      {/* Botón flotante inferior */}
      <button
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
        className="fixed right-4 bottom-6 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-md text-[#7a4828] hover:bg-primary/10 hover:border-primary transition-colors"
        title="Bajar"
      >
        <ChevronDown size={18} />
      </button>

      {/* Toast flotante de confirmación */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-[#3d2010] text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} className="text-amber-300" />
          {toastMsg}
        </div>
      )}

      {/* Modal de enlace generado para el huésped */}
      {showEnlaceModal && enlaceGenerado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseEnlaceModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Ícono y título */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-[#f0e4d0] rounded-full flex items-center justify-center mb-3">
                <Link size={22} className="text-[#5a3518]" />
              </div>
              <h3
                className="text-lg font-semibold text-[#3d2010]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Reserva creada
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Comparte este enlace con el huésped para que complete sus datos.
              </p>
            </div>

            {/* Enlace */}
            <div className="bg-[#f7ede0] border border-[#c8aa82] rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-[#7a4828]">Enlace para el huésped:</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={enlaceGenerado}
                  onClick={e => (e.target as HTMLInputElement).select()}
                  className="flex-1 text-xs px-3 py-2 border border-[#c8aa82] rounded-lg bg-white text-[#3d2010] font-mono focus:outline-none focus:border-[#5a3518]"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(enlaceGenerado);
                    setEnlaceCopiado(true);
                    setTimeout(() => setEnlaceCopiado(false), 2500);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    enlaceCopiado
                      ? "bg-amber-500 text-white"
                      : "bg-[#5a3518] text-white hover:bg-[#3d2010]"
                  }`}
                >
                  {enlaceCopiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                El enlace solo puede completarse una vez. Queda bloqueado tras el envío.
              </p>
            </div>

            <button
              onClick={handleCloseEnlaceModal}
              className="mt-5 w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
