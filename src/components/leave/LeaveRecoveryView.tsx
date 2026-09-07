import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { LeaveRecoveryData } from '../../services/types';
import {
  CalendarDays,
  Palmtree,
  Clock,
  Info,
  CalendarCheck
} from 'lucide-react';

export const LeaveRecoveryView: React.FC = () => {
  const [leaveData, setLeaveData] = useState<LeaveRecoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaves()
      .then(data => setLeaveData(data))
      .catch(err => console.error('Failed to load leave records', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !leaveData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p>Loading leave balances and recovery schedule...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-gap">
      {/* Read-Only Regulatory Notice */}
      <div className="notice-box">
        <Info size={20} className="notice-icon" color="#1e3a5f" />
        <div>
          <strong>Official Records Notice:</strong> Leave balances and recovery schedules are synchronized from Battalion Administration records.
          To submit a new leave application or request date amendments, follow the standard Coy Orderly Room procedure.
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="metric-grid">
        {leaveData.balances.map((bal, idx) => {
          const usedPercent = Math.round((bal.availed / bal.entitled) * 100);
          return (
            <div key={idx} className="metric-card">
              <div className="metric-header">
                <span>{bal.leaveType}</span>
                <Palmtree size={18} color="#059669" />
              </div>
              <div className="metric-value" style={{ color: 'var(--primary)' }}>
                {bal.remaining} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>days left</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Used: {bal.availed} of {bal.entitled} d</span>
                  <span>{usedPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${usedPercent}%`,
                      height: '100%',
                      backgroundColor: '#0d9488',
                      borderRadius: 'var(--radius-full)'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Approved Leave Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CalendarCheck size={20} color="#059669" />
            Upcoming Approved Leave Records
          </div>
          <span className="badge badge-optimal">Officially Sanctioned</span>
        </div>
        <div className="card-body">
          {leaveData.upcomingLeaves.length > 0 ? (
            leaveData.upcomingLeaves.map(l => (
              <div key={l.id} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-optimal-bg)',
                border: '1px solid var(--status-optimal-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#065f46' }}>
                    {l.leaveType} ({l.daysCount} Days)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '4px' }}>
                    Window: <strong>{l.startDate}</strong> to <strong>{l.endDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                    Sanction Authority: {l.sanctionAuthority}
                  </div>
                </div>
                <span className="badge badge-optimal">Ready for Movement</span>
              </div>
            ))
          ) : (
            <div className="text-muted text-sm">No upcoming leave currently scheduled.</div>
          )}
        </div>
      </div>

      {/* Mandatory Recovery & Rest Cycles */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#0d9488" />
            Mandatory Recovery & Decompression Cycles
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            <div style={{ padding: '16px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Previous Rest Cycle Date</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {leaveData.lastRestCycleDate}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px' }}>
                ✓ 24-Hour continuous post-shift recovery verified
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next Scheduled Rest Cycle</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginTop: '4px' }}>
                {leaveData.nextRestCycleDate}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Scheduled per battalion duty roster cycle
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Leave History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CalendarDays size={20} color="#1e3a5f" />
            Completed Leave History (Current Service Year)
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Leave Category</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Start Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>End Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Approval Authority</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveData.recentLeaves.map(lv => (
                  <tr key={lv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{lv.leaveType}</td>
                    <td style={{ padding: '14px 20px' }}>{lv.daysCount} days</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{lv.startDate}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{lv.endDate}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lv.sanctionAuthority}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-balanced">{lv.status}</span>
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
