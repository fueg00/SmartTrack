import { useState, useEffect } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

const ENABLE_REFERRALS = import.meta.env.VITE_ENABLE_REFERRALS === 'true';

function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('inviteCode');
    if (code) {
      setInviteCode(code);
    }
    const ref = params.get('ref') || params.get('referral');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.register({ email, password, orgName, inviteCode, referralCode });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await api.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onRegister(res.data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Welcome to SmartTrack</h1>
      <div className="auth-subtitle">Let's set up your shop in a few seconds.</div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="apple-form-group">
          <label className="apple-form-label">What's your shop called?</label>
          <input 
            className="apple-input"
            type="text" 
            value={orgName} 
            onChange={(e) => setOrgName(e.target.value)} 
            required 
            placeholder="Your Company, Inc."
          />
        </div>
        <div className="apple-form-group">
          <label className="apple-form-label">Your work email</label>
          <input 
            className="apple-input"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="you@company.com"
          />
        </div>
        <div className="apple-form-group">
          <label className="apple-form-label">Password</label>
          <input 
            className="apple-input"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Create a strong password"
          />
        </div>
        <div className="apple-form-group">
          <label className="apple-form-label">Invite Code <span className="footnote" style={{ fontWeight: 400 }}>(Optional for Beta Testers)</span></label>
          <input 
            className="apple-input"
            type="text" 
            value={inviteCode} 
            onChange={(e) => setInviteCode(e.target.value)} 
            placeholder="Enter BETAXXXX code"
          />
        </div>
        <button type="submit" className="apple-btn apple-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <div className="auth-switch">
        Already have an account? <button onClick={onSwitchToLogin}>Sign In</button>
      </div>
    </div>
  );
}

export default Register;