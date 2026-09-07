import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Bell,
  Shield,
  Building2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const officerNav = [
  { to: '/officer', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/officer/analytics', icon: BarChart3, label: 'Risk Analytics' },
  { to: '/officer/personnel', icon: Users, label: 'Personnel List' },
  { to: '/officer/alerts', icon: Bell, label: 'Alerts', badgeKey: 'activeAlerts' },
];

const commanderNav = [
  { to: '/commander', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/commander/units', icon: Building2, label: 'Unit Analytics' },
  { to: '/commander/alerts', icon: Bell, label: 'Alert Summary' },
];

const sharedNav = [
  { to: '/alerts', icon: Shield, label: 'Alert Center', badgeKey: 'activeAlerts' },
];

export default function Sidebar({ isOpen, onClose, activeAlerts = 0 }) {
  // Role comes from the backend-authenticated session — NOT user-switchable
  const { isCommander, isOfficer, user, logout } = useAuth();

  // Determine navigation based on backend-authorised role only
  const navItems = isCommander ? commanderNav : officerNav;
  const sectionTitle = isCommander ? 'Commander' : 'Welfare Officer';
  const roleLabel = isCommander ? 'Commander' : 'Welfare Officer';

  const badges = { activeAlerts };

  const handleLogout = () => {
    if (typeof onClose === 'function') onClose();
    logout();
  };

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => (isOpen ? onClose() : onClose('open'))}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`${styles.sidebarOverlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>S</div>
          <div className={styles.brandText}>
            <h1>SahyogX</h1>
            <span>Welfare Monitoring</span>
          </div>
        </div>

        {/* Role Display (read-only — NOT switchable) */}
        <div className={styles.roleSwitcher}>
          <label>Active Role</label>
          <div
            className={styles.roleSelect}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#60a5fa',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              userSelect: 'none',
            }}
            title="Role is set by your backend credentials and cannot be changed"
          >
            🔐 {roleLabel}
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>{sectionTitle}</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                onClick={onClose}
              >
                <item.icon className={styles.navIcon} size={20} />
                <span>{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span className={styles.navBadge}>{badges[item.badgeKey]}</span>
                )}
              </NavLink>
            ))}
          </div>

          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>System</div>
            {sharedNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                onClick={onClose}
              >
                <item.icon className={styles.navIcon} size={20} />
                <span>{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span className={styles.navBadge}>{badges[item.badgeKey]}</span>
                )}
              </NavLink>
            ))}

            {/* NOTE: "Personnel Portal" cross-portal switcher has been intentionally removed.
                Portal switching by role change is not permitted. Roles are set at login by the backend.
                To access a different portal, the user must log out and log in with appropriate credentials.
            */}

            <button
              className={styles.navItem}
              onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', marginTop: '10px', borderRadius: '6px' }}
              title="Sign Out"
            >
              <LogOut className={styles.navIcon} size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>{user?.name || 'Officer'}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>SahyogX v1.0 — Command Portal</div>
        </div>
      </aside>
    </>
  );
}
