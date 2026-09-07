import styles from './ChartCard.module.css';

export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div className={styles.chartBody}>{children}</div>
    </div>
  );
}
