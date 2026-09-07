/* ============================================
   Analytics API Service
   ============================================
   Expected API response format:
   
   GET /api/analytics/officer
   Response: {
     risk_distribution: [{ name, value, fill }],
     risk_trend: [{ month, low, moderate, elevated }],
     workload_trend: [{ month, avg_workload, high_workload_count }],
     duty_hour_trend: [{ month, avg_hours, above_threshold }],
     deployment_trend: [{ month, avg_days, extended_count }],
     leave_trend: [{ month, avg_leave_days, low_leave_count }],
   }
   
   GET /api/analytics/unit
   Response: {
     units: [UnitData],
     unit_comparison: [{ name, risk_score, workload, deployment, leave }]
   }
   ============================================ */

import { USE_MOCK } from './client';
import {
  riskDistribution,
  riskTrendData,
  workloadTrendData,
  dutyHourTrendData,
  deploymentTrendData,
  leaveTrendData,
  unitsData,
  unitComparisonData,
} from '../mocks';

/**
 * Fetch officer-level analytics.
 * @returns {Promise<object>}
 */
export async function fetchOfficerAnalytics() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({
        risk_distribution: riskDistribution,
        risk_trend: riskTrendData,
        workload_trend: workloadTrendData,
        duty_hour_trend: dutyHourTrendData,
        deployment_trend: deploymentTrendData,
        leave_trend: leaveTrendData,
      }), 300)
    );
  }
  // const response = await client.get(ENDPOINTS.ANALYTICS_OFFICER);
  // return response.data;
  return {};
}

/**
 * Fetch unit-level analytics.
 * @returns {Promise<object>}
 */
export async function fetchUnitAnalytics() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({
        units: unitsData,
        unit_comparison: unitComparisonData,
      }), 300)
    );
  }
  // const response = await client.get(ENDPOINTS.ANALYTICS_UNIT);
  // return response.data;
  return {};
}
