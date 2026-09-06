import { useState, useEffect } from 'react';
import {
  Users, Building2, ShieldAlert, AlertTriangle, TrendingUp, Bell,
} from 'lucide-react';
import {
  BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import { fetchUnitAnalytics } from '../../api/analyticsApi';
import { fetchAlerts } from '../../api/alertsApi';
import { ALERT_STATUS, CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

export default function CommanderOverview() {
  const [unitData, setUnitData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchUnitAnalytics().then(setUnitData);
    fetchAlerts().then(setAlerts);
  }, []);

  if (!unitData) return (
    <>
      <Header title="Commander Overview" />
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading...
      </div>
    </>
  );

  const totalPersonnel = unitData.units.reduce((s, u) => s + u.strength, 0);
  const totalAlerts = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length;
  const highRiskUnits = unitData.units.filter(u => u.requires_attention).length;
  const totalElevated = unitData.units.reduce((s, u) => s + u.risk_distribution.elevated, 0);

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '13px',
  };

  return (
    <>
      <Header
        title="Commander Overview"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Overview' }]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        {/* KPI Cards */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Personnel"
            value={totalPersonnel}
            icon={Users}
            color="var(--color-accent)"
            bgColor="var(--color-accent-bg)"
          />
          <StatCard
            label="Total Units"
            value={unitData.units.length}
            icon={Building2}
            color="var(--color-info)"
            bgColor="var(--color-info-bg)"
          />
          <StatCard
            label="Units Requiring Attention"
            value={highRiskUnits}
            icon={AlertTriangle}
            color="var(--color-risk-moderate)"
            bgColor="var(--color-risk-moderate-bg)"
            subtext="Elevated welfare indicators"
          />
          <StatCard
            label="Elevated Risk Personnel"
            value={totalElevated}
            icon={ShieldAlert}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
            subtext="Across all units"
          />
          <StatCard
            label="Active Alerts"
            value={totalAlerts}
            icon={Bell}
            color="var(--color-risk-elevated)"
            bgColor="var(--color-risk-elevated-bg)"
          />
          <StatCard
            label="Avg Risk Score"
            value={(unitData.units.reduce((s, u) => s + u.avg_risk_score, 0) / unitData.units.length).toFixed(1)}
            icon={TrendingUp}
            color="var(--color-accent)"
            bgColor="var(--color-accent-bg)"
            subtext="Across all units"
          />
        </div>

        {/* Unit Comparison Charts */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Unit Risk Score Comparison" subtitle="Average welfare risk score by unit">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={unitData.unit_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="risk_score" name="Avg Risk Score" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Unit Workload Comparison" subtitle="Average workload score by unit">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={unitData.unit_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="workload" name="Avg Workload" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Unit Cards */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Unit Welfare Summary</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {unitData.units.map(unit => {
              const total = unit.risk_distribution.low + unit.risk_distribution.moderate + unit.risk_distribution.elevated;
              return (
                <div key={unit.id} className={styles.unitCard}>
                  <div className={styles.unitName}>{unit.name}</div>
                  <div className={styles.unitStats}>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Strength</div>
                      <div className={styles.unitStatValue}>{unit.strength}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Avg Risk Score</div>
                      <div className={styles.unitStatValue}>{unit.avg_risk_score.toFixed(1)}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Active Alerts</div>
                      <div className={styles.unitStatValue}>{unit.active_alerts}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Avg Workload</div>
                      <div className={styles.unitStatValue}>{unit.avg_workload}</div>
                    </div>
                  </div>

                  {/* Risk Distribution Bar */}
                  <div className={styles.riskDistBar}>
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(unit.risk_distribution.low / total) * 100}%`, background: 'var(--color-risk-low)' }}
                    />
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(unit.risk_distribution.moderate / total) * 100}%`, background: 'var(--color-risk-moderate)' }}
                    />
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(unit.risk_distribution.elevated / total) * 100}%`, background: 'var(--color-risk-elevated)' }}
                    />
                  </div>
                  <div className={styles.riskDistLabels}>
                    <span>Low: {unit.risk_distribution.low}</span>
                    <span>Moderate: {unit.risk_distribution.moderate}</span>
                    <span>Elevated: {unit.risk_distribution.elevated}</span>
                  </div>

                  {unit.requires_attention && (
                    <div className={styles.attentionBadge}>
                      <AlertTriangle size={12} /> Requires Attention
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
