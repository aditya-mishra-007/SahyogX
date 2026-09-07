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
import { unitsData, unitComparisonData, alertsData } from '../../mocks';
import { ALERT_STATUS, CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

const initialUnitData = {
  units: unitsData,
  unit_comparison: unitComparisonData,
  force_average_risk_score: 35,
  highest_risk_unit: 'Alpha Company',
};

export default function CommanderOverview() {
  const [unitData, setUnitData] = useState(initialUnitData);
  const [alerts, setAlerts] = useState(alertsData);

  useEffect(() => {
    fetchUnitAnalytics().then(data => { if (data) setUnitData(data); });
    fetchAlerts().then(data => { if (data && data.length) setAlerts(data); });
  }, []);

  if (!unitData) return (
    <>
      <Header title="Commander Overview" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Overview' }]} />
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>⚡</div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Loading Operational Overview...</div>
        <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>Aggregating multi-unit stress telemetry from predictive models</div>
      </div>
    </>
  );

  const units = unitData?.units || [];
  const totalPersonnel = units.reduce((s, u) => s + (u.strength || u.total_personnel || 0), 0);
  const totalAlerts = alerts.filter(a => a.status === ALERT_STATUS.ACTIVE || a.status === 'active' || a.status === 'new').length;
  const highRiskUnits = units.filter(u => u.requires_attention || u.risk_level === 'HIGH' || u.risk_level === 'CRITICAL').length;
  const totalElevated = units.reduce((s, u) => {
    const elev = u.risk_distribution?.elevated ?? ((u.risk_breakdown?.high || 0) + (u.risk_breakdown?.critical || 0));
    return s + (elev || 0);
  }, 0);
  const avgRiskScore = units.length > 0
    ? (units.reduce((s, u) => s + (u.avg_risk_score ?? Math.round((u.average_risk_score || 0) * 100)), 0) / units.length).toFixed(1)
    : '0.0';

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
            value={avgRiskScore}
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
            {units.map((unit, idx) => {
              const low = unit.risk_distribution?.low ?? (unit.risk_breakdown?.low || 0);
              const mod = unit.risk_distribution?.moderate ?? (unit.risk_breakdown?.moderate || 0);
              const elev = unit.risk_distribution?.elevated ?? ((unit.risk_breakdown?.high || 0) + (unit.risk_breakdown?.critical || 0));
              const total = (low + mod + elev) || unit.strength || unit.total_personnel || 1;
              const unitName = unit.name || unit.unit || `Unit ${idx + 1}`;
              const strength = unit.strength || unit.total_personnel || total;
              const rawScore = unit.avg_risk_score ?? (unit.average_risk_score != null ? Math.round(unit.average_risk_score * 100) : 0);
              const unitScore = Number(rawScore).toFixed(1);
              const activeAlerts = unit.active_alerts ?? unit.active_alerts_count ?? 0;
              const avgWorkload = unit.avg_workload ?? Math.min(95, Math.round(rawScore * 1.1 + 10));

              return (
                <div key={unit.id || `unit-${idx}`} className={styles.unitCard}>
                  <div className={styles.unitName}>{unitName}</div>
                  <div className={styles.unitStats}>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Strength</div>
                      <div className={styles.unitStatValue}>{strength}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Avg Risk Score</div>
                      <div className={styles.unitStatValue}>{unitScore}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Active Alerts</div>
                      <div className={styles.unitStatValue}>{activeAlerts}</div>
                    </div>
                    <div className={styles.unitStatItem}>
                      <div className={styles.unitStatLabel}>Avg Workload</div>
                      <div className={styles.unitStatValue}>{avgWorkload}</div>
                    </div>
                  </div>

                  {/* Risk Distribution Bar */}
                  <div className={styles.riskDistBar}>
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(low / total) * 100}%`, background: 'var(--color-risk-low)' }}
                    />
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(mod / total) * 100}%`, background: 'var(--color-risk-moderate)' }}
                    />
                    <div
                      className={styles.riskDistSegment}
                      style={{ width: `${(elev / total) * 100}%`, background: 'var(--color-risk-elevated)' }}
                    />
                  </div>
                  <div className={styles.riskDistLabels}>
                    <span>Low: {low}</span>
                    <span>Moderate: {mod}</span>
                    <span>Elevated: {elev}</span>
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
