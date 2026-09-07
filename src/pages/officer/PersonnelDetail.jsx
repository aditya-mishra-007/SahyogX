import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, MapPin, Calendar, Clock, Briefcase, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import Header from '../../components/Header/Header';
import RiskBadge from '../../components/RiskBadge/RiskBadge';
import ChartCard from '../../components/ChartCard/ChartCard';
import { fetchPersonnelById } from '../../api/personnelApi';
import { formatDate, formatRiskScore } from '../../utils/formatters';
import { getRiskColor } from '../../utils/helpers';
import { CHART_COLORS } from '../../utils/constants';
import styles from '../Pages.module.css';

export default function PersonnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    fetchPersonnelById(id).then(setPerson);
  }, [id]);

  if (!person) {
    return (
      <>
        <Header title="Personnel Detail" />
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          Loading...
        </div>
      </>
    );
  }

  const riskColor = getRiskColor(person.risk_level);

  return (
    <>
      <Header
        title="Personnel Detail"
        breadcrumbs={[
          { label: 'Dashboard', to: '/officer' },
          { label: 'Personnel', to: '/officer/personnel' },
          { label: person.id },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        <button className={styles.backLink} onClick={() => navigate('/officer/personnel')}>
          <ArrowLeft size={16} /> Back to Personnel List
        </button>

        {/* Personnel Header */}
        <div className={styles.riskHeader}>
          <div className={styles.riskHeaderInfo}>
            <h2 className={styles.riskHeaderName}>{person.name}</h2>
            <div className={styles.riskHeaderMeta}>
              <span><User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{person.rank}</span>
              <span><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{person.unit}</span>
              <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />ID: {person.id}</span>
              <RiskBadge level={person.risk_level} />
            </div>
          </div>
          <div className={styles.riskScoreLarge}>
            <div className={styles.riskScoreValue} style={{ color: riskColor }}>
              {formatRiskScore(person.risk_score)}
            </div>
            <div className={styles.riskScoreLabel}>Welfare Risk Score</div>
          </div>
        </div>

        {/* Detail Grid */}
        <div className={styles.detailGrid}>
          {/* Deployment Summary */}
          <div className={styles.detailCard}>
            <h3 className={styles.detailCardTitle}>
              <Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Deployment Summary
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Current Deployment</span>
              <span className={styles.detailValue}>{person.deployment_summary.current_deployment_days} days</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Deployments</span>
              <span className={styles.detailValue}>{person.deployment_summary.total_deployments}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Deployment Type</span>
              <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>{person.deployment_summary.deployment_type}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Rotation</span>
              <span className={styles.detailValue}>{formatDate(person.deployment_summary.last_rotation)}</span>
            </div>
          </div>

          {/* Workload Summary */}
          <div className={styles.detailCard}>
            <h3 className={styles.detailCardTitle}>
              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Workload Summary
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Avg Duty Hours</span>
              <span className={styles.detailValue}>{person.workload_summary.avg_duty_hours}h</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Workload Score</span>
              <span className={styles.detailValue}>{person.workload_summary.workload_score}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Overtime Days (Last Month)</span>
              <span className={styles.detailValue}>{person.workload_summary.overtime_days_last_month}</span>
            </div>
          </div>

          {/* Leave Summary */}
          <div className={styles.detailCard}>
            <h3 className={styles.detailCardTitle}>
              <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Leave / Recovery Summary
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Leave Taken (6 Months)</span>
              <span className={styles.detailValue}>{person.leave_summary.leave_days_last_6m} days</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Leave Balance</span>
              <span className={styles.detailValue}>{person.leave_summary.leave_balance} days</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Leave Date</span>
              <span className={styles.detailValue}>{formatDate(person.leave_summary.last_leave_date)}</span>
            </div>
          </div>

          {/* Contributing Indicators */}
          <div className={styles.detailCard}>
            <h3 className={styles.detailCardTitle}>
              <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Contributing Indicators
            </h3>
            <div className={styles.indicatorList}>
              {person.contributing_indicators.map((ind, i) => (
                <div
                  key={i}
                  className={`${styles.indicatorItem} ${
                    ind.impact === 'high' ? styles.impactHigh :
                    ind.impact === 'moderate' ? styles.impactModerate :
                    styles.impactLow
                  }`}
                >
                  <span className={styles.indicatorFactor}>{ind.factor}</span>
                  <span className={styles.indicatorValue}>{ind.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Trend Chart */}
        <ChartCard title="Welfare Risk Score Trend" subtitle="Risk score over the past 7 months">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={person.risk_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-text-tertiary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Risk Score"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_COLORS.primary }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Previous Assessments */}
        <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-4)' }}>Previous Assessments</h3>
          <div className={styles.detailCard}>
            {person.previous_assessments.map((assessment, i) => (
              <div key={i} className={styles.detailRow}>
                <span className={styles.detailLabel}>{formatDate(assessment.date)}</span>
                <span className={styles.detailValue}>
                  Score: {formatRiskScore(assessment.risk_score)} — <span style={{ textTransform: 'capitalize', color: 'var(--color-risk-low)' }}>{assessment.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Status */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-4)' }}>Welfare Review Status</h3>
          <div className={styles.detailCard}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Current Status</span>
              <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                {person.review_status.replace('_', ' ')}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Assessment</span>
              <span className={styles.detailValue}>{formatDate(person.last_assessment)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
