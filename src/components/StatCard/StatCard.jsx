import styles from './StatCard.module.css';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'var(--color-accent)', bgColor = 'var(--color-accent-bg)' }) {
  return (
    <div className={styles.statCard}>
      {Icon && (
        <div className={styles.iconWrap} style={{ background: bgColor, color }}>
          <Icon size={22} />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {subtext && <div className={styles.subtext}>{subtext}</div>}
      </div>
    </div>
  );
}
