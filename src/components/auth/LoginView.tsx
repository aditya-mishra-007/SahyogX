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

  // Role metadata configurations with custom tailored gradients and accents
  const roleConfig = {
    PERSONNEL: {
      label: 'Personnel Login',
      badge: 'Personnel Welfare Portal',
      subtitle: 'Confidential Welfare, Self-Assessment & Duty Management',
      icon: User,
      buttonText: 'Sign In as Personnel',
      primaryColor: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.25)',
      btnGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      btnTextColor: '#031525',
      demoUser: 'SF-882914',
      demoPass: 'ServicePass@2026',
      placeholder: 'e.g. SF-882914 or personnel',
    },
    COMMANDER: {
      label: 'Commander Login',
      badge: 'Commanding Officer Portal',
      subtitle: 'Force-Level Operational Readiness & Unit Stress Analytics',
      icon: Shield,
      buttonText: 'Sign In as Commander',
      primaryColor: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
      btnGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      btnTextColor: '#1c1002',
      demoUser: 'commander',
      demoPass: 'commander123',
      placeholder: 'e.g. commander or CMD-001',
    },
    MEDICAL_OFFICER: {
      label: 'Welfare Officer Login',
      badge: 'Welfare & Medical Officer Portal',
      subtitle: 'Clinical Risk Stratification, Early Warning Alerts & Interventions',
      icon: Stethoscope,
      buttonText: 'Sign In as Welfare Officer',
      primaryColor: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.25)',
      btnGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      btnTextColor: '#022115',
      demoUser: 'medical',
      demoPass: 'medical123',
      placeholder: 'e.g. medical or WO-001',
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
      background: 'radial-gradient(ellipse at 50% 15%, #1e293b 0%, #0b1120 60%, #030712 100%)',
      padding: '24px',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#f8fafc',
    }}>
      {/* Ambient background decoration */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: `radial-gradient(ellipse, ${currentRole.accentGlow} 0%, transparent 70%)`,
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.5s ease',
      }} />

      {/* Main Unified Glassmorphic Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '460px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -5px ${currentRole.accentGlow}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.4s ease',
      }}>

        {/* Unified Card Header */}
        <div style={{
          padding: '32px 28px 20px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Logo Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '58px',
            height: '58px',
            borderRadius: '16px',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            border: `1px solid ${currentRole.primaryColor}50`,
            boxShadow: `0 8px 24px -4px ${currentRole.accentGlow}`,
            marginBottom: '14px',
            transition: 'all 0.3s ease',
          }}>
            <IconComponent size={28} color={currentRole.primaryColor} />
          </div>

          {/* Role Pill */}
          <div>
            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: `${currentRole.primaryColor}18`,
              color: currentRole.primaryColor,
              border: `1px solid ${currentRole.primaryColor}35`,
              marginBottom: '10px',
              transition: 'all 0.3s ease',
            }}>
              {currentRole.badge}
            </span>
          </div>

          {/* Title & Subtitle */}
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 6px 0',
            letterSpacing: '-0.025em',
          }}>
            {mode === 'login' ? currentRole.label : 'Register New Account'}
          </h1>
          <p style={{
            fontSize: '0.84rem',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.45,
          }}>
            {mode === 'login' ? currentRole.subtitle : 'Enter your credentials once. Next time simply Sign In.'}
          </p>
        </div>

        {/* 3-Role Segmented Selector */}
        <div style={{
          padding: '0 24px',
          marginBottom: '14px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'rgba(2, 6, 23, 0.65)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px',
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
                    background: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'transparent',
                    color: isSelected ? '#ffffff' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <TabIcon size={13} color={isSelected ? rCfg.primaryColor : '#64748b'} />
                  <span>{r === 'PERSONNEL' ? 'Personnel' : r === 'COMMANDER' ? 'Commander' : 'Officer'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Pill Toggle (Sign In vs Register) */}
        <div style={{
          padding: '0 24px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(2, 6, 23, 0.4)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: mode === 'login' ? 700 : 500,
                cursor: 'pointer',
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
                borderRadius: '8px',
                border: 'none',
                background: mode === 'register' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: mode === 'register' ? 700 : 500,
                cursor: 'pointer',
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
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
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
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#86efac',
              fontSize: '0.83rem',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* ================= LOGIN MODE ================= */
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
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
                      borderRadius: '10px',
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = currentRole.primaryColor}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                    required
                  />
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
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
                      borderRadius: '10px',
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = currentRole.primaryColor}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                    required
                  />
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                </div>
              </div>

              {/* High-Impact Action Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentRole.btnGradient,
                  color: currentRole.btnTextColor,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: `0 6px 20px -2px ${currentRole.accentGlow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.01em',
                  transition: 'transform 0.15s ease, opacity 0.2s',
                }}
              >
                <span>{loading ? 'Authenticating...' : currentRole.buttonText}</span>
                <ChevronRight size={18} />
              </button>

              {/* Verified Demo Autofill Chip */}
              <div style={{
                marginTop: '18px',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: '#64748b' }}>Demo Quick Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPersonnelId(currentRole.demoUser);
                    setPassword(currentRole.demoPass);
                    setError(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${currentRole.primaryColor}40`,
                    color: currentRole.primaryColor,
                    padding: '3px 10px',
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
            /* ================= REGISTER MODE ================= */
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Target Authorization Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BackendRole)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PERSONNEL" style={{ background: '#0f172a' }}>Personnel (Soldier / JCO)</option>
                  <option value="COMMANDER" style={{ background: '#0f172a' }}>Commanding Officer (Commander)</option>
                  <option value="MEDICAL_OFFICER" style={{ background: '#0f172a' }}>Welfare / Medical Officer</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
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
                      background: 'rgba(2, 6, 23, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
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
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#031525',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                }}
              >
                {loading ? 'Creating Record...' : 'Register & Save Account'}
              </button>
            </form>
          )}

          {/* Footer Security Badge */}
          <div style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: '#64748b',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={13} color="#0d9488" />
              Role-Based Access Control (RBAC)
            </span>
            <span>SIH26186 Defense Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
