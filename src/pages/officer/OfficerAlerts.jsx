import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import AlertCard from '../../components/AlertCard/AlertCard';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { ALERT_SEVERITY, ALERT_STATUS, UNITS } from '../../utils/constants';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

export default function OfficerAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  let filtered = filterBySearch(alerts, search, ['title', 'description', 'personnel_name', 'unit']);
  if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);
  if (severityFilter) filtered = filtered.filter(a => a.severity === severityFilter);
  if (unitFilter) filtered = filtered.filter(a => a.unit === unitFilter);

  const filters = [
    {
      key: 'status',
      label: 'All Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: ALERT_STATUS.ACTIVE, label: 'Active' },
        { value: ALERT_STATUS.ACKNOWLEDGED, label: 'Acknowledged' },
        { value: ALERT_STATUS.REVIEWED, label: 'Reviewed' },
      ],
    },
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

  const activeCount = filtered.filter(a => a.status === ALERT_STATUS.ACTIVE).length;
  const ackCount = filtered.filter(a => a.status === ALERT_STATUS.ACKNOWLEDGED).length;

  return (
    <>
      <Header
        title="Alerts"
        breadcrumbs={[
          { label: 'Dashboard', to: '/officer' },
          { label: 'Alerts' },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Alert Management</h3>
            <p className={styles.sectionSubtitle}>
              {activeCount} active · {ackCount} acknowledged · {filtered.length} total
            </p>
          </div>
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
