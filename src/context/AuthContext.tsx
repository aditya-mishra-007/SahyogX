import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PersonnelProfile } from '../services/types';
import { api } from '../services/api';
import { MOCK_PERSONNEL_PROFILE } from '../services/mockData';

interface AuthContextType {
  isAuthenticated: boolean;
  profile: PersonnelProfile | null;
  login: (personnelId: string, password?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profile, setProfile] = useState<PersonnelProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check existing session
    if (api.isAuthenticated()) {
      setIsAuthenticated(true);
      api.getProfile()
        .then(p => setProfile(p))
        .catch(() => {
          setProfile(MOCK_PERSONNEL_PROFILE);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (personnelId: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(personnelId, password);
      setIsAuthenticated(true);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, profile, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
