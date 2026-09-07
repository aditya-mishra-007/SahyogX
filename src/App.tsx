import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './services/api';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { MobileDrawer } from './components/layout/MobileDrawer';

// Section Views
import { HomeView } from './components/home/HomeView';
import { WelfareStatusView } from './components/welfare/WelfareStatusView';
import { AssessmentView } from './components/assessment/AssessmentView';
import { DutyWorkloadView } from './components/workload/DutyWorkloadView';
import { LeaveRecoveryView } from './components/leave/LeaveRecoveryView';
import { WelfareResourcesView } from './components/resources/WelfareResourcesView';
import { ReviewRequestView } from './components/review/ReviewRequestView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(2);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const refreshUnreadCount = async () => {
    try {
      const list = await api.getNotifications();
      setUnreadNotifsCount(list.filter(n => !n.isRead).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
    }
  }, [isAuthenticated, currentTab]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>SahyogX</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Loading secure session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveSection = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'welfare':
        return <WelfareStatusView />;
      case 'assessment':
        return <AssessmentView />;
      case 'workload':
        return <DutyWorkloadView />;
      case 'leave':
        return <LeaveRecoveryView />;
      case 'resources':
        return <WelfareResourcesView />;
      case 'review':
        return <ReviewRequestView />;
      case 'notifications':
        return (
          <NotificationsView
            onNavigate={(tab) => setCurrentTab(tab)}
            onRefreshUnreadCount={refreshUnreadCount}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadNotificationsCount={unreadNotifsCount}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadNotificationsCount={unreadNotifsCount}
      />

      {/* Main Content Pane */}
      <div className="app-main">
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          unreadNotificationsCount={unreadNotifsCount}
          onToggleMobileMenu={() => setMobileDrawerOpen(true)}
        />

        <main className="content-wrapper" id="main-content">
          {renderActiveSection()}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
