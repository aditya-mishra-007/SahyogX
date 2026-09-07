import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { WelfareReviewRequest, ReviewCategory, ContactMethod } from '../../services/types';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquarePlus,
  Send,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

const CATEGORIES: ReviewCategory[] = [
  'Routine Welfare Check-in',
  'Workload Adjustment Request',
  'Rest & Fatigue Consultation',
  'Personal / Family Circumstance'
];

const CONTACT_METHODS: ContactMethod[] = [
  'In-Person Confidential Meeting',
  'Unit Welfare Officer Phone Call',
  'Secure System Dispatch'
];

export const ReviewRequestView: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<WelfareReviewRequest[]>([]);
  const [category, setCategory] = useState<ReviewCategory>('Routine Welfare Check-in');
  const [preferredContact, setPreferredContact] = useState<ContactMethod>('In-Person Confidential Meeting');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load review requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.submitReviewRequest({
        category,
        message: message.trim() || undefined,
        preferredContact
      });

      showToast(res.message, 'success');
      setMessage('');
      // Reload list
      await fetchRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: WelfareReviewRequest['status']) => {
    switch (status) {
      case 'Submitted': return 'badge-balanced';
      case 'Under Review': return 'badge-attention';
      case 'Scheduled': return 'badge-optimal';
      case 'Completed': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="flex-col-gap">
      {/* Intro Notice */}
      <div className="notice-box notice-box-info">
        <ShieldCheck size={20} className="notice-icon" color="#0d9488" />
        <div>
          <strong>Confidential Welfare Channel:</strong> This review request is submitted directly and securely to your Unit Welfare Officer (UWO).
          It is strictly confidential and designed to help address duty pacing, family emergency support, or fatigue concerns proactively.
        </div>
      </div>

      {/* Main Grid: Submit Form + Request History */}
      <div className="grid-2">
        {/* Left: Request Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MessageSquarePlus size={20} color="#0d9488" />
              New Welfare Review Request
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reviewCategory">
                  Review Category / Reason
                </label>
                <select
                  id="reviewCategory"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReviewCategory)}
                >
                  {CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="form-hint">Select the area that best describes your situation.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactMethod">
                  Preferred Contact Method
                </label>
                <select
                  id="contactMethod"
                  className="form-select"
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as ContactMethod)}
                >
                  {CONTACT_METHODS.map((method, idx) => (
                    <option key={idx} value={method}>{method}</option>
                  ))}
                </select>
                <span className="form-hint">How you prefer the Welfare Cell to reach out to you.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reviewMessage">
                  Details / Optional Note
                </label>
                <textarea
                  id="reviewMessage"
                  className="form-textarea"
                  placeholder="Provide any context that helps the Welfare Officer prepare (e.g. duty rotation concerns, specific dates, or confidential request)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
                <span className="form-hint">Optional. Stored with strict end-to-end access isolation.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '12px' }}
              >
                <Send size={16} />
                {submitting ? 'Transmitting Request...' : 'Submit Confidential Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Existing Requests History & Status Tracking */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={20} color="#1e3a5f" />
              Your Review Requests & Status
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {requests.length} Records
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="text-muted text-sm">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p>No review requests currently on record.</p>
              </div>
            ) : (
              <div className="flex-col-gap" style={{ gap: '14px' }}>
                {requests.map(req => (
                  <div key={req.id} style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {req.referenceNumber}
                        </span>
                        <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {req.category}
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>

                    {req.message && (
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                        "{req.message}"
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Mode: {req.preferredContact}</span>
                      <span>Submitted: {req.submittedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
