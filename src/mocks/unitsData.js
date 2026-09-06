/* ============================================
   Mock Units Data
   ============================================
   This file contains mock data for development.
   Remove or disable when backend APIs are ready.
   ============================================ */

import { UNITS } from '../utils/constants';

export const unitsData = [
  {
    id: 'UNIT-01',
    name: UNITS[0],
    strength: 45,
    risk_distribution: { low: 28, moderate: 12, elevated: 5 },
    avg_risk_score: 38.2,
    avg_workload: 52,
    avg_deployment_days: 78,
    avg_leave_days: 10,
    active_alerts: 3,
    requires_attention: true,
  },
  {
    id: 'UNIT-02',
    name: UNITS[1],
    strength: 52,
    risk_distribution: { low: 35, moderate: 12, elevated: 5 },
    avg_risk_score: 34.5,
    avg_workload: 48,
    avg_deployment_days: 72,
    avg_leave_days: 11,
    active_alerts: 2,
    requires_attention: true,
  },
  {
    id: 'UNIT-03',
    name: UNITS[2],
    strength: 38,
    risk_distribution: { low: 28, moderate: 8, elevated: 2 },
    avg_risk_score: 28.1,
    avg_workload: 40,
    avg_deployment_days: 60,
    avg_leave_days: 14,
    active_alerts: 1,
    requires_attention: false,
  },
  {
    id: 'UNIT-04',
    name: UNITS[3],
    strength: 41,
    risk_distribution: { low: 22, moderate: 12, elevated: 7 },
    avg_risk_score: 45.3,
    avg_workload: 58,
    avg_deployment_days: 95,
    avg_leave_days: 7,
    active_alerts: 4,
    requires_attention: true,
  },
  {
    id: 'UNIT-05',
    name: UNITS[4],
    strength: 35,
    risk_distribution: { low: 25, moderate: 8, elevated: 2 },
    avg_risk_score: 26.7,
    avg_workload: 38,
    avg_deployment_days: 55,
    avg_leave_days: 15,
    active_alerts: 0,
    requires_attention: false,
  },
  {
    id: 'UNIT-06',
    name: UNITS[5],
    strength: 29,
    risk_distribution: { low: 18, moderate: 8, elevated: 3 },
    avg_risk_score: 35.8,
    avg_workload: 45,
    avg_deployment_days: 68,
    avg_leave_days: 12,
    active_alerts: 1,
    requires_attention: false,
  },
];

export const unitComparisonData = UNITS.map((name, i) => {
  const unit = unitsData[i];
  return {
    name: name.replace(' Company', '').replace('HQ ', ''),
    risk_score: unit.avg_risk_score,
    workload: unit.avg_workload,
    deployment: unit.avg_deployment_days,
    leave: unit.avg_leave_days,
  };
});
