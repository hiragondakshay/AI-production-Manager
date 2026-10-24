import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, Lock, User, Mail, ShieldCheck, ArrowRight, Scan, Shield } from 'lucide-react';
import FaceScannerModal from '../components/FaceScannerModal';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('plant_mgr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('manager123');
  const [role, setRole] = useState('plant_manager');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isRegisterMode) {
      if (!email) {
        setError('Email address is required for registration.');
        setSubmitting(false);
        return;
      }
      const res = await register(username, email, password, role);
      setSubmitting(false);
      if (!res.success) setError(res.error);
    } else {
      const res = await login(username, password);
      setSubmitting(false);
      if (!res.success) setError(res.error);
    }
  };

  const handleQuickDemoLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setSubmitting(true);
    setError('');
    const res = await login(u, p);
    setSubmitting(false);
    if (!res.success) setError(res.error);
  };

  const handleFaceScanSuccess = (userData) => {
    setShowFaceModal(false);
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0a0d14 100%)',
      padding: '24px'
    }}>
      {/* Biometric Face Scanner Modal */}
      {showFaceModal && (
        <FaceScannerModal
          username={username}
          onClose={() => setShowFaceModal(false)}
          onSuccess={handleFaceScanSuccess}
        />
      )}

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '490px',
        padding: '40px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.75)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Cpu size={34} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            NEXUS<span className="text-gradient">PROD AI</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Military-Grade Armored Manufacturing Execution System
          </p>
        </div>

        {/* Security Shield Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          <Shield size={14} />
          <span>AES-256 GCM DATA ENCRYPTED • ANTI-BRUTE-FORCE ACTIVE</span>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: !isRegisterMode ? 'var(--accent-cyan)' : 'transparent',
              color: !isRegisterMode ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isRegisterMode ? 'var(--accent-cyan)' : 'transparent',
              color: isRegisterMode ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '18px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Username Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Email Input (Register Mode) */}
          {isRegisterMode && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@factory.com"
                  required={isRegisterMode}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Role Selector (Register Mode) */}
          {isRegisterMode && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Assign System Access Role
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="plant_manager" style={{ background: '#1e293b' }}>Plant Manager (AI Scheduling, Inventory, Maint.)</option>
                  <option value="admin" style={{ background: '#1e293b' }}>System Admin (Full System & User Control)</option>
                  <option value="floor_supervisor" style={{ background: '#1e293b' }}>Floor Supervisor (Live Telemetry & Defect QC)</option>
                </select>
              </div>
            </div>
          )}

          {/* Biometric Face Scanner Button */}
          {!isRegisterMode && (
            <button
              type="button"
              onClick={() => setShowFaceModal(true)}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                justify: 'center',
                borderColor: 'var(--accent-purple)',
                color: 'var(--accent-purple)',
                background: 'rgba(168, 85, 247, 0.08)'
              }}
            >
              <Scan size={18} />
              <span>Biometric Face Scan Sign In</span>
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '4px' }}
          >
            <span>{submitting ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Quick Accounts */}
        {!isRegisterMode && (
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1-Click Quick Demo Accounts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin123')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 4px', justifyContent: 'center', flexDirection: 'column', gap: '2px' }}
              >
                <strong style={{ color: 'var(--accent-rose)' }}>Admin</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('plant_mgr', 'manager123')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 4px', justifyContent: 'center', flexDirection: 'column', gap: '2px' }}
              >
                <strong style={{ color: 'var(--accent-amber)' }}>Plant Manager</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('supervisor', 'super123')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 4px', justifyContent: 'center', flexDirection: 'column', gap: '2px' }}
              >
                <strong style={{ color: 'var(--accent-emerald)' }}>Supervisor</strong>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
