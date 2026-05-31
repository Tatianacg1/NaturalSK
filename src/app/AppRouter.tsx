// Enrutador principal de la aplicación.
// Decide si el usuario ve la página pública, la pantalla de login o el dashboard administrativo.
import { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CompletarReserva } from "./pages/CompletarReserva";
import App from "./App";

// Componente que administra la lógica de ruta basada en autenticación.
// Muestra la aplicación principal, la página de login o el dashboard según el estado.
function AppRouterContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Detecta la ruta pública de completar reserva.
  const tokenReserva = window.location.pathname.match(/^\/reservar\/([^/]+)$/)?.[1] ?? null;

  // Comprueba si debe mostrar la página de login.
  useEffect(() => {
    // Si la URL indica acceso a /admin y no hay sesión, mostrar login.
    const path = window.location.pathname;
    if (path.includes("/admin") && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  // Ruta pública de completar reserva — no requiere autenticación.
  if (tokenReserva) {
    return <CompletarReserva token={tokenReserva} />;
  }

  // Maneja el clic en el botón de iniciar sesión desde la app principal.
  const handleShowLogin = () => {
    setShowLogin(true);
  };

  // Navega al dashboard después de iniciar sesión correctamente.
  const handleLoginSuccess = () => {
    setShowLogin(false);
    // Redirige al dashboard administrativo
    window.history.pushState({}, "", "/admin");
  };

  // Cierra la sesión y regresa a la página pública.
  const handleLogout = () => {
    setShowLogin(true);
    window.history.pushState({}, "", "/");
  };

  // Si intenta acceder al admin sin autenticarse, mostrar login.
  if (showLogin && !isAuthenticated) {
    return <LoginPage onSwitchToApp={handleLoginSuccess} />;
  }

  // Si está autenticado, mostrar dashboard de admin.
  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Por defecto, mostrar la app pública con el botón de login.
  return <App onLoginClick={handleShowLogin} />;
}

export function AppRouter() {
  return (
    <AuthProvider>
      <AppRouterContent />
    </AuthProvider>
  );
}
