import { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  token: string;
} | null;

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error || 'Error al iniciar sesión' };
      }

      setUser({
        id: data.user.id,
        name: `${data.user.nombre} ${data.user.apellido1}`,
        email: data.user.correo,
        role: data.user.rol === 'admin' ? 'admin' : 'student',
        token: data.token,
      });

      return { ok: true };

    } catch (error) {
      return { ok: false, error: 'No se pudo conectar con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
