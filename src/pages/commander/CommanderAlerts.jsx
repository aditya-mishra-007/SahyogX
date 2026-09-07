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
import { alertsData } from '../../mocks';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

export default function CommanderAlerts() {
  const [alerts, setAlerts] = useState(alertsData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => {
    fetchAlerts()
      .then(data => { if (data && data.length) setAlerts(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (id) => {
    await updateAlertStatus(id, ALERT_STATUS.ACKNOWLEDGED);
    const updated = await fetchAlerts(true);
    setAlerts(updated);
  };

  const handleReview = async (id) => {
    await updateAlertStatus(id, ALERT_STATUS.REVIEWED);
    const updated = await fetchAlerts(true);
    setAlerts(updated);
  };

  // Dynamic unit options from live alerts
  const availableUnits = Array.from(
    new Set(alerts.map(a => a.unit).filter(Boolean))
  ).sort();
  const unitOptions = availableUnits.length > 0
    ? availableUnits.map(u => ({ value: u, label: u }))
    : UNITS.map(u => ({ value: u, label: u }));

  let filtered = filterBySearch(alerts, search, ['title', 'unit', 'personnel_name', 'description']);
  if (severityFilter) filtered = filtered.filter(a => a.severity?.toLowerCase() === severityFilter.toLowerCase());
  if (unitFilter) filtered = filtered.filter(a => a.unit === unitFilter);

  const isAlertActive = (a) => a.status === ALERT_STATUS.ACTIVE || a.status === 'active' || a.status === 'new';
  const isAlertReviewed = (a) => a.status === ALERT_STATUS.REVIEWED || a.status === 'reviewed' || a.status === 'resolved';

  const activeCount = alerts.filter(isAlertActive).length;
  const criticalCount = alerts.filter(a => (a.severity?.toLowerCase() === 'critical') && isAlertActive(a)).length;
  const reviewedCount = alerts.filter(isAlertReviewed).length;

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
      options: unitOptions,
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🔔</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Loading Early Warning Alerts...</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Connecting to unit surveillance stream</div>
            </div>
          ) : filtered.length === 0 ? (
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
