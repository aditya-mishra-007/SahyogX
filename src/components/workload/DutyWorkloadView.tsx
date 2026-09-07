import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { DutyWorkloadData } from '../../services/types';
import { WorkloadChart } from '../charts/WorkloadChart';
import {
  Clock,
  Calendar,
  Compass,
  Layers
} from 'lucide-react';

export const DutyWorkloadView: React.FC = () => {
  const [workload, setWorkload] = useState<DutyWorkloadData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkload()
      .then(data => setWorkload(data))
      .catch(err => console.error('Failed to load duty workload', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !workload) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p>Loading duty schedule and operational logs...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-gap">
      {/* Top Deployment Information Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Compass size={22} color="#1e3a5f" />
            Current Deployment & Operational Station
          </div>
          <span className="badge badge-balanced">Active Posting</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Station & Post</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {workload.activeDeploymentStation}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Terrain: {workload.deploymentZone}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deployment Duration</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                {workload.deploymentDaysTotal} Days
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Commenced: {workload.deploymentStartDate}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pacing Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                Normal Pacing
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Average {workload.weeklyAverageHours} hrs / week
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duty Hours Visual Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#0d9488" />
            Recent Duty Hours & Rest Intervals (Daily Log)
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Past 10 Duty Cycles</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Daily duty watch distribution showing standard day shifts, scheduled night watches, and mandatory rest periods.
          </p>
          <WorkloadChart data={workload.dailyDutyLog} />
        </div>
      </div>

      {/* Detailed Duty Log Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="#1e3a5f" />
            Operational Shift Records
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Day</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Shift Type</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recorded Hours</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Operational Location</th>
                </tr>
              </thead>
              <tbody>
                {workload.dailyDutyLog.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500 }}>{log.date}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{log.dayOfWeek}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className={`badge ${
                        log.shiftType === 'Scheduled Rest' ? 'badge-optimal' :
                        log.shiftType === 'Night Shift' ? 'badge-balanced' :
                        log.shiftType === 'Extended Duty' ? 'badge-attention' : 'badge-neutral'
                      }`}>
                        {log.shiftType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--primary)' }}>
                      {log.hours} hrs
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                      {log.operationalZone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Operational Periods */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={20} color="#1e3a5f" />
            Recent Operational Cycles & Tasks
          </div>
        </div>
        <div className="card-body">
          <div className="flex-col-gap">
            {workload.recentOperationalPeriods.map((period, i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {period.periodName}
                  </h4>
                  <span className={`badge ${
                    period.intensity === 'Standard' ? 'badge-optimal' :
                    period.intensity === 'Elevated' ? 'badge-attention' : 'badge-balanced'
                  }`}>
                    {period.intensity} Intensity
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {period.dateRange}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {period.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
