/**
 * SahyogX Command Dashboard — Authenticated Backend API Bridge
 *
 * Provides authenticated calls to real FastAPI backend endpoints for
 * the Command Dashboard (Officer and Commander views).
 *
 * Replaces the old mock-only alertsApi.js / analyticsApi.js / personnelApi.js
 * with real JWT-authenticated requests.
 *
 * Token is read from sessionStorage (same key as api.ts: 'sahyogx_token').
 */

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'sahyogx_token';

/** Helper: returns Authorization headers if a valid token exists */
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token || token.startsWith('mock-token-')) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/** Helper: returns true if the current session has a real (non-mock) backend token */
export function hasRealToken(): boolean {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return !!token && !token.startsWith('mock-token-');
}

/** Generic authenticated GET request */
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(`API ${res.status}: ${detail?.detail || 'Request failed'}`);
  }
  return res.json() as Promise<T>;
}

/** Generic authenticated POST request */
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(`API ${res.status}: ${detail?.detail || 'Request failed'}`);
  }
  return res.json() as Promise<T>;
}

/** Generic authenticated PATCH request */
async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(`API ${res.status}: ${detail?.detail || 'Request failed'}`);
  }
  return res.json() as Promise<T>;
}

// =============================================================================
// PERSONNEL
// =============================================================================

export interface BackendPersonnelSummary {
  id: number;
  service_number: string;
  name: string;
  rank: string;
  unit: string;
  role: string;
  status: string;
}

export interface PersonnelListResult {
  items: BackendPersonnelSummary[];
  total: number;
  skip: number;
  limit: number;
}

/** Fetch paginated personnel list — COMMANDER and MEDICAL_OFFICER only */
export async function fetchPersonnelFromBackend(
  unit?: string,
  skip = 0,
  limit = 50
): Promise<PersonnelListResult> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (unit) params.set('unit', unit);
  return apiGet<PersonnelListResult>(`/api/v1/personnel?${params}`);
}

// =============================================================================
// PREDICTIONS
// =============================================================================

export interface StressPrediction {
  personnel_id: number;
  service_number: string;
  risk_score: number;
  risk_category: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  prediction_source: string;
  model_name: string;
  confidence_score: number;
  predicted_at: string;
  primary_risk_factors: { factor_name: string; impact_level: string; description: string; score_contribution: number }[];
}

export interface UnitRiskSummary {
  unit: string;
  total_evaluated: number;
  low_risk_count: number;
  moderate_risk_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  unit_average_risk_score: number;
  personnel_predictions: StressPrediction[];
}

/** Predict unit stress risk — COMMANDER and MEDICAL_OFFICER only */
export async function fetchUnitPrediction(unit: string): Promise<UnitRiskSummary> {
  const encoded = encodeURIComponent(unit);
  return apiGet<UnitRiskSummary>(`/api/v1/predictions/unit/${encoded}`);
}

/** Get individual personnel stress prediction */
export async function fetchPersonnelPrediction(personnelId: number): Promise<StressPrediction> {
  return apiGet<StressPrediction>(`/api/v1/predictions/personnel/${personnelId}`);
}

/** Get ML engine status */
export async function fetchModelStatus() {
  return apiGet('/api/v1/predictions/model-status');
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface UnitHeatmapItemBackend {
  unit: string;
  total_personnel: number;
  average_risk_score: number;
  risk_level: string;
  active_alerts_count: number;
  critical_alerts_count: number;
  risk_breakdown: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  high_risk_percentage: number;
}

export interface UnitHeatmapData {
  units: UnitHeatmapItemBackend[];
  force_total_personnel?: number;
  force_average_risk_score?: number;
  most_vulnerable_unit?: string | null;
  total_units?: number;
  highest_risk_unit?: string | null;
}

export interface TheatreRiskData {
  theatres: {
    location: string;
    deployment_type: string;
    operational_intensity: string;
    personnel_count: number;
    avg_risk_score: number;
  }[];
}

export interface UnitWelfareSummary {
  unit: string;
  total_personnel: number;
  avg_duty_hours: number;
  night_sentry_count: number;
  leave_deprivation_rate: number;
  open_alert_count: number;
}

/** Get force-wide stress heatmap — COMMANDER and MEDICAL_OFFICER only */
export async function fetchAnalyticsHeatmap(): Promise<UnitHeatmapData> {
  return apiGet<UnitHeatmapData>('/api/v1/analytics/heatmap');
}

/** Get operational theatre risk analytics */
export async function fetchAnalyticsTheatres(): Promise<TheatreRiskData> {
  return apiGet<TheatreRiskData>('/api/v1/analytics/theatres');
}

/** Get unit welfare deep-dive summary */
export async function fetchUnitWelfareSummary(unit: string): Promise<UnitWelfareSummary> {
  const encoded = encodeURIComponent(unit);
  return apiGet<UnitWelfareSummary>(`/api/v1/analytics/unit/${encoded}/summary`);
}

// =============================================================================
// ALERTS
// =============================================================================

export interface BackendAlert {
  id: number;
  personnel_id: number;
  risk_score: number;
  risk_category: string;
  trigger_type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  recommended_action: string | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  personnel_name: string | null;
  personnel_service_number: string | null;
  personnel_rank: string | null;
  personnel_unit: string | null;
  interventions: string[];
}

export interface AlertListResult {
  items: BackendAlert[];
  total: number;
  skip: number;
  limit: number;
}

/** Fetch alerts — COMMANDER and MEDICAL_OFFICER only */
export async function fetchAlertsFromBackend(
  params?: { unit?: string; personnel_id?: number; status?: string; severity?: string }
): Promise<AlertListResult> {
  const qp = new URLSearchParams({ skip: '0', limit: '50' });
  if (params?.unit) qp.set('unit', params.unit);
  if (params?.personnel_id) qp.set('personnel_id', String(params.personnel_id));
  if (params?.status) qp.set('status', params.status);
  if (params?.severity) qp.set('severity', params.severity);
  return apiGet<AlertListResult>(`/api/v1/alerts?${qp}`);
}

/** Trigger EWS automated scan */
export async function triggerAlertScan(minRiskThreshold = 0.5): Promise<{ alerts_generated: number; personnel_scanned: number }> {
  return apiPost('/api/v1/alerts/scan', { min_risk_threshold: minRiskThreshold });
}

/** Resolve an alert */
export async function resolveAlert(
  alertId: number,
  data: { action_taken: string; resolution_notes: string; status: string }
): Promise<BackendAlert> {
  return apiPost<BackendAlert>(`/api/v1/alerts/${alertId}/resolve`, data);
}

/** Update alert status (acknowledge or resolve) */
export async function updateAlertStatusBackend(
  alertId: number,
  status: 'ACKNOWLEDGED' | 'RESOLVED' | 'NEW'
): Promise<BackendAlert> {
  if (status === 'RESOLVED') {
    return resolveAlert(alertId, {
      action_taken: 'Welfare and operational mitigation review completed',
      resolution_notes: 'Reviewed and resolved via command dashboard',
      status: 'RESOLVED',
    });
  }
  return apiPatch<BackendAlert>(`/api/v1/alerts/${alertId}/status`, { status });
}

// =============================================================================
// AUDIT (Commander only)
// =============================================================================

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_role: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
}

export interface AuditLogListResult {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
}

/** Fetch audit logs — COMMANDER only */
export async function fetchAuditLogs(page = 1, pageSize = 50): Promise<AuditLogListResult> {
  return apiGet<AuditLogListResult>(`/api/v1/audit/logs?page=${page}&page_size=${pageSize}`);
}
