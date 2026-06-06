// Enrutador principal de la aplicación.
// Decide si el usuario ve la página pública, la pantalla de login o el dashboard administrativo.
import { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CompletarReserva } from "./pages/CompletarReserva";
import { ReservaPage } from "./pages/ReservaPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import App from "./App";

// Componente que administra la lógica de ruta basada en autenticación.
// Muestra la aplicación principal, la página de login o el dashboard según el estado.
function AppRouterContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const path = window.location.pathname;

  // Detecta la ruta pública de completar reserva.
  const tokenReserva = path.match(/^\/reservar\/([^/]+)$/)?.[1] ?? null;

  // Detecta la ruta de restablecimiento de contraseña con su token.
  const resetToken = path === "/reset-password"
    ? new URLSearchParams(window.location.search).get("token")
    : null;

  // Comprueba si debe mostrar la página de login.
  useEffect(() => {
    if (path.includes("/admin") && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated, path]);

  // Ruta de restablecimiento de contraseña
  if (resetToken) {
    const handleGoToLogin = () => {
      window.history.pushState({}, "", "/admin");
      setShowLogin(true);
    };
    return <ResetPasswordPage token={resetToken} onGoToLogin={handleGoToLogin} />;
  }

  // Página pública de nueva reserva
  if (path === "/reservar") {
    return <ReservaPage />;
  }

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

  // Si está autenticado Y está en la ruta /admin, mostrar dashboard de admin.
  if (isAuthenticated && window.location.pathname.includes("/admin")) {
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
