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
  role: string;
  switchRole: (newRole: string) => void;
  activePortal: 'personnel' | 'command';
  setActivePortal: (portal: 'personnel' | 'command') => void;
  user: { name: string; role: string };
  isOfficer: boolean;
  isCommander: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profile, setProfile] = useState<PersonnelProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string>('welfare_officer');
  const [activePortal, setActivePortal] = useState<'personnel' | 'command'>('personnel');

  const [user, setUser] = useState({
    name: 'Lt. Col. Sharma',
    role: 'welfare_officer',
  });

  const switchRole = (newRole: string) => {
    setRole(newRole);
    setUser(prev => ({
      ...prev,
      role: newRole,
      name: newRole === 'commander' ? 'Brig. Kapoor' : 'Lt. Col. Sharma',
    }));
  };

  useEffect(() => {
    // Check existing session
    if (api.isAuthenticated()) {
      setIsAuthenticated(true);
      api.getProfile()
        .then(p => {
          setProfile(p);
          if (p.role === 'commander') {
            setRole('commander');
            setUser({ name: p.name || 'Brig. Kapoor', role: 'commander' });
          } else if (p.role === 'medical_officer' || p.role === 'officer') {
            setRole('welfare_officer');
            setUser({ name: p.name || 'Lt. Col. Sharma', role: 'welfare_officer' });
          }
        })
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

      const pid = personnelId.toLowerCase().trim();
      if (pid === 'commander' || res.profile.role === 'commander') {
        setRole('commander');
        setUser({ name: 'Brig. Kapoor', role: 'commander' });
        setActivePortal('command');
      } else if (pid === 'medical' || pid.includes('officer') || res.profile.role === 'medical_officer') {
        setRole('welfare_officer');
        setUser({ name: 'Lt. Col. Sharma', role: 'welfare_officer' });
        setActivePortal('command');
      } else {
        setRole('personnel');
        setActivePortal('personnel');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
    setProfile(null);
    setActivePortal('personnel');
  };

  const isOfficer = role === 'welfare_officer';
  const isCommander = role === 'commander';

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      profile,
      login,
      logout,
      isLoading,
      role,
      switchRole,
      activePortal,
      setActivePortal,
      user,
      isOfficer,
      isCommander
    }}>
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
