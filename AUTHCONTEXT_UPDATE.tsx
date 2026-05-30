// ACTUALIZACIÓN RECOMENDADA: src/app/context/AuthContext.tsx
// Para usar el backend real en lugar de datos mock

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api.js";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar si hay token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const currentUser = await authAPI.me();
          setUser({
            id: currentUser.id,
            name: currentUser.nombre,
            email: currentUser.email,
            role: currentUser.rol,
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

  // Login usando el backend
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, contraseña: password });
      
      // Guardar token
      localStorage.setItem("authToken", response.token);
      
      // Actualizar usuario
      setUser({
        id: response.usuario.id,
        name: response.usuario.name,
        email: response.usuario.email,
        role: response.usuario.role,
      });
    } catch (error) {
      throw new Error("Error al iniciar sesión");
    }
  };

  // Register usando el backend
  const register = async (name: string, email: string, password: string) => {
    try {
      await authAPI.register({
        nombre: name,
        email,
        contraseña: password,
      });
      
      // Después de registrarse, hacer login automático
      await login(email, password);
    } catch (error) {
      throw new Error("Error al registrarse");
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
}
