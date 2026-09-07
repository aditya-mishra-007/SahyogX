import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
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

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  unreadNotificationsCount
}) => {
  const { profile, logout } = useAuth();

  if (!isOpen) return null;

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        zIndex: 999,
        display: 'flex'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '280px',
          maxWidth: '80%',
          backgroundColor: 'var(--bg-surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ width: '32px', height: '32px' }}>
              <Shield size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>SahyogX</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Personnel Portal</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Navigation Menu">
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
              >
                <Icon size={18} className="nav-item-icon" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-item-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profile?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile?.personnelId}</div>
            </div>
            <button className="icon-btn" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
