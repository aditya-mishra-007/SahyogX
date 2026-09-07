/* ============================================
   Helper Utilities
   ============================================ */

import { RISK_LEVELS } from './constants';

/**
 * Get CSS variable name for a risk level color.
 * @param {string} level - Risk level
 * @returns {string} CSS variable
 */
export function getRiskColor(level) {
  switch (level) {
    case RISK_LEVELS.LOW:
      return 'var(--color-risk-low)';
    case RISK_LEVELS.MODERATE:
      return 'var(--color-risk-moderate)';
    case RISK_LEVELS.ELEVATED:
      return 'var(--color-risk-elevated)';
    default:
      return 'var(--color-text-tertiary)';
  }
}

/**
 * Get CSS variable name for a risk level background.
 * @param {string} level - Risk level
 * @returns {string} CSS variable
 */
export function getRiskBgColor(level) {
  switch (level) {
    case RISK_LEVELS.LOW:
      return 'var(--color-risk-low-bg)';
    case RISK_LEVELS.MODERATE:
      return 'var(--color-risk-moderate-bg)';
    case RISK_LEVELS.ELEVATED:
      return 'var(--color-risk-elevated-bg)';
    default:
      return 'var(--color-accent-bg)';
  }
}

/**
 * Get severity color.
 * @param {string} severity
 * @returns {string}
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return 'var(--color-risk-elevated)';
    case 'warning':
      return 'var(--color-risk-moderate)';
    case 'info':
      return 'var(--color-info)';
    default:
      return 'var(--color-text-tertiary)';
  }
}

/**
 * Sort an array by a key, supporting asc/desc.
 * @param {Array} arr
 * @param {string} key
 * @param {'asc'|'desc'} direction
 * @returns {Array}
 */
export function sortBy(arr, key, direction = 'asc') {
  return [...arr].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA == null) return 1;
    if (valB == null) return -1;
    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(valB);
      return direction === 'asc' ? cmp : -cmp;
    }
    return direction === 'asc' ? valA - valB : valB - valA;
  });
}

/**
 * Filter array by search term across specified keys.
 * @param {Array} arr
 * @param {string} search
 * @param {string[]} keys
 * @returns {Array}
 */
export function filterBySearch(arr, search, keys) {
  if (!search || !search.trim()) return arr;
  const term = search.toLowerCase().trim();
  return arr.filter(item =>
    keys.some(key => {
      const val = item[key];
      return val != null && String(val).toLowerCase().includes(term);
    })
  );
}

/**
 * Paginate an array.
 * @param {Array} arr
 * @param {number} page - 1-indexed
 * @param {number} pageSize
 * @returns {{ data: Array, totalPages: number, totalItems: number }}
 */
export function paginate(arr, page = 1, pageSize = 10) {
  const totalItems = arr.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const data = arr.slice(start, start + pageSize);
  return { data, totalPages, totalItems };
}

/**
 * Generate a random ID.
 * @returns {string}
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
