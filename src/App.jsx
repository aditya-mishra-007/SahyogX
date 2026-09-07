import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ROLES } from './utils/constants';
import DashboardLayout from './layouts/DashboardLayout';

// Officer Pages
import OfficerOverview from './pages/officer/OfficerOverview';
import RiskAnalytics from './pages/officer/RiskAnalytics';
import PersonnelList from './pages/officer/PersonnelList';
import PersonnelDetail from './pages/officer/PersonnelDetail';
import OfficerAlerts from './pages/officer/OfficerAlerts';

// Commander Pages
import CommanderOverview from './pages/commander/CommanderOverview';
import UnitAnalytics from './pages/commander/UnitAnalytics';
import CommanderAlerts from './pages/commander/CommanderAlerts';

// Shared Pages
import AlertCenter from './pages/shared/AlertCenter';
import NotFound from './pages/NotFound';

function RoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === ROLES.COMMANDER ? '/commander' : '/officer'} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              {/* Root redirect */}
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

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
