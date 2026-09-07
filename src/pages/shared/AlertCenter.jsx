import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import AlertCard from '../../components/AlertCard/AlertCard';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import StatCard from '../../components/StatCard/StatCard';
import { Bell, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { ALERT_STATUS, ALERT_SEVERITY, UNITS } from '../../utils/constants';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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

  // Tab filter
  let tabFiltered = alerts;
  if (activeTab === 'active') tabFiltered = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE);
  if (activeTab === 'acknowledged') tabFiltered = alerts.filter(a => a.status === ALERT_STATUS.ACKNOWLEDGED);
  if (activeTab === 'reviewed') tabFiltered = alerts.filter(a => a.status === ALERT_STATUS.REVIEWED);

  // Additional filters
  let filtered = filterBySearch(tabFiltered, search, ['title', 'description', 'personnel_name', 'unit']);
  if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);
  if (severityFilter) filtered = filtered.filter(a => a.severity === severityFilter);
  if (unitFilter) filtered = filtered.filter(a => a.unit === unitFilter);

  const activeCount = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length;
  const ackCount = alerts.filter(a => a.status === ALERT_STATUS.ACKNOWLEDGED).length;
  const reviewedCount = alerts.filter(a => a.status === ALERT_STATUS.REVIEWED).length;
  const criticalCount = alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL && a.status === ALERT_STATUS.ACTIVE).length;

  const tabs = [
    { key: 'all', label: `All (${alerts.length})` },
    { key: 'active', label: `Active (${activeCount})` },
    { key: 'acknowledged', label: `Acknowledged (${ackCount})` },
    { key: 'reviewed', label: `Reviewed (${reviewedCount})` },
  ];

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
        title="Alert Center"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Alert Center' }]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        {/* Summary Stats */}
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 'var(--space-6)' }}>
          <StatCard label="Active" value={activeCount} icon={Bell} color="var(--color-risk-elevated)" bgColor="var(--color-risk-elevated-bg)" />
          <StatCard label="Critical" value={criticalCount} icon={AlertTriangle} color="var(--color-risk-elevated)" bgColor="var(--color-risk-elevated-bg)" />
          <StatCard label="Acknowledged" value={ackCount} icon={CheckCircle} color="var(--color-risk-moderate)" bgColor="var(--color-risk-moderate-bg)" />
          <StatCard label="Reviewed" value={reviewedCount} icon={ShieldCheck} color="var(--color-risk-low)" bgColor="var(--color-risk-low-bg)" />
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filterRow}>
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            filters={filters}
          />
        </div>

        {/* Alert List */}
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
