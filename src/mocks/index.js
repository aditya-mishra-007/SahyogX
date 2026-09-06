/* ============================================
   Mock Data Registry
   ============================================
   Central export point for all mock data.
   When backend APIs are ready, set USE_MOCK = false
   in src/api/client.js to bypass this layer.
   ============================================ */

export { personnelData, getPersonnelDetail } from './personnelData';
export { alertsData } from './alertsData';
export {
  riskDistribution,
  riskTrendData,
  workloadTrendData,
  dutyHourTrendData,
  deploymentTrendData,
  leaveTrendData,
} from './analyticsData';
export { unitsData, unitComparisonData } from './unitsData';
