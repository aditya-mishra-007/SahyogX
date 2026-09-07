/* ============================================
   Alerts API Service
   ============================================
   Expected API response format:
   
   GET /api/alerts
   Response: { data: [Alert] }
   Alert: {
     id: string,
     severity: 'info' | 'warning' | 'critical',
     title: string,
     description: string,
     personnel_id: string | null,
     personnel_name: string | null,
     unit: string,
     risk_score: number | null,
     timestamp: string (ISO date),
     status: 'active' | 'acknowledged' | 'reviewed'
   }
   
   PUT /api/alerts/:id
   Body: { status: 'acknowledged' | 'reviewed' }
   Response: { data: Alert }
   ============================================ */

import { USE_MOCK } from './client';
import { alertsData } from '../mocks';

// Local mutable copy for mock status updates
let mockAlerts = [...alertsData];

/**
 * Fetch all alerts.
 * @returns {Promise<Array>}
 */
export async function fetchAlerts() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve([...mockAlerts]), 300)
    );
  }
  // const response = await client.get(ENDPOINTS.ALERTS);
  // return response.data.data;
  return [];
}

/**
 * Update alert status.
 * @param {string} id
 * @param {string} status - 'acknowledged' | 'reviewed'
 * @returns {Promise<object>}
 */
export async function updateAlertStatus(id, status) {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      mockAlerts = mockAlerts.map(a =>
        a.id === id ? { ...a, status } : a
      );
      const updated = mockAlerts.find(a => a.id === id);
      setTimeout(() => resolve(updated), 200);
    });
  }
  // const response = await client.put(`${ENDPOINTS.ALERTS}/${id}`, { status });
  // return response.data.data;
  return null;
}

/**
 * Reset mock alerts (for development).
 */
export function resetMockAlerts() {
  mockAlerts = [...alertsData];
}
