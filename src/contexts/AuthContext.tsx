import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { storage } from '../utils/storage';

interface AuthContextType extends AuthState {
  login: (username: string, password: string, type: 'admin' | 'conductor') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setAuthState({
        user: currentUser,
        isAuthenticated: true
      });
    }
  }, []);

  const login = async (username: string, password: string, type: 'admin' | 'conductor'): Promise<boolean> => {
    if (type === 'admin') {
      if (username === 'Petroboscan' && password === 'Petroboscan2025') {
        const rootUser: User = {
          id: 'root',
          name: 'Administrador Root',
          cedula: '00000000',
          role: 'root',
          createdAt: new Date().toISOString()
        };
        
        setAuthState({
          user: rootUser,
          isAuthenticated: true
        });
        storage.setCurrentUser(rootUser);
        return true;
      }
      
      const users = storage.getUsers();
      const user = users.find(u => u.role === 'admin' && u.cedula === username);
      if (user) {
        setAuthState({
          user,
          isAuthenticated: true
        });
        storage.setCurrentUser(user);
        return true;
      }
    } else {
      const credentials = await storage.getConductorCredentials();
      const credential = credentials.find(c => c.username === username && c.password === password && c.isActive);
      
      if (credential) {
        const conductors = await storage.getConductors();
        const conductor = conductors.find(c => c.id === credential.conductorId);
        
        if (conductor) {
          const conductorUser: User = {
            id: conductor.id,
            name: conductor.name,
            cedula: conductor.cedula,
            role: 'conductor',
            createdAt: conductor.createdAt
          };
          
          setAuthState({
            user: conductorUser,
            isAuthenticated: true
          });
          storage.setCurrentUser(conductorUser);
          return true;
        }
      }
    }
    
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false
    });
    storage.setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};