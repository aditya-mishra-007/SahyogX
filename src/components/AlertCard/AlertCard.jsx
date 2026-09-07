import { useState } from 'react';
import { Clock, User, MapPin, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { ALERT_STATUS } from '../../utils/constants';
import { formatRelativeTime, formatRiskScore } from '../../utils/formatters';
import { getSeverityColor } from '../../utils/helpers';
import styles from './AlertCard.module.css';

export default function AlertCard({ alert, onAcknowledge, onReview }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const severityColor = getSeverityColor(alert.severity);

  const isReviewed = alert.status === ALERT_STATUS.REVIEWED || alert.status === 'reviewed' || alert.status === 'resolved';
  const isAcknowledged = alert.status === ALERT_STATUS.ACKNOWLEDGED || alert.status === 'acknowledged' || alert.status === 'in_review';
  const isActive = (!isReviewed && !isAcknowledged) || alert.status === ALERT_STATUS.ACTIVE || alert.status === 'active' || alert.status === 'new';

  let statusClass = styles.statusActive;
  let statusLabel = 'Active';

  if (isReviewed) {
    statusClass = styles.statusReviewed;
    statusLabel = 'Resolved';
  } else if (isAcknowledged) {
    statusClass = styles.statusAcknowledged;
    statusLabel = 'Acknowledged';
  }

  const handleActionClick = async (actionType, fn) => {
    if (!fn || loadingAction) return;
    setLoadingAction(actionType);
    try {
      await fn(alert.id);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={styles.alertCard}>
      <div className={styles.severityStrip} style={{ background: severityColor }} />
      <div className={styles.alertContent}>
        <div className={styles.alertTop}>
          <h4 className={styles.alertTitle}>{alert.title}</h4>
          <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
        </div>

        <div className={styles.alertMeta}>
          <span className={styles.alertMetaItem}>
            <Clock size={12} />
            {formatRelativeTime(alert.timestamp)}
          </span>
          {alert.personnel_name && (
            <span className={styles.alertMetaItem}>
              <User size={12} />
              {alert.personnel_name}
            </span>
          )}
          <span className={styles.alertMetaItem}>
            <MapPin size={12} />
            {alert.unit}
          </span>
          {alert.risk_score != null && (
            <span className={styles.alertMetaItem}>
              <AlertTriangle size={12} />
              Risk Score: {formatRiskScore(alert.risk_score)}
            </span>
          )}
        </div>

        <p className={styles.alertDesc}>{alert.description}</p>

        {alert.recommended_action && (
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-accent)',
            marginBottom: 'var(--space-3)',
            background: 'var(--color-accent-bg)',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block',
          }}>
            <strong>Recommended Action:</strong> {alert.recommended_action}
          </p>
        )}

        <div className={styles.alertActions}>
          {isActive && onAcknowledge && (
            <button
              className={`${styles.btnAction} ${styles.btnPrimary}`}
              disabled={loadingAction !== null}
              onClick={() => handleActionClick('ack', onAcknowledge)}
            >
              {loadingAction === 'ack' ? 'Updating...' : 'Acknowledge'}
            </button>
          )}

          {(isActive || isAcknowledged) && onReview && (
            <button
              className={`${styles.btnAction} ${isActive ? '' : styles.btnPrimary}`}
              disabled={loadingAction !== null}
              onClick={() => handleActionClick('review', onReview)}
              style={isActive ? { border: '1px solid var(--color-risk-low)', color: 'var(--color-risk-low)' } : {}}
            >
              {loadingAction === 'review' ? 'Resolving...' : '✓ Resolve Alert'}
            </button>
          )}

          {isReviewed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-risk-low)',
              fontWeight: 600,
            }}>
              <CheckCircle size={14} />
              <span>Resolved & Mitigated</span>
              {alert.resolved_by && (
                <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                  ({alert.resolved_by})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
