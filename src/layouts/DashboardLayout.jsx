import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { fetchAlerts } from '../api/alertsApi';
import { ALERT_STATUS } from '../utils/constants';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    fetchAlerts().then((alerts) => {
      const active = alerts.filter((a) => a.status === ALERT_STATUS.ACTIVE).length;
      setActiveAlerts(active);
    });
  }, []);

  const handleSidebarClose = (action) => {
    if (action === 'open') {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        activeAlerts={activeAlerts}
      />
      <main className={styles.main}>
        <Outlet context={{ activeAlerts, setActiveAlerts }} />
      </main>
    </div>
  );
}
