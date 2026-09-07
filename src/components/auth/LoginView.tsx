import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, User, AlertCircle, Info } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [personnelId, setPersonnelId] = useState('SF-882914');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!personnelId.trim()) {
      setError('Please enter your Personnel ID or Service Number.');
      return;
    }

    try {
      setLoading(true);
      await login(personnelId, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setPersonnelId('SF-882914');
    setPassword('ServicePass@2026');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        {/* Banner */}
        <div style={{
          backgroundColor: 'var(--primary)',
          padding: '32px 28px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Shield size={30} color="#38bdf8" />
          </div>
          <h1 style={{ color: 'white', fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            SahyogX Personnel Portal
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
            Individual Welfare, Self-Assessment & Duty Management
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div className="notice-box" style={{ borderColor: 'var(--status-review)', backgroundColor: 'var(--status-review-bg)', color: 'var(--status-review)', marginBottom: '20px' }}>
              <AlertCircle size={18} className="notice-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="personnelId">Personnel Service ID / Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="personnelId"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SF-882914"
                  value={personnelId}
                  onChange={(e) => setPersonnelId(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
              <span className="form-hint">Enter your official service registration number.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Security Password / Passcode</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Secure Personnel Sign In'}
            </button>
          </form>

          {/* Quick Demo Access Helper */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-medium)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Development Mock Authentication
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillDemoCredentials}
              style={{ fontSize: '0.785rem' }}
            >
              Use Sample Personnel: SF-882914
            </button>
          </div>

          {/* Privacy & Role Notice */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Info size={16} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Privacy Assurance:</strong> This portal strictly enforces individual data isolation. You can only view your own welfare information and records.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
