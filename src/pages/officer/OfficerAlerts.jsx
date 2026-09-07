import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import AlertCard from '../../components/AlertCard/AlertCard';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { ALERT_SEVERITY, ALERT_STATUS, UNITS } from '../../utils/constants';
import { alertsData } from '../../mocks';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

export default function OfficerAlerts() {
  const [alerts, setAlerts] = useState(alertsData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  // Extract unique units dynamically from real alerts, with fallback to constant list
  const availableUnits = Array.from(
    new Set(alerts.map(a => a.unit).filter(Boolean))
  ).sort();
  const unitOptions = availableUnits.length > 0
    ? availableUnits.map(u => ({ value: u, label: u }))
    : UNITS.map(u => ({ value: u, label: u }));

  let filtered = filterBySearch(alerts, search, ['title', 'description', 'personnel_name', 'unit']);
  if (statusFilter) {
    filtered = filtered.filter(a => {
      if (statusFilter === 'active') return a.status === 'active' || a.status === 'new';
      if (statusFilter === 'acknowledged') return a.status === 'acknowledged' || a.status === 'in_review';
      if (statusFilter === 'reviewed') return a.status === 'reviewed' || a.status === 'resolved';
      return a.status === statusFilter;
    });
  }
  if (severityFilter) filtered = filtered.filter(a => a.severity?.toLowerCase() === severityFilter.toLowerCase());
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
      options: unitOptions,
    },
  ];

  const activeCount = alerts.filter(a => a.status === 'active' || a.status === 'new').length;
  const ackCount = alerts.filter(a => a.status === 'acknowledged' || a.status === 'in_review').length;

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
              {loading ? 'Retrieving early warning alerts...' : `${activeCount} active · ${ackCount} acknowledged · ${filtered.length} visible (${alerts.length} total)`}
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
