import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { WelfareStatus, PastAssessment } from '../../services/types';
import { RiskTrendChart } from '../charts/RiskTrendChart';
import {
  Activity,
  History,
  TrendingUp,
  ShieldCheck,
  Layers
} from 'lucide-react';

export const WelfareStatusView: React.FC = () => {
  const [welfare, setWelfare] = useState<WelfareStatus | null>(null);
  const [pastAssessments, setPastAssessments] = useState<PastAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wData, asmtData] = await Promise.all([
          api.getWelfareStatus(),
          api.getPastAssessments()
        ]);
        setWelfare(wData);
        setPastAssessments(asmtData);
      } catch (err) {
        console.error('Failed to load welfare status details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <p>Loading personal welfare status records...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-gap">
      {/* Current Risk Indicator Banner */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Activity size={22} color="#0d9488" />
            Current Welfare-Risk Indicator
          </div>
          <span className={`badge ${getRiskBadgeClass(welfare?.currentRisk)}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Current Status: {welfare?.currentRisk}
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Operational Pace Assessment
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                {welfare?.currentRisk === 'Balanced' ? 'Balanced Operational Readiness' : welfare?.currentRisk}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {welfare?.neutralSummary}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Latest assessment: <strong>{welfare?.lastAssessmentDate}</strong></span>
                <span>Next review due: <strong>{welfare?.nextAssessmentDueDate}</strong></span>
              </div>
            </div>

            <div style={{
              padding: '18px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <ShieldCheck size={18} color="#0d9488" />
                Data Protection & Metric Privacy
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your welfare status is derived from verified duty logs, recovery duration, and your periodic self-assessments. Raw predictive model metrics are strictly kept confidential and calibrated for supportive welfare intervention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welfare Risk Trend Line Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={20} color="#1e3a5f" />
            Previous Welfare Trends (Bi-Weekly Checkpoints)
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 3 Months</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Historical progression of your personal welfare indices across recent operational cycles.
          </p>
          {welfare?.trendHistory && <RiskTrendChart data={welfare.trendHistory} />}
        </div>
      </div>

      {/* Contributing Indicators */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={20} color="#0d9488" />
            Contributing Welfare Indicators
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            {welfare?.contributingIndicators.map((ind, i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ind.name}</strong>
                  <span className={`badge ${ind.status === 'Good' ? 'badge-optimal' : 'badge-attention'}`}>
                    {ind.status}
                  </span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                  {ind.value}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {ind.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <History size={20} color="#1e3a5f" />
            Assessment Submission History
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Reference ID</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Submission Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status Level</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Sleep Rating</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Fatigue Rating</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Support Rating</th>
                </tr>
              </thead>
              <tbody>
                {pastAssessments.map((asmt, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                      {asmt.id}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {asmt.date}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${getRiskBadgeClass(asmt.statusSummary)}`}>
                        {asmt.statusSummary}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>
                      {asmt.categoryScores?.sleep || 4} / 5
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>
                      {asmt.categoryScores?.fatigue || 4} / 5
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>
                      {asmt.categoryScores?.social_support || 5} / 5
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
