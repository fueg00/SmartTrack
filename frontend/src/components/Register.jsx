import { useState, useEffect } from 'react';
import * as api from '../api';

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
      // After registration, log them in automatically
      const res = await api.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onRegister(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create SmartTrack Account</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business / Organization Name</label>
            <input 
              type="text" 
              value={orgName} 
              onChange={(e) => setOrgName(e.target.value)} 
              required 
              className={error ? 'input-error' : ''}
            />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className={error ? 'input-error' : ''}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className={error ? 'input-error' : ''}
            />
          </div>
          <div className="form-group">
            <label>Invite Code (Optional for Beta Testers)</label>
            <input 
              type="text" 
              value={inviteCode} 
              onChange={(e) => setInviteCode(e.target.value)} 
              placeholder="Enter BETAXXXX code"
              className={error ? 'input-error' : ''}
            />
          </div>
          {ENABLE_REFERRALS && (
            <div className="form-group">
              <label>Referral Code (Optional)</label>
              <input 
                type="text" 
                value={referralCode} 
                onChange={(e) => setReferralCode(e.target.value)} 
                placeholder="Enter referral code"
                className={error ? 'input-error' : ''}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Already have an account? <button className="btn-link" onClick={onSwitchToLogin}>Login</button>
        </p>
      </div>
    </div>
  );
}

export default Register;
