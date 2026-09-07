import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Activity,
  ClipboardCheck,
  Clock,
  CalendarDays,
  LifeBuoy,
  MessageSquarePlus,
  Bell,
  UserCheck,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadNotificationsCount
}) => {
  const { profile, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'welfare', label: 'My Welfare Status', icon: Activity },
    { id: 'assessment', label: 'Self-Assessment', icon: ClipboardCheck },
    { id: 'workload', label: 'Duty & Workload', icon: Clock },
    { id: 'leave', label: 'Leave & Recovery', icon: CalendarDays },
    { id: 'resources', label: 'Welfare Resources', icon: LifeBuoy },
    { id: 'review', label: 'Request Review', icon: MessageSquarePlus },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'profile', label: 'Personnel Profile', icon: UserCheck }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <Shield size={22} />
        </div>
        <div>
          <div className="brand-title">SahyogX</div>
          <div className="brand-subtitle">Personnel Welfare</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} className="nav-item-icon" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="nav-item-badge">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {profile?.name ? profile.name.charAt(0) : 'P'}
          </div>
          <div className="user-info">
            <div className="user-name">{profile?.name || 'Authorized Personnel'}</div>
            <div className="user-unit">{profile?.personnelId || 'ID Verified'}</div>
          </div>
          <button
            className="icon-btn"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{ width: '32px', height: '32px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
