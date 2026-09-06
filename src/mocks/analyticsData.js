/* ============================================
   Mock Analytics Data
   ============================================
   This file contains mock data for development.
   Remove or disable when backend APIs are ready.
   ============================================ */

export const riskDistribution = [
  { name: 'Low Welfare Risk', value: 10, fill: '#22C55E' },
  { name: 'Moderate Welfare Risk', value: 6, fill: '#F59E0B' },
  { name: 'Elevated Welfare Risk', value: 4, fill: '#EF4444' },
];

export const riskTrendData = [
  { month: 'Mar', low: 12, moderate: 5, elevated: 3 },
  { month: 'Apr', low: 11, moderate: 6, elevated: 3 },
  { month: 'May', low: 10, moderate: 6, elevated: 4 },
  { month: 'Jun', low: 11, moderate: 5, elevated: 4 },
  { month: 'Jul', low: 10, moderate: 6, elevated: 4 },
  { month: 'Aug', low: 10, moderate: 6, elevated: 4 },
  { month: 'Sep', low: 10, moderate: 6, elevated: 4 },
];

export const workloadTrendData = [
  { month: 'Mar', avg_workload: 42, high_workload_count: 5 },
  { month: 'Apr', avg_workload: 45, high_workload_count: 6 },
  { month: 'May', avg_workload: 48, high_workload_count: 7 },
  { month: 'Jun', avg_workload: 46, high_workload_count: 6 },
  { month: 'Jul', avg_workload: 50, high_workload_count: 8 },
  { month: 'Aug', avg_workload: 52, high_workload_count: 8 },
  { month: 'Sep', avg_workload: 49, high_workload_count: 7 },
];

export const dutyHourTrendData = [
  { month: 'Mar', avg_hours: 8.8, above_threshold: 4 },
  { month: 'Apr', avg_hours: 9.1, above_threshold: 5 },
  { month: 'May', avg_hours: 9.5, above_threshold: 6 },
  { month: 'Jun', avg_hours: 9.3, above_threshold: 5 },
  { month: 'Jul', avg_hours: 9.7, above_threshold: 7 },
  { month: 'Aug', avg_hours: 10.0, above_threshold: 7 },
  { month: 'Sep', avg_hours: 9.6, above_threshold: 6 },
];

export const deploymentTrendData = [
  { month: 'Mar', avg_days: 65, extended_count: 3 },
  { month: 'Apr', avg_days: 72, extended_count: 4 },
  { month: 'May', avg_days: 78, extended_count: 5 },
  { month: 'Jun', avg_days: 80, extended_count: 5 },
  { month: 'Jul', avg_days: 85, extended_count: 6 },
  { month: 'Aug', avg_days: 88, extended_count: 6 },
  { month: 'Sep', avg_days: 82, extended_count: 5 },
];

export const leaveTrendData = [
  { month: 'Mar', avg_leave_days: 12, low_leave_count: 3 },
  { month: 'Apr', avg_leave_days: 11, low_leave_count: 4 },
  { month: 'May', avg_leave_days: 10, low_leave_count: 5 },
  { month: 'Jun', avg_leave_days: 9, low_leave_count: 5 },
  { month: 'Jul', avg_leave_days: 8, low_leave_count: 6 },
  { month: 'Aug', avg_leave_days: 8, low_leave_count: 7 },
  { month: 'Sep', avg_leave_days: 9, low_leave_count: 6 },
];
