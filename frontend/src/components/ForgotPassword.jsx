import { useState } from 'react';
import * as api from '../api';

function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      setError(Array.isArray(msg) ? msg.map(m => m.message).join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-card">
        <h1>Check Your Email</h1>
        <div className="auth-subtitle" style={{ marginBottom: '20px' }}>
          If an account with <strong>{email}</strong> exists, we've sent a password reset link.
        </div>
        <div className="info-box" style={{
          background: 'var(--apple-gray-5)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <strong>🔐 Demo Mode:</strong> The reset link is logged to the server console.
        </div>
        <button 
          className="apple-btn apple-btn-ghost" 
          onClick={onSwitchToLogin}
          style={{ width: '100%' }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Reset Password</h1>
      <div className="auth-subtitle">Enter your email and we'll send you a reset link.</div>
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
        <button type="submit" className="apple-btn apple-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <div className="auth-switch">
        <button onClick={onSwitchToLogin}>Back to Sign In</button>
      </div>
    </div>
  );
}

export default ForgotPassword;