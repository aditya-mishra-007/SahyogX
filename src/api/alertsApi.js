/* ============================================
   Alerts API Service
   ============================================
   Uses the real backend API (/api/v1/alerts) when a valid JWT token
   is present in sessionStorage. Falls back to mock data only when no
   authenticated backend session exists (development without backend).

   Expected API response format:

   GET /api/v1/alerts
   Response: { items: [Alert], total, skip, limit }
   Alert: {
     id: number,
     severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
     title: string,
     description: string,
     personnel_id: number | null,
     personnel_name: string | null,
     personnel_unit: string | null,
     risk_score: number | null,
     created_at: string (ISO date),
     status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
   }
   ============================================ */

import { alertsData } from '../mocks';
import { fetchAlertsFromBackend, updateAlertStatusBackend, hasRealToken } from './dashboardApi';

// Local mutable copy for mock status updates (used in fallback mode only)
let mockAlerts = [...alertsData];

/**
 * Normalizes backend alert statuses into the standard frontend lifecycle:
 *   - 'NEW' | 'ACTIVE'               → 'active'
 *   - 'ACKNOWLEDGED' | 'IN_REVIEW'   → 'acknowledged'
 *   - 'RESOLVED' | 'REVIEWED'        → 'reviewed'
 */
function normalizeAlertStatus(status) {
  if (!status) return 'active';
  const s = String(status).toUpperCase();
  if (s === 'NEW' || s === 'ACTIVE') return 'active';
  if (s === 'ACKNOWLEDGED' || s === 'IN_REVIEW') return 'acknowledged';
  if (s === 'RESOLVED' || s === 'REVIEWED' || s === 'DISMISSED') return 'reviewed';
  return s.toLowerCase();
}

/**
 * Transforms backend alert format to the shape expected by the dashboard pages.
 */
function transformBackendAlert(a) {
  return {
    id: String(a.id),
    severity: (a.severity || 'LOW').toLowerCase(),
    title: a.title,
    description: a.description,
    personnel_id: a.personnel_id ? String(a.personnel_id) : null,
    personnel_name: a.personnel_name || null,
    unit: a.personnel_unit || null,
    risk_score: a.risk_score || null,
    timestamp: a.created_at,
    status: normalizeAlertStatus(a.status),
    raw_status: a.status || 'NEW',
    recommended_action: a.recommended_action || null,
    resolved_by: a.resolved_by || null,
    resolution_notes: a.resolution_notes || null,
  };
}

// In-memory cache & request deduplication for alerts
let cachedAlerts = null;
let cachedAlertsTime = 0;
let inFlightAlertsPromise = null;

/**
 * Invalidate the alerts cache.
 */
export function invalidateAlertsCache() {
  cachedAlerts = null;
  cachedAlertsTime = 0;
}

/**
 * Fetch all alerts.
 * Uses real backend API when authenticated; falls back to mock data otherwise.
 * Deduplicates concurrent requests and caches response for 20 seconds.
 * @param {boolean} forceRefresh
 * @returns {Promise<Array>}
 */
export async function fetchAlerts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAlerts && (now - cachedAlertsTime < 20000)) {
    return [...cachedAlerts];
  }

  if (hasRealToken()) {
    try {
      if (!inFlightAlertsPromise) {
        inFlightAlertsPromise = fetchAlertsFromBackend()
          .then(result => {
            const transformed = result.items.map(transformBackendAlert);
            cachedAlerts = transformed;
            cachedAlertsTime = Date.now();
            inFlightAlertsPromise = null;
            return transformed;
          })
          .catch(err => {
            inFlightAlertsPromise = null;
            throw err;
          });
      }
      const items = await inFlightAlertsPromise;
      return [...items];
    } catch (err) {
      console.warn('[alertsApi] Backend call failed, using mock data:', err.message);
      // Fall through to mock
    }
  }

  // Mock fallback
  return new Promise((resolve) =>
    setTimeout(() => resolve([...mockAlerts]), 100)
  );
}

/**
 * Acknowledge or review an alert.
 * @param {string} id - Alert ID
 * @param {string} status - 'acknowledged' | 'reviewed' | 'resolved'
 * @returns {Promise<object>}
 */
export async function updateAlertStatus(id, status) {
  const normStatus = normalizeAlertStatus(status);

  // Optimistically update cache for instant UI response
  if (cachedAlerts) {
    cachedAlerts = cachedAlerts.map(a =>
      String(a.id) === String(id) ? { ...a, status: normStatus } : a
    );
  }

  if (hasRealToken()) {
    try {
      // Map frontend status strings to backend enum values
      const backendStatus = (normStatus === 'reviewed') ? 'RESOLVED' : 'ACKNOWLEDGED';
      const updated = await updateAlertStatusBackend(Number(id), backendStatus);
      const transformed = transformBackendAlert(updated);
      if (cachedAlerts) {
        cachedAlerts = cachedAlerts.map(a =>
          String(a.id) === String(id) ? transformed : a
        );
      }
      return transformed;
    } catch (err) {
      console.warn('[alertsApi] Update failed, falling back to local state:', err.message);
    }
  }

  // Mock / local fallback
  return new Promise((resolve) => {
    mockAlerts = mockAlerts.map(a =>
      String(a.id) === String(id) ? { ...a, status: normStatus } : a
    );
    const updated = mockAlerts.find(a => String(a.id) === String(id));
    setTimeout(() => resolve(updated || { id: String(id), status: normStatus }), 100);
  });
}

/**
 * Reset mock alerts (for development).
 */
export function resetMockAlerts() {
  mockAlerts = [...alertsData];
}
