import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// @ts-expect-error - JSX Context component
import { ThemeProvider } from '../../context/ThemeContext';
// @ts-expect-error - JSX Layout component
import DashboardLayout from '../../layouts/DashboardLayout';

// Officer Pages
// @ts-expect-error - JSX Page component
import OfficerOverview from '../../pages/officer/OfficerOverview';
// @ts-expect-error - JSX Page component
import RiskAnalytics from '../../pages/officer/RiskAnalytics';
// @ts-expect-error - JSX Page component
import PersonnelList from '../../pages/officer/PersonnelList';
// @ts-expect-error - JSX Page component
import PersonnelDetail from '../../pages/officer/PersonnelDetail';
// @ts-expect-error - JSX Page component
import OfficerAlerts from '../../pages/officer/OfficerAlerts';

// Commander Pages
// @ts-expect-error - JSX Page component
import CommanderOverview from '../../pages/commander/CommanderOverview';
// @ts-expect-error - JSX Page component
import UnitAnalytics from '../../pages/commander/UnitAnalytics';
// @ts-expect-error - JSX Page component
import CommanderAlerts from '../../pages/commander/CommanderAlerts';

// Shared Pages
// @ts-expect-error - JSX Page component
import AlertCenter from '../../pages/shared/AlertCenter';

/**
 * Role-based default redirect — sends user to their authorized section only.
 * COMMANDER → /commander
 * MEDICAL_OFFICER → /officer
 * PERSONNEL → should never reach here (blocked in App.tsx by activePortal check)
 */
function RoleRedirect() {
  const { isCommander, isOfficer } = useAuth();
  if (isCommander) return <Navigate to="/commander" replace />;
  if (isOfficer) return <Navigate to="/officer" replace />;
  // Fallback: unauthorized — should not happen if App.tsx routing is correct
  return <UnauthorizedAccess />;
}

/**
 * Shown when a user attempts to access a route their role does not permit.
 */
function UnauthorizedAccess() {
  const { logout, role } = useAuth();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#e2e8f0',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem' }}>🔒</div>
      <h1 style={{ color: '#f87171', fontSize: '1.5rem', fontWeight: 700 }}>Unauthorized Access</h1>
      <p style={{ color: '#94a3b8', maxWidth: '420px', lineHeight: 1.6 }}>
        Your account role (<strong style={{ color: '#60a5fa' }}>{role}</strong>) does not have permission
        to access this section. This access attempt has been logged.
      </p>
      <button
        onClick={logout}
        style={{
          padding: '10px 24px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

/**
 * Guard that restricts a route to a specific role.
 * If the current user's role does not match, shows UnauthorizedAccess.
 */
function RoleGuard({ allowedRole, children }: { allowedRole: 'COMMANDER' | 'MEDICAL_OFFICER'; children: React.ReactNode }) {
  const { role } = useAuth();
  if (role !== allowedRole) {
    return <UnauthorizedAccess />;
  }
  return <>{children}</>;
}

export const CommandDashboard: React.FC = () => {
  const { role } = useAuth();

  // Double-check: PERSONNEL should never reach here (App.tsx blocks it via activePortal).
  // If somehow they do, show unauthorized immediately.
  if (role === 'PERSONNEL') {
    return <UnauthorizedAccess />;
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          {/* Default route: redirect to role-appropriate section */}
          <Route index element={<RoleRedirect />} />

          {/* Welfare Officer (MEDICAL_OFFICER) routes — blocked for COMMANDER */}
          <Route
            path="officer"
            element={
              <RoleGuard allowedRole="MEDICAL_OFFICER">
                <OfficerOverview />
              </RoleGuard>
            }
          />
          <Route
            path="officer/analytics"
            element={
              <RoleGuard allowedRole="MEDICAL_OFFICER">
                <RiskAnalytics />
              </RoleGuard>
            }
          />
          <Route
            path="officer/personnel"
            element={
              <RoleGuard allowedRole="MEDICAL_OFFICER">
                <PersonnelList />
              </RoleGuard>
            }
          />
          <Route
            path="officer/personnel/:id"
            element={
              <RoleGuard allowedRole="MEDICAL_OFFICER">
                <PersonnelDetail />
              </RoleGuard>
            }
          />
          <Route
            path="officer/alerts"
            element={
              <RoleGuard allowedRole="MEDICAL_OFFICER">
                <OfficerAlerts />
              </RoleGuard>
            }
          />

          {/* Commander routes — blocked for MEDICAL_OFFICER */}
          <Route
            path="commander"
            element={
              <RoleGuard allowedRole="COMMANDER">
                <CommanderOverview />
              </RoleGuard>
            }
          />
          <Route
            path="commander/units"
            element={
              <RoleGuard allowedRole="COMMANDER">
                <UnitAnalytics />
              </RoleGuard>
            }
          />
          <Route
            path="commander/alerts"
            element={
              <RoleGuard allowedRole="COMMANDER">
                <CommanderAlerts />
              </RoleGuard>
            }
          />

          {/* Shared routes — accessible to both COMMANDER and MEDICAL_OFFICER */}
          <Route path="alerts" element={<AlertCenter />} />

          {/* Fallback: redirect to role-appropriate section */}
          <Route path="*" element={<RoleRedirect />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
};
