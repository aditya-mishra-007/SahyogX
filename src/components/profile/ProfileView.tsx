import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Shield,
  LogOut,
  CheckCircle2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  return (
    <div className="flex-col-gap">
      {/* Profile Details Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <UserCheck size={22} color="#1e3a5f" />
            Authorized Personnel Information
          </div>
          <span className="badge badge-optimal">Authorized Session</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 700
            }}>
              {profile.name.charAt(0)}
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {profile.rank} {profile.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Service ID: <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{profile.personnelId}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span className="badge badge-balanced" style={{ textTransform: 'none' }}>
                  {profile.unit}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px'
          }}>
            <div style={{ padding: '12px 14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Rank & Title</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {profile.rank}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trade / Specialty</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {profile.tradeSpecialty}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Service Tenure</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {profile.serviceYears} Years Completed
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Station / Deployment</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {profile.station}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Privacy Statement & Access Policy */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Shield size={20} color="#0d9488" />
            Personnel Privacy & Data Safeguard Protocol
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            The SahyogX platform enforces strict <strong>Role-Based Access Isolation</strong>. Your individual responses and personal welfare indices are protected under armed forces confidential data regulations:
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Personal Only Access:</strong> You can only query and view your own records. No other peer or unauthorized individual has access to your self-assessment answers.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Non-Punitive Mandate:</strong> Self-assessments are strictly confidential welfare tools designed for proactive rest scheduling, operational rotation, and well-being support.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Cryptographic Session Tokens:</strong> Sessions expire automatically after inactivity to maintain security in shared outpost terminals.</span>
            </li>
          </ul>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Session Active for <strong>{profile.personnelId}</strong>
          </span>
          <button
            className="btn btn-outline"
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <LogOut size={16} /> Sign Out of Session
          </button>
        </div>
      </div>
    </div>
  );
};
