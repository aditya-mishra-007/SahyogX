import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_LABELS } from '../../utils/constants';
import styles from './Header.module.css';

export default function Header({ title, breadcrumbs = [] }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div>
          {breadcrumbs.length > 0 && (
            <div className={styles.breadcrumb}>
              {breadcrumbs.map((bc, i) => (
                <span key={i}>
                  {i > 0 && <span className={styles.breadcrumbSep}> / </span>}
                  {bc.to ? <a href={bc.to}>{bc.label}</a> : <span>{bc.label}</span>}
                </span>
              ))}
            </div>
          )}
          <h2 className={styles.pageTitle}>{title}</h2>
        </div>
      </div>

      <div className={styles.headerRight}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
