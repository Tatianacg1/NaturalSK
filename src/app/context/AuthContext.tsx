// Contexto de autenticación integrado con backend.
// Gestiona la sesión del usuario y comunicación con APIs.
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, nuevaContraseña: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función auxiliar para llamadas a la API.
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    // Si la cuenta fue deshabilitada, limpiar sesión y recargar
    if (response.status === 403 && error.error === "Cuenta deshabilitada") {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    throw new Error(error.error || "Error en la solicitud");
  }

  return response.json();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay sesión válida al cargar la app.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const currentUser = await fetchAPI("/auth/me");
          setUser({
            id: currentUser.id,
            name: currentUser.nombre,
            email: currentUser.email,
            role: currentUser.rol === "admin" ? "admin" : "user",
          });
        }
      } catch (error) {
        console.log("No hay sesión válida");
        localStorage.removeItem("authToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login con el backend real.
  const login = async (email: string, password: string) => {
    try {
      const response = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, contraseña: password }),
      });

      localStorage.setItem("authToken", response.token);
      setUser({
        id: response.usuario.id,
        name: response.usuario.name,
        email: response.usuario.email,
        role: response.usuario.role,
      });
    } catch (error) {
      throw new Error("Usuario o contraseña incorrectos");
    }
  };

  // Registro con el backend real.
  const register = async (name: string, email: string, password: string) => {
    try {
      await fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: name,
          email,
          contraseña: password,
        }),
      });

      // Hacer login automático después del registro.
      await login(email, password);
    } catch (error) {
      throw new Error("Error al registrarse");
    }
  };

  // Logout limpiando autenticación.
  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await fetchAPI("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (token: string, nuevaContraseña: string) => {
    await fetchAPI("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, nuevaContraseña }),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
}
