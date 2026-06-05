import { createContext, useContext, useState, ReactNode } from 'react';
import { API_URL } from '../lib/api';

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  token: string;
  foto?: string | null;
  primerLogin: boolean;
} | null;

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  completarPrimerLogin: () => void;
}

const AUTH_KEY = 'app_policia_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Leer usuario guardado al arrancar la app
function loadUserFromStorage(): User {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(loadUserFromStorage);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error || 'Error al iniciar sesión' };
      }

      const loggedUser: User = {
        id: data.user.id,
        name: `${data.user.nombre} ${data.user.apellido1}`,
        email: data.user.correo,
        role: (data.user.rol === 'admin' || data.user.rol === 'profesor') ? 'admin' : 'student',
        token: data.token,
        foto: data.user.foto || null,
        primerLogin: data.user.primer_login ?? false,
      };

      // Guardar en localStorage para persistir entre recargas
      localStorage.setItem(AUTH_KEY, JSON.stringify(loggedUser));
      setUser(loggedUser);

      return { ok: true };

    } catch (error) {
      return { ok: false, error: 'No se pudo conectar con el servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const completarPrimerLogin = () => {
    if (!user) return;
    const updated = { ...user, primerLogin: false };
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completarPrimerLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};