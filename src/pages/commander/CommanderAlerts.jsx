import { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import AlertCard from '../../components/AlertCard/AlertCard';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { ALERT_STATUS, ALERT_SEVERITY, UNITS } from '../../utils/constants';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

export default function CommanderAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => {
    fetchAlerts().then(setAlerts);
  }, []);

  const handleAcknowledge = async (id) => {
    await updateAlertStatus(id, ALERT_STATUS.ACKNOWLEDGED);
    const updated = await fetchAlerts();
    setAlerts(updated);
  };

  const handleReview = async (id) => {
    await updateAlertStatus(id, ALERT_STATUS.REVIEWED);
    const updated = await fetchAlerts();
    setAlerts(updated);
  };

  let filtered = filterBySearch(alerts, search, ['title', 'unit', 'personnel_name']);
  if (severityFilter) filtered = filtered.filter(a => a.severity === severityFilter);
  if (unitFilter) filtered = filtered.filter(a => a.unit === unitFilter);

  const activeCount = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length;
  const criticalCount = alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL && a.status === ALERT_STATUS.ACTIVE).length;
  const reviewedCount = alerts.filter(a => a.status === ALERT_STATUS.REVIEWED).length;

  const filters = [
    {
      key: 'severity',
      label: 'All Severity',
      value: severityFilter,
      onChange: setSeverityFilter,
      options: [
        { value: ALERT_SEVERITY.CRITICAL, label: 'Critical' },
        { value: ALERT_SEVERITY.WARNING, label: 'Warning' },
        { value: ALERT_SEVERITY.INFO, label: 'Info' },
      ],
    },
    {
      key: 'unit',
      label: 'All Units',
      value: unitFilter,
      onChange: setUnitFilter,
      options: UNITS.map(u => ({ value: u, label: u })),
    },
  ];

  return (
    <>
      <Header
        title="Alert Summary"
        breadcrumbs={[
          { label: 'Dashboard', to: '/commander' },
          { label: 'Alert Summary' },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--space-6)' }}>
          <StatCard
            label="Active Alerts"
            value={activeCount}
            icon={Bell}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
          />
          <StatCard
            label="Critical Alerts"
            value={criticalCount}
            icon={AlertTriangle}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
          />
          <StatCard
            label="Reviewed"
            value={reviewedCount}
            icon={ShieldCheck}
            color="var(--color-risk-low)"
            bgColor="var(--color-risk-low-bg)"
          />
        </div>

        <div className={styles.filterRow}>
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            filters={filters}
          />
        </div>

        <div className={styles.alertsList}>
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>
              No alerts match the current filters.
            </p>
          ) : (
            filtered.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onReview={handleReview}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
