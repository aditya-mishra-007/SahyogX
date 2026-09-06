/* ============================================
   Mock Personnel Data
   ============================================
   This file contains mock data for development.
   Remove or disable when backend APIs are ready.
   ============================================ */

import { RISK_LEVELS, REVIEW_STATUS, UNITS } from '../utils/constants';

const baseDate = new Date('2026-09-01');

function daysAgo(days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const personnelData = [
  {
    id: 'PER-001',
    name: 'Subedar Rajesh Kumar',
    rank: 'Subedar',
    unit: UNITS[0],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 18.2,
    workload_indicator: 32,
    deployment_days: 45,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(3),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 12,
    duty_hours_avg: 8.5,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-002',
    name: 'Havildar Amit Singh',
    rank: 'Havildar',
    unit: UNITS[1],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 55.8,
    workload_indicator: 68,
    deployment_days: 120,
    deployment_indicator: 'extended',
    last_assessment: daysAgo(7),
    review_status: REVIEW_STATUS.IN_REVIEW,
    leave_days_last_6m: 5,
    duty_hours_avg: 11.2,
    consecutive_deployments: 3,
  },
  {
    id: 'PER-003',
    name: 'Naik Pradeep Yadav',
    rank: 'Naik',
    unit: UNITS[0],
    risk_level: RISK_LEVELS.ELEVATED,
    risk_score: 78.4,
    workload_indicator: 85,
    deployment_days: 180,
    deployment_indicator: 'prolonged',
    last_assessment: daysAgo(1),
    review_status: REVIEW_STATUS.PENDING,
    leave_days_last_6m: 2,
    duty_hours_avg: 13.5,
    consecutive_deployments: 4,
  },
  {
    id: 'PER-004',
    name: 'Sepoy Vikram Mehra',
    rank: 'Sepoy',
    unit: UNITS[2],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 12.1,
    workload_indicator: 28,
    deployment_days: 30,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(5),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 18,
    duty_hours_avg: 7.5,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-005',
    name: 'Havildar Suresh Patil',
    rank: 'Havildar',
    unit: UNITS[3],
    risk_level: RISK_LEVELS.ELEVATED,
    risk_score: 82.7,
    workload_indicator: 91,
    deployment_days: 210,
    deployment_indicator: 'prolonged',
    last_assessment: daysAgo(2),
    review_status: REVIEW_STATUS.PENDING,
    leave_days_last_6m: 0,
    duty_hours_avg: 14.0,
    consecutive_deployments: 5,
  },
  {
    id: 'PER-006',
    name: 'Naik Deepak Chandra',
    rank: 'Naik',
    unit: UNITS[1],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 48.3,
    workload_indicator: 60,
    deployment_days: 95,
    deployment_indicator: 'extended',
    last_assessment: daysAgo(10),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 8,
    duty_hours_avg: 10.0,
    consecutive_deployments: 2,
  },
  {
    id: 'PER-007',
    name: 'Sepoy Manoj Tiwari',
    rank: 'Sepoy',
    unit: UNITS[4],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 22.5,
    workload_indicator: 35,
    deployment_days: 60,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(4),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 15,
    duty_hours_avg: 8.0,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-008',
    name: 'Subedar Major Ramesh Nair',
    rank: 'Subedar Major',
    unit: UNITS[5],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 52.1,
    workload_indicator: 65,
    deployment_days: 105,
    deployment_indicator: 'extended',
    last_assessment: daysAgo(6),
    review_status: REVIEW_STATUS.IN_REVIEW,
    leave_days_last_6m: 6,
    duty_hours_avg: 10.5,
    consecutive_deployments: 2,
  },
  {
    id: 'PER-009',
    name: 'Sepoy Arjun Reddy',
    rank: 'Sepoy',
    unit: UNITS[2],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 15.8,
    workload_indicator: 25,
    deployment_days: 40,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(8),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 20,
    duty_hours_avg: 7.0,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-010',
    name: 'Havildar Sanjay Gupta',
    rank: 'Havildar',
    unit: UNITS[3],
    risk_level: RISK_LEVELS.ELEVATED,
    risk_score: 74.9,
    workload_indicator: 80,
    deployment_days: 165,
    deployment_indicator: 'prolonged',
    last_assessment: daysAgo(1),
    review_status: REVIEW_STATUS.PENDING,
    leave_days_last_6m: 3,
    duty_hours_avg: 12.5,
    consecutive_deployments: 4,
  },
  {
    id: 'PER-011',
    name: 'Naik Ravi Shankar',
    rank: 'Naik',
    unit: UNITS[4],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 20.3,
    workload_indicator: 30,
    deployment_days: 55,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(9),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 14,
    duty_hours_avg: 8.2,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-012',
    name: 'Sepoy Karan Malhotra',
    rank: 'Sepoy',
    unit: UNITS[0],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 45.6,
    workload_indicator: 58,
    deployment_days: 85,
    deployment_indicator: 'extended',
    last_assessment: daysAgo(12),
    review_status: REVIEW_STATUS.IN_REVIEW,
    leave_days_last_6m: 7,
    duty_hours_avg: 9.8,
    consecutive_deployments: 2,
  },
  {
    id: 'PER-013',
    name: 'Havildar Prakash Joshi',
    rank: 'Havildar',
    unit: UNITS[5],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 19.7,
    workload_indicator: 33,
    deployment_days: 50,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(6),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 16,
    duty_hours_avg: 8.0,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-014',
    name: 'Naik Anil Verma',
    rank: 'Naik',
    unit: UNITS[2],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 51.2,
    workload_indicator: 62,
    deployment_days: 110,
    deployment_indicator: 'extended',
    last_assessment: daysAgo(4),
    review_status: REVIEW_STATUS.PENDING,
    leave_days_last_6m: 4,
    duty_hours_avg: 11.0,
    consecutive_deployments: 3,
  },
  {
    id: 'PER-015',
    name: 'Sepoy Dinesh Rawat',
    rank: 'Sepoy',
    unit: UNITS[1],
    risk_level: RISK_LEVELS.ELEVATED,
    risk_score: 71.3,
    workload_indicator: 78,
    deployment_days: 150,
    deployment_indicator: 'prolonged',
    last_assessment: daysAgo(2),
    review_status: REVIEW_STATUS.PENDING,
    leave_days_last_6m: 1,
    duty_hours_avg: 13.0,
    consecutive_deployments: 4,
  },
  {
    id: 'PER-016',
    name: 'Subedar Harish Bhatt',
    rank: 'Subedar',
    unit: UNITS[3],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 14.5,
    workload_indicator: 22,
    deployment_days: 35,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(7),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 22,
    duty_hours_avg: 7.5,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-017',
    name: 'Sepoy Nitin Sharma',
    rank: 'Sepoy',
    unit: UNITS[4],
    risk_level: RISK_LEVELS.MODERATE,
    risk_score: 42.8,
    workload_indicator: 55,
    deployment_days: 75,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(11),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 9,
    duty_hours_avg: 9.5,
    consecutive_deployments: 2,
  },
  {
    id: 'PER-018',
    name: 'Naik Govind Das',
    rank: 'Naik',
    unit: UNITS[5],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 16.9,
    workload_indicator: 27,
    deployment_days: 42,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(5),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 17,
    duty_hours_avg: 7.8,
    consecutive_deployments: 1,
  },
  {
    id: 'PER-019',
    name: 'Havildar Mohan Lal',
    rank: 'Havildar',
    unit: UNITS[0],
    risk_level: RISK_LEVELS.ELEVATED,
    risk_score: 76.1,
    workload_indicator: 82,
    deployment_days: 175,
    deployment_indicator: 'prolonged',
    last_assessment: daysAgo(1),
    review_status: REVIEW_STATUS.IN_REVIEW,
    leave_days_last_6m: 2,
    duty_hours_avg: 13.2,
    consecutive_deployments: 5,
  },
  {
    id: 'PER-020',
    name: 'Sepoy Rohit Kapoor',
    rank: 'Sepoy',
    unit: UNITS[1],
    risk_level: RISK_LEVELS.LOW,
    risk_score: 21.4,
    workload_indicator: 31,
    deployment_days: 48,
    deployment_indicator: 'normal',
    last_assessment: daysAgo(3),
    review_status: REVIEW_STATUS.REVIEWED,
    leave_days_last_6m: 13,
    duty_hours_avg: 8.3,
    consecutive_deployments: 1,
  },
];

/**
 * Get detailed personnel info with additional fields.
 * @param {string} id
 * @returns {object|null}
 */
export function getPersonnelDetail(id) {
  const person = personnelData.find(p => p.id === id);
  if (!person) return null;

  return {
    ...person,
    deployment_summary: {
      total_deployments: person.consecutive_deployments + 1,
      current_deployment_days: person.deployment_days,
      last_rotation: daysAgo(person.deployment_days),
      deployment_type: person.deployment_indicator,
    },
    workload_summary: {
      avg_duty_hours: person.duty_hours_avg,
      workload_score: person.workload_indicator,
      overtime_days_last_month: Math.floor(person.workload_indicator / 10),
    },
    leave_summary: {
      leave_days_last_6m: person.leave_days_last_6m,
      leave_balance: Math.max(0, 30 - person.leave_days_last_6m),
      last_leave_date: daysAgo(30 + Math.floor(Math.random() * 60)),
    },
    contributing_indicators: generateContributingIndicators(person),
    risk_trend: generateRiskTrend(person.risk_score),
    previous_assessments: generatePreviousAssessments(person),
  };
}

function generateContributingIndicators(person) {
  const indicators = [];
  if (person.workload_indicator > 60) {
    indicators.push({ factor: 'Workload Score', value: person.workload_indicator, impact: 'high' });
  }
  if (person.deployment_days > 90) {
    indicators.push({ factor: 'Extended Deployment', value: `${person.deployment_days} days`, impact: 'high' });
  }
  if (person.leave_days_last_6m < 5) {
    indicators.push({ factor: 'Low Leave Utilization', value: `${person.leave_days_last_6m} days`, impact: 'moderate' });
  }
  if (person.duty_hours_avg > 10) {
    indicators.push({ factor: 'Elevated Duty Hours', value: `${person.duty_hours_avg}h avg`, impact: 'moderate' });
  }
  if (person.consecutive_deployments > 2) {
    indicators.push({ factor: 'Consecutive Deployments', value: person.consecutive_deployments, impact: 'high' });
  }
  if (indicators.length === 0) {
    indicators.push({ factor: 'All Indicators Normal', value: '—', impact: 'low' });
  }
  return indicators;
}

function generateRiskTrend(currentScore) {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return months.map((month, i) => {
    const variation = (Math.random() - 0.4) * 15;
    const score = Math.max(5, Math.min(95, currentScore + variation - (6 - i) * 3));
    return { month, score: parseFloat(score.toFixed(1)) };
  });
}

function generatePreviousAssessments(person) {
  return [
    { date: daysAgo(30), risk_score: Math.max(5, person.risk_score - 8), status: 'reviewed' },
    { date: daysAgo(60), risk_score: Math.max(5, person.risk_score - 15), status: 'reviewed' },
    { date: daysAgo(90), risk_score: Math.max(5, person.risk_score - 20), status: 'reviewed' },
  ];
}


