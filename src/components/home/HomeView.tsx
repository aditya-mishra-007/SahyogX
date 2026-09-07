import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { WelfareStatus, DutyWorkloadData, LeaveRecoveryData } from '../../services/types';
import {
  HeartPulse,
  Clock,
  MapPin,
  Palmtree,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [welfare, setWelfare] = useState<WelfareStatus | null>(null);
  const [workload, setWorkload] = useState<DutyWorkloadData | null>(null);
  const [leave, setLeave] = useState<LeaveRecoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wData, wkData, lvData] = await Promise.all([
        api.getWelfareStatus(),
        api.getWorkload(),
        api.getLeaves()
      ]);
      setWelfare(wData);
      setWorkload(wkData);
      setLeave(lvData);
    } catch (err) {
      console.error('Failed to load home overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRiskBadgeClass = (risk?: string) => {
    switch (risk) {
      case 'Optimal': return 'badge-optimal';
      case 'Balanced': return 'badge-balanced';
      case 'Moderate Attention': return 'badge-attention';
      case 'Elevated Review': return 'badge-review';
      default: return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
        <p>Loading personal welfare overview...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-gap">
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)',
        color: 'white',
        padding: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
              <ShieldCheck size={14} /> Unit: {profile?.unit}
            </div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
              Welcome, {profile?.rank} {profile?.name}
            </h2>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', marginTop: '6px', maxWidth: '650px' }}>
              Your personal welfare record is active and up-to-date. Regular check-ins help maintain unit readiness and individual well-being.
            </p>
          </div>

          <button
            className="btn btn-teal"
            onClick={() => onNavigate('assessment')}
            style={{ backgroundColor: '#ffffff', color: '#0f766e', fontWeight: 600, border: 'none', boxShadow: 'var(--shadow-sm)' }}
          >
            Start Self-Assessment
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Top 4 Quick Summary Metrics */}
      <div className="metric-grid">
        {/* Welfare Indicator */}
        <div className="metric-card card-interactive" onClick={() => onNavigate('welfare')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Welfare Status</span>
            <HeartPulse size={18} color="#0d9488" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className={`badge ${getRiskBadgeClass(welfare?.currentRisk)}`}>
              {welfare?.currentRisk || 'Balanced'}
            </span>
          </div>
          <div className="metric-detail" style={{ marginTop: 'auto' }}>
            <span>Assessment: {welfare?.lastAssessmentDate}</span>
          </div>
        </div>

        {/* Workload Metric */}
        <div className="metric-card card-interactive" onClick={() => onNavigate('workload')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Duty Pace</span>
            <Clock size={18} color="#0284c7" />
          </div>
          <div className="metric-value">
            {workload?.weeklyAverageHours || 41.5} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>hrs/wk</span>
          </div>
          <div className="metric-detail" style={{ marginTop: 'auto' }}>
            <span>{workload?.consecutiveDutyDays} consecutive duty shifts</span>
          </div>
        </div>

        {/* Deployment Metric */}
        <div className="metric-card card-interactive" onClick={() => onNavigate('workload')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Station Duration</span>
            <MapPin size={18} color="#8b5cf6" />
          </div>
          <div className="metric-value">
            {workload?.deploymentDaysTotal || 119} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>days</span>
          </div>
          <div className="metric-detail" style={{ marginTop: 'auto', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span>{workload?.activeDeploymentStation?.split('-')[1]?.trim() || 'Forward Post'}</span>
          </div>
        </div>

        {/* Leave Recovery Metric */}
        <div className="metric-card card-interactive" onClick={() => onNavigate('leave')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Annual Leave Balance</span>
            <Palmtree size={18} color="#059669" />
          </div>
          <div className="metric-value">
            {leave?.balances[0]?.remaining || 32} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>days rem.</span>
          </div>
          <div className="metric-detail" style={{ marginTop: 'auto' }}>
            <span>Next rest cycle: {leave?.nextRestCycleDate}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Overview */}
      <div className="grid-2">
        {/* Left: Welfare Status Summary Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <HeartPulse size={20} color="#0d9488" />
              Current Welfare & Risk Indicator
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('welfare')}>
              Detailed Trends
            </button>
          </div>
          <div className="card-body">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Current Assessment Status</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {welfare?.currentRisk === 'Balanced' ? 'Balanced Operational Pace' : welfare?.currentRisk}
                </strong>
              </div>
              <span className={`badge ${getRiskBadgeClass(welfare?.currentRisk)}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                {welfare?.currentRisk}
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {welfare?.neutralSummary}
            </p>

            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Key Contributing Indicators
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {welfare?.contributingIndicators?.slice(0, 4).map((ind, i) => (
                  <div key={i} style={{ padding: '10px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{ind.name}</span>
                      <span style={{ color: ind.status === 'Good' ? '#059669' : '#d97706', fontWeight: 600 }}>{ind.status}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px', color: 'var(--text-primary)' }}>
                      {ind.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Next Scheduled Assessment: <strong>{welfare?.nextAssessmentDueDate}</strong>
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('assessment')}>
              Complete Check-in
            </button>
          </div>
        </div>

        {/* Right: Workload & Deployment Snapshot */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="#1e3a5f" />
              Duty & Deployment Snapshot
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('workload')}>
              Duty Log
            </button>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MapPin size={16} color="#0d9488" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Post: {workload?.activeDeploymentStation}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '24px' }}>
                Zone: {workload?.deploymentZone} | Since {workload?.deploymentStartDate} ({workload?.deploymentDaysTotal} days)
              </div>
            </div>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Recent Operational Cycles
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workload?.recentOperationalPeriods?.slice(0, 2).map((period, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{period.periodName}</strong>
                    <span className="badge badge-balanced" style={{ fontSize: '0.7rem' }}>{period.intensity}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {period.dateRange}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {period.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upcoming sanctioned leave: <strong>15 Oct 2026</strong>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leave')}>
              View Recovery Cycles
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Welfare Actions Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={20} color="#0d9488" />
            Recommended Personal Welfare Guidance
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('resources')}>
            All Resources
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {welfare?.recommendedActions.map((action, idx) => (
              <div key={idx} style={{
                padding: '14px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
