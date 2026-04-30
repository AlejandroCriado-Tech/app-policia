import { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
  name: string;
  email: string;
  role: 'student' | 'admin';
} | null;

interface AuthContextType {
  user: User;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializamos en null para forzar el paso por el login
  const [user, setUser] = useState<User>(null);

  const login = (email: string) => {
    // Simulamos la lógica de roles: si el email contiene 'profe' o 'admin', es profesor (admin)
    const isAdmin = email.toLowerCase().includes('profe') || email.toLowerCase().includes('admin');
    
    setUser({
      name: isAdmin ? 'Profesor/a Cáceres' : 'Alejandro G.',
      email,
      role: isAdmin ? 'admin' : 'student'
    });
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
