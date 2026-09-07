import React, { useState } from 'react';
import { ASSESSMENT_QUESTIONS } from '../../services/mockData';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Shield,
  Send
} from 'lucide-react';

const SCALE_LABELS = [
  { value: 1, text: 'Rarely / Low', fullLabel: 'Rarely / Needs Attention' },
  { value: 2, text: 'Occasional', fullLabel: 'Occasional / Mild Difficulty' },
  { value: 3, text: 'Moderate', fullLabel: 'Moderate / Manageable' },
  { value: 4, text: 'Good', fullLabel: 'Consistent / Good' },
  { value: 5, text: 'Optimal', fullLabel: 'Optimal / Very Strong' }
];

export const AssessmentView: React.FC = () => {
  const { showToast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [lastSubmissionRef, setLastSubmissionRef] = useState<string | null>(null);

  const handleScoreSelect = (questionId: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const answeredCount = Object.keys(ratings).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (answeredCount < totalQuestions) {
      showToast(`Please answer all ${totalQuestions} indicators before submitting.`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitSurvey({
        ratings,
        additionalNotes: additionalNotes.trim() || undefined
      });

      setSubmittedSuccess(true);
      setLastSubmissionRef(res.assessmentId);
      showToast('Self-assessment recorded successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error submitting assessment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setRatings({});
    setAdditionalNotes('');
    setSubmittedSuccess(false);
    setLastSubmissionRef(null);
  };

  return (
    <div className="flex-col-gap">
      {/* Assessment Header Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ClipboardCheck size={22} color="#0d9488" />
            Periodic Wellness Self-Assessment
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock size={16} /> Estimated: 2–3 minutes
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This periodic check-in allows you to reflect on your duty pacing, physical recovery, rest regularity, and unit connectivity.
            Your responses are processed confidentially to provide personal welfare insights and support planning.
          </p>

          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Shield size={18} color="#0d9488" style={{ flexShrink: 0 }} />
            <span>
              <strong>Confidentiality Standard:</strong> This assessment does not provide medical diagnoses and is not used as a disciplinary tool. It serves personal welfare awareness and support resource recommendations.
            </span>
          </div>

          {/* Progress Bar */}
          {!submittedSuccess && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Completion Progress: {answeredCount} of {totalQuestions} Categories</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: progressPercent === 100 ? '#059669' : '#0d9488',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {submittedSuccess ? (
        /* Submission Success Screen */
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--status-optimal-bg)',
            color: 'var(--status-optimal)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Self-Assessment Successfully Recorded
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '8px', maxWidth: '540px', margin: '8px auto 0' }}>
            Thank you for completing your periodic check-in. Your responses have been incorporated into your private welfare indicators (Ref: <code>{lastSubmissionRef}</code>).
          </p>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn btn-outline" onClick={handleReset}>
              Take Another Assessment
            </button>
          </div>
        </div>
      ) : (
        /* Questionnaire Form */
        <form onSubmit={handleSubmit}>
          <div className="flex-col-gap">
            {ASSESSMENT_QUESTIONS.map((q, index) => {
              const currentVal = ratings[q.id];
              return (
                <div key={q.id} className="card" style={{ borderColor: currentVal ? 'var(--accent-teal)' : 'var(--border-subtle)' }}>
                  <div className="card-header" style={{ padding: '14px 20px', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: currentVal ? 'var(--accent-teal)' : 'var(--border-medium)',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {index + 1}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                        {q.categoryLabel}
                      </strong>
                    </div>
                    {currentVal ? (
                      <span className="badge badge-optimal" style={{ fontSize: '0.725rem' }}>Completed</span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>Pending</span>
                    )}
                  </div>

                  <div className="card-body">
                    <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {q.text}
                    </p>
                    {q.guidance && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        {q.guidance}
                      </p>
                    )}

                    {/* 1 - 5 Likert Scale Radio Selector */}
                    <div className="scale-group">
                      {SCALE_LABELS.map(opt => (
                        <div key={opt.value} className="scale-option">
                          <input
                            type="radio"
                            id={`${q.id}_${opt.value}`}
                            name={q.id}
                            value={opt.value}
                            checked={ratings[q.id] === opt.value}
                            onChange={() => handleScoreSelect(q.id, opt.value)}
                          />
                          <label htmlFor={`${q.id}_${opt.value}`} className="scale-label">
                            <span className="scale-number">{opt.value}</span>
                            <span className="scale-text">{opt.text}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Optional Notes & Observations */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  Optional Observations or Operational Context
                </div>
              </div>
              <div className="card-body">
                <label className="form-label" htmlFor="additionalNotes">
                  Anything specific regarding your recent deployment, watch hours, or recovery you would like recorded?
                </label>
                <textarea
                  id="additionalNotes"
                  className="form-textarea"
                  placeholder="e.g. Recent night watch duties; recovering from minor exertion; feeling well supported by buddy team..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
                <span className="form-hint">Optional. Stored confidentially with your assessment record.</span>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {answeredCount === totalQuestions ? (
                    <span style={{ color: 'var(--status-optimal)', fontWeight: 600 }}>All sections completed. Ready to submit.</span>
                  ) : (
                    <span>{totalQuestions - answeredCount} sections remaining</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || answeredCount < totalQuestions}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={16} />
                  {submitting ? 'Transmitting...' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
