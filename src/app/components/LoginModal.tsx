import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!fullName.trim()) { setError("Ingresa tu nombre completo"); setIsLoading(false); return; }
        await register(fullName, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Capa de oscurecimiento del fondo */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenedor del modal */}
      <div className="relative bg-card border border-border rounded-lg w-full max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Botón para cerrar el modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-5 sm:p-8">
          {/* Encabezado del modal */}
          <div className="mb-8">
            <h2
              className="text-2xl sm:text-3xl font-semibold text-foreground mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLogin
                ? "Accede a tu cuenta de Natural Sound"
                : "Únete a nuestra comunidad"}
            </p>
          </div>

          {/* Error de autenticación */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-red-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
            </div>
          )}

          {/* Formulario dentro del modal */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre completo - solo en modo registro */}
            {!isLogin && (
              <div>
                <label
                  className="block text-sm text-foreground mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            )}

            {/* Correo electrónico */}
            <div>
              <label
                className="block text-sm text-foreground mb-2"
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
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label
                className="block text-sm text-foreground mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                required
              />
            </div>

            {/* Recuerdame - solo en login */}
            {isLogin && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border border-border cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Recuérdame
                </label>
              </div>
            )}

            {/* Botón de envío del formulario */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLoading ? "Cargando..." : isLogin ? "Inicia Sesión" : "Crear Cuenta"}
            </button>
          </form>

          {/* Separador entre opciones */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              O
            </span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Opción alternativa de cambio de modo */}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
              setFullName("");
              setError("");
            }}
            className="w-full border border-border py-3 rounded text-foreground hover:border-primary hover:text-primary transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia Sesión"}
          </button>

          {/* Olvidé la contraseña - solo en login */}
          {isLogin && (
            <div className="text-center mt-4">
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
      </div>
    </div>
  );
}
