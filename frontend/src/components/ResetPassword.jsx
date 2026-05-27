import { useState, useEffect } from 'react';
import * as api from '../api';

function ResetPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await api.resetPassword({ email, token, password });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password';
      setError(Array.isArray(msg) ? msg.map(m => m.message).join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card">
        <h1>✅ Password Reset</h1>
        <div className="auth-subtitle" style={{ marginBottom: '20px' }}>
          Your password has been reset successfully.
        </div>
        <button 
          className="apple-btn apple-btn-primary" 
          onClick={onSwitchToLogin}
          style={{ width: '100%' }}
        >
          Sign In with New Password
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Set New Password</h1>
      <div className="auth-subtitle">Choose a strong password for your account.</div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="apple-form-group">
          <label className="apple-form-label">Email</label>
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
          <label className="apple-form-label">New Password</label>
          <input 
            className="apple-input"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="apple-form-group">
          <label className="apple-form-label">Confirm Password</label>
          <input 
            className="apple-input"
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            placeholder="Re-enter your password"
          />
        </div>
        <button type="submit" className="apple-btn apple-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
      <div className="auth-switch">
        <button onClick={onSwitchToLogin}>Back to Sign In</button>
      </div>
    </div>
  );
}

export default ResetPassword;