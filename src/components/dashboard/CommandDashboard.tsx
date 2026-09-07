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

function RoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === 'commander' ? '/commander' : '/officer'} replace />;
}

export const CommandDashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <Routes>
      <Route element={<DashboardLayout />}>
        {/* Default route redirects based on active role */}
        <Route index element={<RoleRedirect />} />

        {/* Welfare Officer routes */}
        <Route path="officer" element={<OfficerOverview />} />
        <Route path="officer/analytics" element={<RiskAnalytics />} />
        <Route path="officer/personnel" element={<PersonnelList />} />
        <Route path="officer/personnel/:id" element={<PersonnelDetail />} />
        <Route path="officer/alerts" element={<OfficerAlerts />} />

        {/* Commander routes */}
        <Route path="commander" element={<CommanderOverview />} />
        <Route path="commander/units" element={<UnitAnalytics />} />
        <Route path="commander/alerts" element={<CommanderAlerts />} />

        {/* Shared routes */}
        <Route path="alerts" element={<AlertCenter />} />

        {/* Fallback */}
        <Route path="*" element={<RoleRedirect />} />
      </Route>
    </Routes>
    </ThemeProvider>
  );
};
