import { useState } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Glad to see you again!</h1>
      <div className="auth-subtitle">Ready to check your stock?</div>
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
          <label className="apple-form-label">Password</label>
          <input 
            className="apple-input"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Enter your password"
          />
        </div>
        <div style={{ textAlign: 'right', marginBottom: '8px' }}>
          <button
            type="button"
            className="apple-btn apple-btn-ghost"
            onClick={onSwitchToForgotPassword}
            style={{ fontSize: '13px', padding: '4px 0', minHeight: 'auto' }}
          >
            Forgot password?
          </button>
        </div>
        <button type="submit" className="apple-btn apple-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Checking your keys…' : 'Sign In'}
        </button>
      </form>
      <div className="auth-switch">
        Don't have an account? <button onClick={onSwitchToRegister}>Create Account</button>
      </div>
    </div>
  );
}

export default Login;