import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

interface ResetPasswordPageProps {
  token: string;
  onGoToLogin: () => void;
}

export function ResetPasswordPage({ token, onGoToLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "El enlace no es válido o ha expirado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a0e] via-[#1a2817] to-[#0f1a0e] flex items-center justify-center p-3 sm:p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="w-full text-center mb-12">
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
        </div>

        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm bg-card/80">
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <h1
              className="text-2xl sm:text-3xl font-semibold text-foreground mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {success ? "¡Listo!" : "Nueva Contraseña"}
            </h1>
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {success
                ? "Tu contraseña fue restablecida correctamente"
                : "Elige una nueva contraseña para tu cuenta"}
            </p>
          </div>

          {error && (
            <div className="mx-5 sm:mx-8 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-red-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            </div>
          )}

          {success ? (
            <div className="px-5 sm:px-8 py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle size={48} className="text-green-500" />
                <p
                  className="text-foreground text-sm text-center"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <button
                onClick={onGoToLogin}
                className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-8 space-y-4 sm:space-y-5">
              <div>
                <label
                  className="block text-sm text-foreground mb-2 font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Nueva Contraseña
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

              <div>
                <label
                  className="block text-sm text-foreground mb-2 font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors pr-10"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? "Guardando..." : "Restablecer Contraseña"}
              </button>
            </form>
          )}

          {!success && (
            <div className="px-5 sm:px-8 pb-5 sm:pb-6 text-center">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-xs text-primary hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Volver a iniciar sesión
              </button>
            </div>
          )}
        </div>

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
