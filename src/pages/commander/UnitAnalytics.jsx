import { useState, useEffect } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import Header from '../../components/Header/Header';
import ChartCard from '../../components/ChartCard/ChartCard';
import { fetchUnitAnalytics, fetchOfficerAnalytics } from '../../api/analyticsApi';
import { unitsData, unitComparisonData, workloadTrendData, deploymentTrendData } from '../../mocks';
import { CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

const initialUnitData = {
  units: unitsData,
  unit_comparison: unitComparisonData,
  force_average_risk_score: 35,
  highest_risk_unit: 'Alpha Company',
};

const initialAnalytics = {
  workload_trend: workloadTrendData,
  deployment_trend: deploymentTrendData,
};

export default function UnitAnalytics() {
  const [unitData, setUnitData] = useState(initialUnitData);
  const [analytics, setAnalytics] = useState(initialAnalytics);

  useEffect(() => {
    fetchUnitAnalytics().then(data => { if (data) setUnitData(data); });
    fetchOfficerAnalytics().then(data => { if (data) setAnalytics(data); });
  }, []);


  if (!unitData) return (
    <>
      <Header
        title="Unit Analytics"
        breadcrumbs={[
          { label: 'Dashboard', to: '/commander' },
          { label: 'Unit Analytics' },
        ]}
      />
      <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--content-max-width)', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Loading Unit Analytics...</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Aggregating company-level operational metrics and stress distribution
          </div>
        </div>
      </div>
    </>
  );

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '13px',
  };

  const comparison = unitData.unit_comparison || [];
  const units = unitData.units || [];

  // Radar data from unit comparison
  const radarData = comparison.map(u => ({
    unit: u.name || 'Unit',
    risk: u.risk_score || 0,
    workload: u.workload || 50,
    deployment: Math.min(100, u.deployment || 60),
    leave: (u.leave || 10) * 3, // scale for visibility
  }));

  // Unit risk distribution data
  const riskDistData = units.map(u => ({
    name: (u.name || u.unit || 'Unit').replace(' Company', '').replace('HQ ', ''),
    Low: u.risk_distribution?.low ?? (u.risk_breakdown?.low || 0),
    Moderate: u.risk_distribution?.moderate ?? (u.risk_breakdown?.moderate || 0),
    Elevated: u.risk_distribution?.elevated ?? ((u.risk_breakdown?.high || 0) + (u.risk_breakdown?.critical || 0)),
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
              <BarChart data={analytics?.workload_trend || []}>
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
              <BarChart data={analytics?.deployment_trend || []}>
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
