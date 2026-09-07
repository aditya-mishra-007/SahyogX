import React from 'react';
import type { DutyDay } from '../../services/types';

interface WorkloadChartProps {
  data: DutyDay[];
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-muted text-sm">No duty records logged.</div>;
  }

  const maxHours = 12; // Reference ceiling

  const getShiftColor = (type: DutyDay['shiftType']) => {
    switch (type) {
      case 'Scheduled Rest':
        return '#059669'; // Soothing green
      case 'Night Shift':
        return '#4f46e5'; // Indigo
      case 'Extended Duty':
        return '#d97706'; // Amber
      case 'Day Shift':
      default:
        return '#1e3a5f'; // Slate navy
    }
  };

  // Reverse if order is newest first so it shows chronologically left to right
  const chronological = [...data].reverse();

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ minWidth: '460px', padding: '8px 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '8px',
            height: '160px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '6px'
          }}
        >
          {chronological.map((day, idx) => {
            const heightPercent = Math.min(100, (day.hours / maxHours) * 100);
            const color = getShiftColor(day.shiftType);

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    color: color,
                    marginBottom: '4px'
                  }}
                >
                  {day.hours}h
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '28px',
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    opacity: 0.9
                  }}
                  title={`${day.date} (${day.dayOfWeek}): ${day.hours}h - ${day.shiftType} @ ${day.operationalZone}`}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px' }}>
          {chronological.map((day, idx) => {
            const shortDate = day.date.slice(5); // MM-DD
            return (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#334155' }}>
                  {day.dayOfWeek}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                  {shortDate}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', fontSize: '0.75rem', color: '#475569' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#1e3a5f', borderRadius: '2px' }} />
            Day Shift
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#4f46e5', borderRadius: '2px' }} />
            Night Shift
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#059669', borderRadius: '2px' }} />
            Scheduled Rest
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#d97706', borderRadius: '2px' }} />
            Extended Duty
          </span>
        </div>
      </div>
    </div>
  );
};
