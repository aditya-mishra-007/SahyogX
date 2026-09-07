import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import Header from '../../components/Header/Header';
import ChartCard from '../../components/ChartCard/ChartCard';
import { fetchOfficerAnalytics } from '../../api/analyticsApi';
import {
  riskDistribution,
  riskTrendData,
  workloadTrendData,
  dutyHourTrendData,
  deploymentTrendData,
  leaveTrendData,
} from '../../mocks';
import { CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

const initialAnalytics = {
  risk_distribution: riskDistribution,
  risk_trend: riskTrendData,
  workload_trend: workloadTrendData,
  duty_hour_trend: dutyHourTrendData,
  deployment_trend: deploymentTrendData,
  leave_trend: leaveTrendData,
};

export default function RiskAnalytics() {
  const [analytics, setAnalytics] = useState(initialAnalytics);

  useEffect(() => {
    fetchOfficerAnalytics().then(data => { if (data) setAnalytics(data); });
  }, []);

  if (!analytics) return (
    <>
      <Header
        title="Risk Analytics"
        breadcrumbs={[
          { label: 'Dashboard', to: '/officer' },
          { label: 'Risk Analytics' },
        ]}
      />
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>📊</div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Loading Risk Analytics...</div>
        <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>Compiling psychological & physiological risk indicators</div>
      </div>
    </>
  );

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '13px',
  };

  return (
    <>
      <Header
        title="Risk Analytics"
        breadcrumbs={[
          { label: 'Dashboard', to: '/officer' },
          { label: 'Risk Analytics' },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        {/* Row 1: Risk Distribution + Risk Trend */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Welfare Risk Distribution" subtitle="Current personnel by risk level">
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
                  label={({ name, value }) => `${value}`}
                >
                  {analytics.risk_distribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Welfare Risk Trend" subtitle="Risk level distribution over time">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.risk_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="elevated" stackId="1" stroke={CHART_COLORS.danger} fill={CHART_COLORS.danger} fillOpacity={0.3} name="Elevated" />
                <Area type="monotone" dataKey="moderate" stackId="1" stroke={CHART_COLORS.warning} fill={CHART_COLORS.warning} fillOpacity={0.3} name="Moderate" />
                <Area type="monotone" dataKey="low" stackId="1" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.3} name="Low" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: Workload + Duty Hours */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Workload Trend" subtitle="Average workload score and high-workload personnel count">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.workload_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="avg_workload" name="Avg Workload" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="high_workload_count" name="High Workload" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Duty Hour Trend" subtitle="Average duty hours and personnel above threshold">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.duty_hour_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="avg_hours" name="Avg Hours" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="above_threshold" name="Above Threshold" stroke={CHART_COLORS.danger} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Deployment + Leave */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Deployment Duration Trend" subtitle="Average deployment days and extended deployment count">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.deployment_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="avg_days" name="Avg Deployment Days" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="extended_count" name="Extended Deployments" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Leave/Recovery Trend" subtitle="Average leave days and low-leave personnel count">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.leave_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="avg_leave_days" name="Avg Leave Days" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.2} />
                <Area type="monotone" dataKey="low_leave_count" name="Low Leave Count" stroke={CHART_COLORS.warning} fill={CHART_COLORS.warning} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </>
  );
}
