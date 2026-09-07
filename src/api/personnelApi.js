/* ============================================
   Personnel API Service
   ============================================
   Expected API response format:
   
   GET /api/personnel
   Response: { data: [PersonnelSummary] }
   PersonnelSummary: {
     id: string,
     name: string,
     rank: string,
     unit: string,
     risk_level: 'low' | 'moderate' | 'elevated',
     risk_score: number,
     workload_indicator: number,
     deployment_days: number,
     deployment_indicator: string,
     last_assessment: string (ISO date),
     review_status: 'pending' | 'in_review' | 'reviewed'
   }
   
   GET /api/personnel/:id
   Response: { data: PersonnelDetail }
   PersonnelDetail extends PersonnelSummary with:
     deployment_summary, workload_summary, leave_summary,
     contributing_indicators, risk_trend, previous_assessments
   ============================================ */

import client, { USE_MOCK } from './client';
import { ENDPOINTS } from './endpoints';
import { personnelData, getPersonnelDetail } from '../mocks';

/**
 * Fetch all personnel.
 * @returns {Promise<Array>}
 */
export async function fetchPersonnel() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(personnelData), 300)
    );
  }
  const response = await client.get(ENDPOINTS.PERSONNEL);
  return response.data.data;
}

/**
 * Fetch personnel detail by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchPersonnelById(id) {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(getPersonnelDetail(id)), 200)
    );
  }
  const response = await client.get(ENDPOINTS.PERSONNEL_BY_ID(id));
  return response.data.data;
}
