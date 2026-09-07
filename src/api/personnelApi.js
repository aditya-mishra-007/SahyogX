/* ============================================
   Personnel API Service
   ============================================
   Uses real backend API (/api/v1/personnel) when authenticated.
   Falls back to mock data for unauthenticated development.

   Expected backend response format:
   GET /api/v1/personnel
   Response: { items: [PersonnelSummary], total, skip, limit }
   PersonnelSummary: {
     id: number,
     service_number: string,
     name: string,
     rank: string,
     unit: string,
     role: string,
     status: string,
   }
   ============================================ */

import { ENDPOINTS } from './endpoints';
import { personnelData, getPersonnelDetail } from '../mocks';
import { fetchPersonnelFromBackend, hasRealToken } from './dashboardApi';

/**
 * Transforms backend personnel into the shape expected by dashboard pages.
 * The dashboard pages use lowercase risk_level, review_status, etc.
 */
function transformBackendPersonnel(p) {
  return {
    id: String(p.id),
    name: p.name,
    rank: p.rank,
    unit: p.unit,
    service_number: p.service_number,
    // Backend doesn't yet return risk scores in the list endpoint —
    // the prediction service is separate. Provide safe defaults.
    risk_level: 'moderate',       // Placeholder: fetch from /api/v1/predictions/personnel/{id} for live data
    risk_score: 50,               // Placeholder
    workload_indicator: 50,       // Placeholder
    deployment_days: 0,           // Placeholder
    deployment_indicator: 'N/A',
    last_assessment: null,
    review_status: 'pending',
    status: p.status || 'ACTIVE',
  };
}

/**
 * Fetch all personnel.
 * Uses real backend API when authenticated; falls back to mock data otherwise.
 * @returns {Promise<Array>}
 */
export async function fetchPersonnel() {
  if (hasRealToken()) {
    try {
      const result = await fetchPersonnelFromBackend();
      return result.items.map(transformBackendPersonnel);
    } catch (err) {
      console.warn('[personnelApi] Backend call failed, using mock data:', err.message);
    }
  }

  // Mock fallback
  return new Promise((resolve) =>
    setTimeout(() => resolve(personnelData), 300)
  );
}

/**
 * Fetch personnel detail by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchPersonnelById(id) {
  // For individual detail, we currently use mock data
  // (full personnel detail endpoint integration can be added incrementally)
  return new Promise((resolve) =>
    setTimeout(() => resolve(getPersonnelDetail(id)), 200)
  );
}
