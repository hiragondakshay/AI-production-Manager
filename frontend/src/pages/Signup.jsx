import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Activity } from 'lucide-react';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!username.trim()) {
      return setError('Username is required');
    }
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        username,
        email,
        password,
      });
      setSuccess('Account created successfully! You may now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="login-background">
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>

      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '450px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Activity size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h1 className="heading-gradient" style={{ fontSize: '2rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join NEXUSPROD AI today</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

        <form onSubmit={handleSignup} noValidate>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" required className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Username</label>
            <input type="text" required className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" required className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!!success}>Sign Up</button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
