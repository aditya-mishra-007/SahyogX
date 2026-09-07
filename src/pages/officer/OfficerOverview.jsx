import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  Bell,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import AlertCard from '../../components/AlertCard/AlertCard';
import { fetchPersonnel } from '../../api/personnelApi';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { fetchOfficerAnalytics } from '../../api/analyticsApi';
import { RISK_LEVELS, ALERT_STATUS } from '../../utils/constants';
import styles from '../Pages.module.css';

export default function OfficerOverview() {
  const [personnel, setPersonnel] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonnel().then(setPersonnel);
    fetchAlerts().then(setAlerts);
    fetchOfficerAnalytics().then(setAnalytics);
  }, []);

  const lowCount = personnel.filter(p => p.risk_level === RISK_LEVELS.LOW).length;
  const modCount = personnel.filter(p => p.risk_level === RISK_LEVELS.MODERATE).length;
  const elevCount = personnel.filter(p => p.risk_level === RISK_LEVELS.ELEVATED).length;
  const pendingReview = personnel.filter(p => p.review_status === 'pending').length;
  const activeAlerts = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE);

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

  return (
    <>
      <Header
        title="Welfare Officer Overview"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Overview' }]}
      />
      <div className={styles.content || ''} style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        {/* KPI Cards */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Personnel"
            value={personnel.length}
            icon={Users}
            color="var(--color-accent)"
            bgColor="var(--color-accent-bg)"
          />
          <StatCard
            label="Low Welfare Risk"
            value={lowCount}
            icon={ShieldCheck}
            color="var(--color-risk-low)"
            bgColor="var(--color-risk-low-bg)"
          />
          <StatCard
            label="Moderate Welfare Risk"
            value={modCount}
            icon={AlertTriangle}
            color="var(--color-risk-moderate)"
            bgColor="var(--color-risk-moderate-bg)"
          />
          <StatCard
            label="Elevated Welfare Risk"
            value={elevCount}
            icon={ShieldAlert}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
          />
          <StatCard
            label="Requiring Review"
            value={pendingReview}
            icon={ClipboardCheck}
            color="var(--color-risk-moderate)"
            bgColor="var(--color-risk-moderate-bg)"
            subtext="Pending welfare review"
          />
          <StatCard
            label="Active Alerts"
            value={activeAlerts.length}
            icon={Bell}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
          />
        </div>

        {/* Risk Distribution Chart */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Welfare Risk Distribution" subtitle="Current risk level breakdown">
            {analytics?.risk_distribution && (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.risk_distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, value }) => `${name.replace('Welfare Risk', '').trim()}: ${value}`}
                    labelLine={false}
                  >
                    {analytics.risk_distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Recent Alerts */}
          <div>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Recent Alerts</h3>
                <p className={styles.sectionSubtitle}>{activeAlerts.length} active alerts</p>
              </div>
              <button
                className={styles.backLink}
                onClick={() => navigate('/officer/alerts')}
                style={{ marginBottom: 0 }}
              >
                View All →
              </button>
            </div>
            <div className={styles.alertsList}>
              {activeAlerts.slice(0, 3).map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onReview={handleReview}
                />
              ))}
              {activeAlerts.length === 0 && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  No active alerts at this time.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
