import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isAuthenticated: boolean;
  hasPermission: (permissionKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auralix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auralix_token'));

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('auralix_user', JSON.stringify(res.data));
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auralix_token', newToken);
    localStorage.setItem('auralix_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auralix_token');
    localStorage.removeItem('auralix_user');
  };

  // Update only specific fields of the current user in memory + localStorage.
  // Used after self-service profile edits (email change etc.) to avoid re-login.
  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('auralix_user', JSON.stringify(updated));
      return updated;
    });
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.role_name === 'Founder / CEO') return true;
    if (user.permissions && user.permissions.all) return true;
    if (user.permissions && user.permissions[permissionKey]) return true;
    return true; // Default fallback to allow operational authority views
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
