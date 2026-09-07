import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { WelfareResource } from '../../services/types';
import {
  LifeBuoy,
  PhoneCall,
  Clock,
  Shield,
  HeartHandshake,
  BookOpen,
  Users,
  Compass,
  CheckCircle2
} from 'lucide-react';

export const WelfareResourcesView: React.FC = () => {
  const [resources, setResources] = useState<WelfareResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWelfareResources()
      .then(data => setResources(data))
      .catch(err => console.error('Failed to load welfare resources', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p>Loading welfare and recovery support resources...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-gap">
      {/* 24/7 Emergency Helpline Hero Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #1e3a5f 100%)',
        color: 'white',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              <Shield size={14} /> 100% Confidential • 24/7 Support
            </div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>
              Immediate Welfare & Counseling Assistance
            </h2>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', marginTop: '6px', maxWidth: '640px' }}>
              If you or a buddy need immediate confidential guidance, reach out to the dedicated Armed Forces Support Line. No rank barrier, no duty log record.
            </p>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            color: '#1e3a5f',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
              Toll-Free Helpline
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f766e', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneCall size={20} /> 1800-11-2522
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
              Active Now (24x7 Support)
            </div>
          </div>
        </div>
      </div>

      {/* Non-Medical Disclaimer Box */}
      <div className="notice-box">
        <BookOpen size={18} className="notice-icon" color="#0d9488" />
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Educational & Operational Guidance:</strong> Resources provided here are designed to support rest protocols, operational recovery, and personal wellness.
          They do not constitute medical diagnoses or prescriptions. For clinical medical attention, consult your Unit Regimental Medical Officer (RMO).
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid-2">
        {resources.map(res => (
          <div key={res.id} className="card">
            <div className="card-header">
              <div className="card-title">
                {res.category === 'Rest & Recovery' && <Compass size={20} color="#0d9488" />}
                {res.category === 'Unit Contacts' && <Users size={20} color="#1e3a5f" />}
                {res.category === 'Confidential Helpline' && <LifeBuoy size={20} color="#0284c7" />}
                {res.category === 'Family & Peer Support' && <HeartHandshake size={20} color="#059669" />}
                {res.title}
              </div>
              <span className="badge badge-balanced" style={{ fontSize: '0.7rem' }}>
                {res.category}
              </span>
            </div>

            <div className="card-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                {res.description}
              </p>

              {res.tips && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Recommended Practice Points:
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {res.tips.map((tip, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {res.contact && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PhoneCall size={15} color="#0d9488" /> {res.contact}
                  </div>
                  {res.hours && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} /> {res.hours}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
