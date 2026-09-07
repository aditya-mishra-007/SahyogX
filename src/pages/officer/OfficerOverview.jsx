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
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import AlertCard from '../../components/AlertCard/AlertCard';
import { fetchPersonnel } from '../../api/personnelApi';
import { fetchAlerts, updateAlertStatus } from '../../api/alertsApi';
import { fetchOfficerAnalytics } from '../../api/analyticsApi';
import { personnelData, alertsData, riskDistribution, riskTrendData } from '../../mocks';
import { RISK_LEVELS, ALERT_STATUS } from '../../utils/constants';
import styles from '../Pages.module.css';

const initialAnalytics = {
  risk_distribution: riskDistribution,
  risk_trend: riskTrendData,
};

export default function OfficerOverview() {
  const [personnel, setPersonnel] = useState(personnelData);
  const [alerts, setAlerts] = useState(alertsData);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonnel().then(data => { if (data && data.length) setPersonnel(data); });
    fetchAlerts().then(data => { if (data && data.length) setAlerts(data); });
    fetchOfficerAnalytics().then(data => { if (data) setAnalytics(data); });
  }, []);

  const distLow = analytics?.risk_distribution?.find(d => d.name.toLowerCase().includes('low'))?.value;
  const distMod = analytics?.risk_distribution?.find(d => d.name.toLowerCase().includes('moderate'))?.value;
  const distElev = analytics?.risk_distribution?.find(d => d.name.toLowerCase().includes('elevated'))?.value;

  const lowCount = distLow !== undefined ? distLow : personnel.filter(p => p.risk_level === RISK_LEVELS.LOW).length;
  const modCount = distMod !== undefined ? distMod : personnel.filter(p => p.risk_level === RISK_LEVELS.MODERATE).length;
  const elevCount = distElev !== undefined ? distElev : personnel.filter(p => p.risk_level === RISK_LEVELS.ELEVATED).length;
  const pendingReview = personnel.filter(p => p.review_status === 'pending').length || elevCount;
  const activeAlerts = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE || a.status === 'active' || a.status === 'new');

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
          <ChartCard title="Welfare Risk Distribution" subtitle="Force-wide risk level breakdown">
            {analytics?.risk_distribution ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Large full-width donut chart */}
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analytics.risk_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={62}
                      paddingAngle={4}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return value > 0 ? (
                          <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700}>
                            {value}
                          </text>
                        ) : null;
                      }}
                      labelLine={false}
                    >
                      {analytics.risk_distribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '13px' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Horizontal breakdown row below chart */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '4px' }}>
                  {(() => {
                    const total = analytics.risk_distribution.reduce((s, e) => s + e.value, 0);
                    return analytics.risk_distribution.map((entry) => {
                      const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                      // shorten long names
                      const shortName = entry.name.replace('Welfare Risk', '').replace('Risk', '').trim();
                      return (
                        <div key={entry.name} style={{
                          flex: '1 1 0',
                          minWidth: 80,
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--color-surface-hover, #F1F5F9)',
                          border: `2px solid ${entry.fill}30`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'flex-start',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.fill }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {shortName}
                            </span>
                          </div>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: entry.fill, lineHeight: 1 }}>
                            {entry.value}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            {pct}% of unit
                          </span>
                          {/* mini bar */}
                          <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: 'var(--color-border)', marginTop: 2 }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: entry.fill, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                <span>Evaluating unit stress telemetry...</span>
              </div>
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
