/* ============================================
   Application Constants
   ============================================ */

export const RISK_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  ELEVATED: 'elevated',
};

export const RISK_LABELS = {
  [RISK_LEVELS.LOW]: 'Low Welfare Risk',
  [RISK_LEVELS.MODERATE]: 'Moderate Welfare Risk',
  [RISK_LEVELS.ELEVATED]: 'Elevated Welfare Risk',
};

export const RISK_SHORT_LABELS = {
  [RISK_LEVELS.LOW]: 'Low',
  [RISK_LEVELS.MODERATE]: 'Moderate',
  [RISK_LEVELS.ELEVATED]: 'Elevated',
};

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  REVIEWED: 'reviewed',
};

export const REVIEW_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  REVIEWED: 'reviewed',
};

export const ROLES = {
  WELFARE_OFFICER: 'welfare_officer',
  COMMANDER: 'commander',
};

export const ROLE_LABELS = {
  [ROLES.WELFARE_OFFICER]: 'Welfare Officer',
  [ROLES.COMMANDER]: 'Commander',
};

export const UNITS = [
  'Alpha Company',
  'Bravo Company',
  'Charlie Company',
  'Delta Company',
  'Echo Company',
  'HQ Battalion',
];

export const PAGE_SIZES = [10, 20, 50];

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  muted: '#94A3B8',
};
