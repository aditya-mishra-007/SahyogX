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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
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
  const { role, switchRole, setActivePortal } = useAuth();

  const navItems = role === ROLES.COMMANDER ? commanderNav : officerNav;

  const badges = { activeAlerts };

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

        {/* Role Switcher */}
        <div className={styles.roleSwitcher}>
          <label htmlFor="role-select">Active Role</label>
          <select
            id="role-select"
            className={styles.roleSelect}
            value={role}
            onChange={(e) => switchRole(e.target.value)}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>
              {role === ROLES.COMMANDER ? 'Commander' : 'Welfare Officer'}
            </div>
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

            <button
              className={styles.navItem}
              onClick={() => {
                if (typeof onClose === 'function') onClose();
                if (typeof setActivePortal === 'function') setActivePortal('personnel');
              }}
              style={{ width: '100%', textAlign: 'left', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', marginTop: '10px', borderRadius: '6px' }}
              title="Switch to Individual Personnel Portal"
            >
              <UserCheck className={styles.navIcon} size={20} />
              <span>Personnel Portal</span>
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          SahyogX v1.0 — Dashboard
        </div>
      </aside>
    </>
  );
}
