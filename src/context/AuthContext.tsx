import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PersonnelProfile } from '../services/types';
import { api } from '../services/api';

// Backend role constants — must match what /api/v1/auth/me returns
export type BackendRole = 'COMMANDER' | 'MEDICAL_OFFICER' | 'PERSONNEL';

interface AuthContextType {
  isAuthenticated: boolean;
  profile: PersonnelProfile | null;
  login: (personnelId: string, password?: string, requestedRole?: BackendRole) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    role: BackendRole;
    fullName?: string;
    rank?: string;
    unit?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  // Actual backend-authorised role — set once on login, not switchable
  role: BackendRole;
  // Which portal is active — derived from role, not user-switchable
  activePortal: 'personnel' | 'command';
  // Display user info for the Command Dashboard Header
  user: { name: string; role: string };
  isOfficer: boolean;
  isCommander: boolean;
  isPersonnel: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps backend role string (COMMANDER, MEDICAL_OFFICER, PERSONNEL) to
 * the portal and UI role values. This is the SINGLE authoritative mapping.
 */
function resolvePortalFromRole(role: BackendRole): 'personnel' | 'command' {
  if (role === 'COMMANDER' || role === 'MEDICAL_OFFICER') {
    return 'command';
  }
  return 'personnel';
}

function resolveDisplayUser(role: BackendRole, name?: string | null): { name: string; role: string } {
  if (role === 'COMMANDER') {
    return { name: name || 'Commanding Officer', role: 'commander' };
  } else if (role === 'MEDICAL_OFFICER') {
    return { name: name || 'Welfare Officer', role: 'welfare_officer' };
  }
  return { name: name || 'Personnel', role: 'personnel' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());
  const [profile, setProfile] = useState<PersonnelProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('sahyogx_session_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [role, setRole] = useState<BackendRole>(() => {
    try {
      const saved = sessionStorage.getItem('sahyogx_session_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return resolveBackendRole(p.role);
      }
    } catch {}
    return 'PERSONNEL';
  });
  const [activePortal, setActivePortalState] = useState<'personnel' | 'command'>(() => {
    try {
      const saved = sessionStorage.getItem('sahyogx_session_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return resolvePortalFromRole(resolveBackendRole(p.role));
      }
    } catch {}
    return 'personnel';
  });
  const [user, setUser] = useState<{ name: string; role: string }>(() => {
    try {
      const saved = sessionStorage.getItem('sahyogx_session_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return resolveDisplayUser(resolveBackendRole(p.role), p.name);
      }
    } catch {}
    return { name: '', role: 'personnel' };
  });

  // Non-blocking background verification
  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getProfile()
        .then(p => {
          if (p) {
            setProfile(p);
            const backendRole = resolveBackendRole(p.role);
            setRole(backendRole);
            setActivePortalState(resolvePortalFromRole(backendRole));
            setUser(resolveDisplayUser(backendRole, p.name));
            try {
              sessionStorage.setItem('sahyogx_session_profile', JSON.stringify(p));
            } catch {}
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, []);

  const login = async (personnelId: string, password?: string, requestedRole?: BackendRole) => {
    setIsLoading(true);
    try {
      const res = await api.login(personnelId, password, requestedRole);
      setIsAuthenticated(true);
      setProfile(res.profile);

      // Save to session cache for instant subsequent loads
      try {
        sessionStorage.setItem('sahyogx_session_profile', JSON.stringify(res.profile));
      } catch {}

      const backendRole = resolveBackendRole(res.profile.role);
      setRole(backendRole);
      setActivePortalState(resolvePortalFromRole(backendRole));
      setUser(resolveDisplayUser(backendRole, res.profile.name));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    role: BackendRole;
    fullName?: string;
    rank?: string;
    unit?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setIsAuthenticated(true);
      setProfile(res.profile);

      try {
        sessionStorage.setItem('sahyogx_session_profile', JSON.stringify(res.profile));
      } catch {}

      const backendRole = resolveBackendRole(res.profile.role);
      setRole(backendRole);
      setActivePortalState(resolvePortalFromRole(backendRole));
      setUser(resolveDisplayUser(backendRole, res.profile.name));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    try {
      sessionStorage.removeItem('sahyogx_session_profile');
    } catch {}
    setIsAuthenticated(false);
    setProfile(null);
    setRole('PERSONNEL');
    setActivePortalState('personnel');
    setUser({ name: '', role: 'personnel' });
  };

  // NOTE: setActivePortal is NOT exposed — portal switching is role-derived only.
  // Removed: switchRole() — UI role-switching violates RBAC.

  const isOfficer = role === 'MEDICAL_OFFICER';
  const isCommander = role === 'COMMANDER';
  const isPersonnel = role === 'PERSONNEL';

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      profile,
      login,
      register,
      logout,
      isLoading,
      role,
      activePortal,
      user,
      isOfficer,
      isCommander,
      isPersonnel
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Maps the frontend role string (returned by api.ts from the backend) to BackendRole enum.
 * Handles both uppercase and lowercase variants for robustness.
 */
function resolveBackendRole(rawRole: string | undefined | null): BackendRole {
  if (!rawRole) return 'PERSONNEL';
  const upper = rawRole.toUpperCase();
  if (upper === 'COMMANDER') return 'COMMANDER';
  if (upper === 'MEDICAL_OFFICER') return 'MEDICAL_OFFICER';
  return 'PERSONNEL';
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
