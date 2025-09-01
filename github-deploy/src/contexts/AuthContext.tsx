import React, { createContext, useContext, ReactNode } from 'react';

// Interfaccia semplificata per utente sempre autenticato
interface SimpleUser {
  id: string;
  email: string;
  nome: string;
}

interface AuthContextType {
  user: SimpleUser;
  isAuthenticated: true; // Sempre true
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Provider semplificato - utente sempre autenticato
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const user: SimpleUser = {
    id: 'admin-user',
    email: 'admin@gestionale.com',
    nome: 'Admin Gestionale'
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: true
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};