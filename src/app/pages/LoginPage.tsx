// Página de login y registro de usuarios.
// Incluye formularios para iniciar sesión o crear cuenta, y alterna entre ambos modos.
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";

interface LoginPageProps {
  onSwitchToApp: () => void;
}

export function LoginPage({ onSwitchToApp }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();

  // Envía el formulario de inicio de sesión o registro.
  // Valida los campos y usa el contexto de autenticación.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError("Por favor completa todos los campos");
          setIsLoading(false);
          return;
        }
        await login(email, password);
      } else {
        if (!fullName || !email || !password) {
          setError("Por favor completa todos los campos");
          setIsLoading(false);
          return;
        }
        await register(fullName, email, password);
      }
      onSwitchToApp();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a0e] via-[#1a2817] to-[#0f1a0e] flex items-center justify-center p-3 sm:p-4 relative">
      {/* Botón de volver atrás */}
      <button
        onClick={onSwitchToApp}
        className="absolute top-6 left-6 text-foreground hover:text-primary transition-colors z-10"
        title="Volver a la página principal"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-green-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Sección del logo y subtítulo - clickeable */}
        <button
          onClick={onSwitchToApp}
          className="w-full text-center mb-12 hover:opacity-80 transition-opacity cursor-pointer bg-none border-none p-0"
          title="Volver a la página principal"
        >
          <img
            src="/images/sk.png"
            alt="Natural Sound"
            className="h-20 sm:h-24 md:h-32 w-auto object-contain mx-auto mb-4 sm:mb-6"
          />
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Glamping & Hotel Boutique
          </p>
        </button>

        {/* Tarjeta de formulario */}
        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm bg-card/80">
          {/* Encabezado del formulario */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <h1
              className="text-2xl sm:text-3xl font-semibold text-foreground mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {isLogin ? "Bienvenido" : "Crear Cuenta"}
            </h1>
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLogin
                ? "Accede a tu panel de Natural Sound"
                : "Únete a nuestra comunidad exclusiva"}
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mx-8 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p
                className="text-red-500 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Formulario de login/registro */}
          <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-8 space-y-4 sm:space-y-5">
            {/* Nombre completo (solo registro) */}
            {!isLogin && (
              <div>
                <label
                  className="block text-sm text-foreground mb-2 font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            )}

            {/* Correo electrónico */}
            <div>
              <label
                className="block text-sm text-foreground mb-2 font-medium"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              {isLogin && (
                <p
                  className="text-xs text-muted-foreground mt-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Demo: admin@naturalsound.com (para acceso de admin)
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label
                className="block text-sm text-foreground mb-2 font-medium"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors pr-10"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLoading
                ? "Cargando..."
                : isLogin
                  ? "Iniciar Sesión"
                  : "Crear Cuenta"}
            </button>
          </form>

          {/* Separador visual */}
          <div className="px-5 sm:px-8 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              o
            </span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Botón para cambiar entre login y registro */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <button
              type="button"
              onClick={toggleMode}
              className="w-full border border-border py-3 rounded text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia Sesión"}
            </button>
          </div>

          {/* Enlace de pie de página */}
          {isLogin && (
            <div className="px-5 sm:px-8 pb-5 sm:pb-6 text-center">
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>

        {/* Información final del pie de página */}
        <div className="mt-8 text-center">
          <p
            className="text-muted-foreground text-xs"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            © 2026 Natural Sound. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
