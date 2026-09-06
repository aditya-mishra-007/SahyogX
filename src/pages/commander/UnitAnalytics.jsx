import { useState, useEffect } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import Header from '../../components/Header/Header';
import ChartCard from '../../components/ChartCard/ChartCard';
import { fetchUnitAnalytics, fetchOfficerAnalytics } from '../../api/analyticsApi';
import { CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

export default function UnitAnalytics() {
  const [unitData, setUnitData] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchUnitAnalytics().then(setUnitData);
    fetchOfficerAnalytics().then(setAnalytics);
  }, []);

  if (!unitData || !analytics) return (
    <>
      <Header title="Unit Analytics" />
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading...</div>
    </>
  );

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '13px',
  };

  // Radar data from unit comparison
  const radarData = unitData.unit_comparison.map(u => ({
    unit: u.name,
    risk: u.risk_score,
    workload: u.workload,
    deployment: Math.min(100, u.deployment),
    leave: u.leave * 3, // scale for visibility
  }));

  // Unit risk distribution data
  const riskDistData = unitData.units.map(u => ({
    name: u.name.replace(' Company', '').replace('HQ ', ''),
    Low: u.risk_distribution.low,
    Moderate: u.risk_distribution.moderate,
    Elevated: u.risk_distribution.elevated,
  }));

  return (
    <>
      <Header
        title="Unit Analytics"
        breadcrumbs={[
          { label: 'Dashboard', to: '/commander' },
          { label: 'Unit Analytics' },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        {/* Row 1: Unit Comparison */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Unit Risk Distribution" subtitle="Personnel by risk level across units">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="Low" name="Low Risk" fill={CHART_COLORS.success} stackId="stack" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Moderate" name="Moderate Risk" fill={CHART_COLORS.warning} stackId="stack" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Elevated" name="Elevated Risk" fill={CHART_COLORS.danger} stackId="stack" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Unit Deployment Comparison" subtitle="Average deployment days by unit">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={unitData.unit_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="deployment" name="Avg Deployment Days" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: Workload + Leave */}
        <div className={styles.chartsGrid}>
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

          <ChartCard title="Unit Leave / Recovery Comparison" subtitle="Average leave days by unit">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={unitData.unit_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="leave" name="Avg Leave Days" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Historical Trends */}
        <div className={styles.chartsGrid}>
          <ChartCard title="Workload Trend (Historical)" subtitle="Average workload over time">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.workload_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="avg_workload" name="Avg Workload" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Deployment Trend (Historical)" subtitle="Average deployment duration over time">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.deployment_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="avg_days" name="Avg Days" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </>
  );
}
