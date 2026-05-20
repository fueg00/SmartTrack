import React, { useState, useEffect } from 'react';
import * as api from '../api';

function Referrals() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.getReferralStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch referral stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus({ type: 'loading', message: 'Sending invitation...' });
    try {
      await api.inviteBusiness(inviteEmail);
      setInviteStatus({ type: 'success', message: `Invitation sent to ${inviteEmail}!` });
      setInviteEmail('');
    } catch (err) {
      setInviteStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to send invitation' 
      });
    }
  };

  if (loading) return <div>Loading referral information...</div>;

  const referralLink = `${window.location.origin}/register?ref=${stats?.referralCode}`;

  return (
    <div className="referrals-container">
      <h2>Refer a Business</h2>
      <p className="subtitle">Invite other businesses to SmartTrack and earn rewards!</p>

      <div className="reward-info-card">
        <h3>How it works:</h3>
        <div className="rewards-grid">
          <div className="reward-item">
            <span className="icon">🎁</span>
            <div className="text">
              <strong>For You:</strong> 1 month of Pro tier for FREE for every successful referral.
            </div>
          </div>
          <div className="reward-item">
            <span className="icon">🚀</span>
            <div className="text">
              <strong>For Them:</strong> A 60-day free trial of the Pro tier (standard is 30 days).
            </div>
          </div>
        </div>
      </div>

      <div className="referral-actions">
        <div className="action-card">
          <h3>Your Referral Code</h3>
          <div className="code-display">
            <code>{stats?.referralCode}</code>
            <button className="btn btn-secondary" onClick={handleCopyCode}>
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="small">Share this code or your unique link:</p>
          <div className="link-display">
            <input type="text" readOnly value={referralLink} />
            <button className="btn btn-secondary" onClick={() => {
              navigator.clipboard.writeText(referralLink);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2000);
            }}>
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="action-card">
          <h3>Invite via Email</h3>
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <input 
                type="email" 
                placeholder="colleague@anotherbusiness.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={inviteStatus.type === 'loading'}>
              Send Invitation
            </button>
          </form>
          {inviteStatus.message && (
            <div className={`status-message ${inviteStatus.type}`}>
              {inviteStatus.message}
            </div>
          )}
        </div>
      </div>

      <div className="referral-history">
        <h3>Your Referrals</h3>
        {stats?.referrals && stats.referrals.length > 0 ? (
          <table className="referral-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.referrals.map((ref) => (
                <tr key={ref.id}>
                  <td>{ref.referred_org_name}</td>
                  <td>{new Date(ref.created_at).toLocaleDateString()}</td>
                  <td><span className="badge badge-success">Reward Applied</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No referrals yet. Start inviting businesses to earn rewards!</p>
        )}
      </div>

      <style jsx>{`
        .referrals-container { padding: 20px; max-width: 900px; margin: 0 auto; }
        .subtitle { color: #666; margin-bottom: 30px; }
        
        .reward-info-card {
          background: #e7f3ff;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 5px solid #0056b3;
        }
        .rewards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }
        .reward-item { display: flex; align-items: flex-start; gap: 10px; }
        .reward-item .icon { font-size: 1.5em; }
        
        .referral-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }
        .action-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .code-display, .link-display {
          display: flex;
          gap: 10px;
          margin: 10px 0;
        }
        .code-display code {
          flex: 1;
          background: #f1f3f5;
          padding: 10px;
          border-radius: 4px;
          font-size: 1.2em;
          text-align: center;
          font-weight: bold;
          color: #0056b3;
        }
        .link-display input {
          flex: 1;
          padding: 8px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: #f8f9fa;
        }
        
        .referral-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .referral-table th, .referral-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .empty-state {
          text-align: center;
          padding: 30px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }
        
        .status-message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .status-message.success { background: #d4edda; color: #155724; }
        .status-message.error { background: #f8d7da; color: #721c24; }
        
        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: bold;
        }
        .badge-success { background: #28a745; color: white; }
      `}</style>
    </div>
  );
}

export default Referrals;
