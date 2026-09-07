import React, { useState } from 'react';
import { useAuth, type BackendRole } from '../../context/AuthContext';
import { Shield, Lock, User, AlertCircle, CheckCircle2, Stethoscope, ChevronRight } from 'lucide-react';

type AuthMode = 'login' | 'register';

export const LoginView: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<BackendRole>('PERSONNEL');

  // Login Form States
  const [personnelId, setPersonnelId] = useState('SF-882914');
  const [password, setPassword] = useState('ServicePass@2026');

  // Register Form States
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRank, setRegRank] = useState('Havildar');
  const [regUnit, setRegUnit] = useState('14 Rajputana Rifles');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Role metadata configurations
  const roleConfig = {
    PERSONNEL: {
      label: 'Personnel Login',
      badge: 'Personnel Welfare Portal',
      subtitle: 'Confidential Welfare, Self-Assessment & Duty Management',
      icon: User,
      buttonText: 'Sign In as Personnel',
      demoUser: 'SF-882914',
      demoPass: 'ServicePass@2026',
      placeholder: 'e.g. SF-882914',
    },
    COMMANDER: {
      label: 'Commander Login',
      badge: 'Commanding Officer Portal',
      subtitle: 'Force-Level Operational Readiness & Unit Stress Analytics',
      icon: Shield,
      buttonText: 'Sign In as Commander',
      demoUser: 'commander',
      demoPass: 'commander123',
      placeholder: 'e.g. CMD-001',
    },
    MEDICAL_OFFICER: {
      label: 'Welfare Officer Login',
      badge: 'Welfare & Medical Officer Portal',
      subtitle: 'Clinical Risk Stratification & Early Warning Alerts',
      icon: Stethoscope,
      buttonText: 'Sign In as Welfare Officer',
      demoUser: 'medical',
      demoPass: 'medical123',
      placeholder: 'e.g. WO-001',
    },
  };

  const currentRole = roleConfig[selectedRole];
  const IconComponent = currentRole.icon;

  const handleRoleSelect = (role: BackendRole) => {
    setSelectedRole(role);
    setError(null);
    setSuccessMsg(null);
    setPersonnelId(roleConfig[role].demoUser);
    setPassword(roleConfig[role].demoPass);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!personnelId.trim()) {
      setError('Please enter your Service ID or Username.');
      return;
    }

    try {
      setLoading(true);
      await login(personnelId.trim(), password, selectedRole);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regUsername.trim()) {
      setError('Please enter a valid Service ID or Username.');
      return;
    }
    if (!regPassword) {
      setError('Please enter a secure password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }

    try {
      setLoading(true);
      await register({
        username: regUsername.trim(),
        password: regPassword,
        role: selectedRole,
        fullName: regFullName.trim() || regUsername.trim().toUpperCase(),
        rank: regRank,
        unit: regUnit,
      });
      setSuccessMsg('Account registered successfully! Next time you can directly sign in.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Added a subtle, modern gradient background instead of flat white
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      padding: '24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: 'var(--color-text-primary, #0F172A)',
      position: 'relative',
    }}>
      {/* Decorative background elements to make it less plain */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40vh',
        background: 'linear-gradient(180deg, rgba(27, 42, 74, 0.03) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        // Improved shadow for better depth
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1), 0 0 10px rgba(15, 23, 42, 0.02)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top brand accent bar */}
        <div style={{
          height: '6px',
          width: '100%',
          background: 'linear-gradient(90deg, #1B2A4A 0%, #3B82F6 100%)',
        }} />

        {/* Card Header */}
        <div style={{ padding: '40px 32px 24px 32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'var(--color-primary-light, #e8f0fe)',
            color: 'var(--color-primary, #1B2A4A)',
            marginBottom: '20px',
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(27, 42, 74, 0.06)',
          }}>
            <IconComponent size={32} />
          </div>

          <div>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              backgroundColor: 'var(--color-accent-bg, rgba(59, 130, 246, 0.08))',
              color: 'var(--color-accent, #3B82F6)',
              marginBottom: '12px',
              border: '1px solid rgba(59, 130, 246, 0.15)'
            }}>
              {currentRole.badge}
            </span>
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary, #0F172A)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            {mode === 'login' ? currentRole.label : 'Register New Account'}
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-secondary, #475569)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {mode === 'login' ? currentRole.subtitle : 'Enter your credentials once. Next time simply Sign In.'}
          </p>
        </div>

        {/* 3-Role Segmented Selector */}
        <div style={{ padding: '0 32px', marginBottom: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            backgroundColor: 'var(--color-surface-hover, #F1F5F9)',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #E2E8F0)',
            gap: '6px',
          }}>
            {(['PERSONNEL', 'COMMANDER', 'MEDICAL_OFFICER'] as BackendRole[]).map((r) => {
              const isSelected = selectedRole === r;
              const rCfg = roleConfig[r];
              const TabIcon = rCfg.icon;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 2px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                    color: isSelected ? 'var(--color-primary, #1B2A4A)' : 'var(--color-text-secondary, #475569)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <TabIcon size={13} />
                  <span>{r === 'PERSONNEL' ? 'Personnel' : r === 'COMMANDER' ? 'Commander' : 'Officer'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Pill Toggle */}
        <div style={{ padding: '0 24px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface-hover, #F1F5F9)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid var(--color-border, #E2E8F0)',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: mode === 'login' ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                color: mode === 'login' ? 'var(--color-primary, #1B2A4A)' : 'var(--color-text-secondary, #475569)',
                fontSize: '0.82rem',
                fontWeight: mode === 'login' ? 600 : 500,
                cursor: 'pointer',
                boxShadow: mode === 'login' ? 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: mode === 'register' ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                color: mode === 'register' ? 'var(--color-primary, #1B2A4A)' : 'var(--color-text-secondary, #475569)',
                fontSize: '0.82rem',
                fontWeight: mode === 'register' ? 600 : 500,
                cursor: 'pointer',
                boxShadow: mode === 'register' ? 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Register / Add Data
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '0 24px 28px 24px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--status-review-bg, #fef2f2)',
              border: '1px solid var(--status-review-border, #fecaca)',
              color: 'var(--status-review, #dc2626)',
              fontSize: '0.83rem',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--status-optimal-bg, #ecfdf5)',
              border: '1px solid var(--status-optimal-border, #a7f3d0)',
              color: 'var(--status-optimal, #059669)',
              fontSize: '0.83rem',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #475569)',
                  marginBottom: '6px',
                }}>
                  {selectedRole === 'PERSONNEL' ? 'Personnel Service Number / ID' : selectedRole === 'COMMANDER' ? 'Commander Username / Service ID' : 'Medical Officer Username / Service ID'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={currentRole.placeholder}
                    value={personnelId}
                    onChange={(e) => setPersonnelId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <User size={16} color="var(--color-text-tertiary, #94A3B8)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #475569)',
                  marginBottom: '6px',
                }}>
                  Security Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <Lock size={16} color="var(--color-text-tertiary, #94A3B8)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary, #1B2A4A)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{loading ? 'Authenticating...' : currentRole.buttonText}</span>
                <ChevronRight size={18} />
              </button>

              <div style={{
                marginTop: '18px',
                padding: '10px 14px',
                backgroundColor: 'var(--color-surface-hover, #F1F5F9)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Demo Quick Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPersonnelId(currentRole.demoUser);
                    setPassword(currentRole.demoPass);
                    setError(null);
                  }}
                  style={{
                    backgroundColor: 'var(--color-surface, #FFFFFF)',
                    border: '1px solid var(--color-border, #E2E8F0)',
                    color: 'var(--color-primary, #1B2A4A)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Autofill: {currentRole.demoUser}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '6px' }}>
                  Target Authorization Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BackendRole)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                    border: '1px solid var(--color-input-border, #CBD5E1)',
                    color: 'var(--color-text-primary, #0F172A)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PERSONNEL">Personnel (Soldier / JCO)</option>
                  <option value="COMMANDER">Commanding Officer (Commander)</option>
                  <option value="MEDICAL_OFFICER">Welfare / Medical Officer</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Service ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SF-773901"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Military Rank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Havildar"
                    value={regRank}
                    onChange={(e) => setRegRank(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Unit / Regt
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14 Rajputana Rifles"
                    value={regUnit}
                    onChange={(e) => setRegUnit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Set Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: '4px' }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-input-bg, #FFFFFF)',
                      border: '1px solid var(--color-input-border, #CBD5E1)',
                      color: 'var(--color-text-primary, #0F172A)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary, #1B2A4A)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Creating Record...' : 'Register & Save Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
