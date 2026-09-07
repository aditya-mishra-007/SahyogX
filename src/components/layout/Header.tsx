import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, ShieldCheck, User, Menu } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount: number;
  onToggleMobileMenu?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  home: 'Personnel Welfare Overview',
  welfare: 'My Welfare Status & Trends',
  assessment: 'Wellness Self-Assessment',
  workload: 'My Duty & Workload Summary',
  leave: 'Leave & Recovery Records',
  resources: 'Welfare & Recovery Resources',
  review: 'Request Welfare Review',
  notifications: 'Notifications & Updates',
  profile: 'Personnel Profile & Privacy'
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  unreadNotificationsCount,
  onToggleMobileMenu
}) => {
  const { profile } = useAuth();

  const getDisplayName = () => {
    if (!profile?.name) return profile?.rank || 'User';
    const nameParts = profile.name.split(' ');
    if (profile.rank && nameParts[0]?.toLowerCase() === profile.rank.toLowerCase()) {
      return `${profile.rank} ${nameParts[1] || ''}`.trim();
    }
    return `${profile.rank ? profile.rank + ' ' : ''}${nameParts[0] || 'User'}`.trim();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-btn mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-group">
          <h1 className="page-heading">{TAB_TITLES[currentTab] || 'Welfare Portal'}</h1>
          <div className="header-session-badge">
            <ShieldCheck size={14} color="#0d9488" />
            <span>Encrypted Individual Personnel Session</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* NOTE: The Command Dashboard Portal Switcher button has been intentionally removed.
            Portal access is determined strictly by the backend-authorised role at login.
            PERSONNEL role cannot switch to the command portal under any circumstances.
        */}

        {/* Notification Bell */}
        <button
          className="icon-btn"
          onClick={() => onSelectTab('notifications')}
          title="Notifications"
          aria-label="View Notifications"
        >
          <Bell size={18} />
          {unreadNotificationsCount > 0 && <span className="notification-dot" />}
        </button>

        {/* Profile Pill */}
        <button
          className="btn btn-secondary btn-sm header-profile-btn"
          onClick={() => onSelectTab('profile')}
        >
          <User size={15} />
          <span className="header-profile-text">{getDisplayName()}</span>
        </button>
      </div>
    </header>
  );
};
