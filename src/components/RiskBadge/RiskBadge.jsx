import { RISK_SHORT_LABELS, RISK_LEVELS } from '../../utils/constants';
import styles from './RiskBadge.module.css';

export default function RiskBadge({ level }) {
  const levelClass = {
    [RISK_LEVELS.LOW]: styles.low,
    [RISK_LEVELS.MODERATE]: styles.moderate,
    [RISK_LEVELS.ELEVATED]: styles.elevated,
  }[level] || styles.low;

  return (
    <span className={`${styles.badge} ${levelClass}`}>
      <span className={styles.dot} />
      {RISK_SHORT_LABELS[level] || level}
    </span>
  );
}
