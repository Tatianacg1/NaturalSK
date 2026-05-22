import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string) => {
    // Simulación de login - En producción, esto sería una llamada a API
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: "1",
          email,
          name: email.split("@")[0],
          role: email === "admin@naturalsound.com" ? "admin" : "user",
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        resolve();
      }, 800);
    });
  };

  const register = async (name: string, email: string, password: string) => {
    // Simulación de registro
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: Math.random().toString(),
          email,
          name,
          role: "user",
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        resolve();
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register }}>
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
