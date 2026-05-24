import { useState } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function Login({ onLogin, onSwitchToRegister }) {
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
      <h1>Welcome Back</h1>
      <div className="auth-subtitle">Sign in to your SmartTrack account.</div>
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
        <button type="submit" className="apple-btn apple-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <div className="auth-switch">
        Don't have an account? <button onClick={onSwitchToRegister}>Create Account</button>
      </div>
    </div>
  );
}

export default Login;