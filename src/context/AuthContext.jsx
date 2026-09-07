/* ============================================
   Auth Context
   ============================================
   Manages the current user role for role-based
   routing and component visibility.
   
   When backend auth is implemented, this context
   should receive the role from the auth API
   instead of the manual role switcher.
   ============================================ */

import { createContext, useContext, useState, useCallback } from 'react';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(ROLES.WELFARE_OFFICER);
  const [user, setUser] = useState({
    name: 'Lt. Col. Sharma',
    role: ROLES.WELFARE_OFFICER,
  });

  const switchRole = useCallback((newRole) => {
    setRole(newRole);
    setUser(prev => ({
      ...prev,
      role: newRole,
      name: newRole === ROLES.COMMANDER ? 'Brig. Kapoor' : 'Lt. Col. Sharma',
    }));
  }, []);

  const isOfficer = role === ROLES.WELFARE_OFFICER;
  const isCommander = role === ROLES.COMMANDER;

  return (
    <AuthContext.Provider value={{ role, user, switchRole, isOfficer, isCommander }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
