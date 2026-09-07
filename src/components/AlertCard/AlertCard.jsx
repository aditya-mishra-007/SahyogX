import { Clock, User, MapPin, AlertTriangle } from 'lucide-react';
import { ALERT_STATUS } from '../../utils/constants';
import { formatRelativeTime, formatRiskScore } from '../../utils/formatters';
import { getSeverityColor } from '../../utils/helpers';
import styles from './AlertCard.module.css';

export default function AlertCard({ alert, onAcknowledge, onReview }) {
  const severityColor = getSeverityColor(alert.severity);

  const statusClass = {
    [ALERT_STATUS.ACTIVE]: styles.statusActive,
    [ALERT_STATUS.ACKNOWLEDGED]: styles.statusAcknowledged,
    [ALERT_STATUS.REVIEWED]: styles.statusReviewed,
  }[alert.status] || '';

  const statusLabel = {
    [ALERT_STATUS.ACTIVE]: 'Active',
    [ALERT_STATUS.ACKNOWLEDGED]: 'Acknowledged',
    [ALERT_STATUS.REVIEWED]: 'Reviewed',
  }[alert.status] || alert.status;

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

        <div className={styles.alertActions}>
          {alert.status === ALERT_STATUS.ACTIVE && onAcknowledge && (
            <button
              className={`${styles.btnAction} ${styles.btnPrimary}`}
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </button>
          )}
          {(alert.status === ALERT_STATUS.ACTIVE || alert.status === ALERT_STATUS.ACKNOWLEDGED) &&
            onReview && (
              <button className={styles.btnAction} onClick={() => onReview(alert.id)}>
                Mark as Reviewed
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
