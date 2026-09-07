/* ============================================
   API Endpoint Constants
   ============================================
   Centralized endpoint definitions.
   Backend developer: Update these if your route
   paths differ from the agreed contract.
   ============================================ */

export const ENDPOINTS = {
  HEALTH: '/api/health',
  PERSONNEL: '/api/personnel',
  PERSONNEL_BY_ID: (id) => `/api/personnel/${id}`,
  ALERTS: '/api/alerts',
  ANALYTICS_OFFICER: '/api/analytics/officer',
  ANALYTICS_UNIT: '/api/analytics/unit',
  PREDICTIONS: (id) => `/api/predictions/${id}`,
};
