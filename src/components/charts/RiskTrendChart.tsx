import React from 'react';
import type { WelfareTrendPoint } from '../../services/types';

interface RiskTrendChartProps {
  data: WelfareTrendPoint[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-muted text-sm">No historical assessment data available.</div>;
  }

  // Chart dimensions
  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 40 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // X scale
  const getX = (index: number) => {
    if (data.length <= 1) return innerWidth / 2 + padding.left;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  // Y scale (0 to 100)
  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return padding.top + innerHeight - (clamped / 100) * innerHeight;
  };

  // Build SVG path
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  const areaPoints = `${getX(0)},${getY(0)} ${points} ${getX(data.length - 1)},${getY(0)}`;

  // Format short date
  const formatShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${parseInt(parts[2])} ${monthNames[parseInt(parts[1]) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', minWidth: '420px', height: 'auto', display: 'block' }}
        aria-label="Welfare Status Trend Line Chart"
      >
        {/* Background Grid Lines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Balanced reference zone (60 to 85) */}
        <rect
          x={padding.left}
          y={getY(85)}
          width={innerWidth}
          height={getY(60) - getY(85)}
          fill="#10b981"
          opacity="0.06"
          rx="4"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#trendGradient)" />

        {/* Trend Line */}
        <polyline
          fill="none"
          stroke="#0d9488"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points and labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.score);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="2.5"
              />
              {/* Score label on hover/static */}
              <text
                x={x}
                y={y - 10}
                fill="#0f766e"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {d.score}
              </text>
              {/* Date on X Axis */}
              <text
                x={x}
                y={height - 10}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {formatShortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '3px' }} />
          Balanced Zone (60–85)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#0d9488', borderRadius: '2px' }} />
          Personal Welfare Index
        </span>
      </div>
    </div>
  );
};
