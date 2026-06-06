import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

interface LoginPageProps {
  onSwitchToApp: () => void;
}

type Mode = "login" | "forgot";

export function LoginPage({ onSwitchToApp }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, forgotPassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      onSwitchToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Si el correo está registrado, recibirás las instrucciones en breve. Revisa tu bandeja de entrada.");
    } catch {
      setError("Error al procesar la solicitud. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToForgot = () => {
    setMode("forgot");
    setError("");
    setSuccess("");
    setPassword("");
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
    setSuccess("");
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
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
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

        {/* Tarjeta */}
        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm bg-card/80">
          {/* Encabezado */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <h1
              className="text-2xl sm:text-3xl font-semibold text-foreground mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {mode === "login" ? "Bienvenido" : "Recuperar Contraseña"}
            </h1>
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {mode === "login"
                ? "Accede a tu panel de Natural Sound"
                : "Ingresa tu correo y te enviaremos las instrucciones"}
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mx-5 sm:mx-8 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-red-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            </div>
          )}

          {/* Mensaje de éxito (olvidar contraseña) */}
          {success && (
            <div className="mx-5 sm:mx-8 mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded flex items-start gap-3">
              <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
              <p className="text-green-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {success}
              </p>
            </div>
          )}

          {/* Formulario login */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="px-5 sm:px-8 py-5 sm:py-8 space-y-4 sm:space-y-5">
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
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? "Cargando..." : "Iniciar Sesión"}
              </button>
            </form>
          )}

          {/* Formulario olvidar contraseña */}
          {mode === "forgot" && !success && (
            <form onSubmit={handleForgotPassword} className="px-5 sm:px-8 py-5 sm:py-8 space-y-4 sm:space-y-5">
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? "Enviando..." : "Enviar Instrucciones"}
              </button>
            </form>
          )}

          {/* Espacio inferior cuando hay mensaje de éxito en forgot */}
          {mode === "forgot" && success && (
            <div className="px-5 sm:px-8 pb-6" />
          )}

          {/* Enlace inferior */}
          <div className="px-5 sm:px-8 pb-5 sm:pb-6 text-center">
            {mode === "login" ? (
              <button
                type="button"
                onClick={switchToForgot}
                className="text-xs text-primary hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            ) : (
              <button
                type="button"
                onClick={switchToLogin}
                className="text-xs text-primary hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>

        {/* Pie de página */}
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
