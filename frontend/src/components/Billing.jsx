import React, { useState, useEffect } from 'react';
import * as api from '../api';

function Billing() {
  const [status, setStatus] = useState({ subscription_tier: 'Free', subscription_status: 'active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const res = await api.getBillingStatus();
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch billing status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier) => {
    try {
      setLoading(true);
      const res = await api.createCheckoutSession(tier);
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start checkout');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading billing information...</div>;

  return (
    <div className="billing-container">
      <h2>Subscription & Billing</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="current-plan-card">
        <h3>Current Plan: <span className="tier-badge">{status.subscription_tier}</span></h3>
        <p>Status: <strong>{status.subscription_status}</strong></p>
      </div>

      <div className="tiers-grid">
        <div className={`tier-card ${status.subscription_tier === 'Free' ? 'current' : ''}`}>
          <h4>Free</h4>
          <p className="price">$0/mo</p>
          <ul>
            <li>50 Products</li>
            <li>100 Transactions/mo</li>
            <li>1 User</li>
          </ul>
          {status.subscription_tier === 'Free' ? (
            <button disabled className="btn">Current Plan</button>
          ) : (
            <button disabled className="btn">Contact Support to Downgrade</button>
          )}
        </div>

        <div className={`tier-card ${status.subscription_tier === 'Pro' ? 'current' : ''}`}>
          <h4>Pro</h4>
          <p className="price">$39/mo</p>
          <ul>
            <li>1,000 Products</li>
            <li>Unlimited Transactions</li>
            <li>5 Users</li>
            <li>Email Alerts</li>
          </ul>
          {status.subscription_tier === 'Pro' ? (
            <button disabled className="btn">Current Plan</button>
          ) : (
            <button 
              onClick={() => handleUpgrade('Pro')} 
              className="btn btn-primary"
              disabled={loading}
            >
              {status.subscription_tier === 'Enterprise' ? 'Downgrade to Pro' : 'Upgrade to Pro'}
            </button>
          )}
        </div>

        <div className={`tier-card ${status.subscription_tier === 'Enterprise' ? 'current' : ''}`}>
          <h4>Enterprise</h4>
          <p className="price">$99/mo</p>
          <ul>
            <li>Unlimited Products</li>
            <li>Unlimited Transactions</li>
            <li>Unlimited Users</li>
            <li>Priority Support</li>
          </ul>
          {status.subscription_tier === 'Enterprise' ? (
            <button disabled className="btn">Current Plan</button>
          ) : (
            <button 
              onClick={() => handleUpgrade('Enterprise')} 
              className="btn btn-primary"
              disabled={loading}
            >
              Upgrade to Enterprise
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .billing-container { padding: 20px; }
        .current-plan-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          margin-bottom: 30px;
          border: 1px solid #dee2e6;
        }
        .tier-badge {
          background: #0056b3;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        .tier-card {
          border: 1px solid #dee2e6;
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
        }
        .tier-card.current {
          border-color: #28a745;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.2);
          background: #f0fff4;
        }
        .price { font-size: 1.5em; font-weight: bold; margin: 10px 0; }
        ul { list-style: none; padding: 0; margin: 20px 0; text-align: center; }
        li { margin-bottom: 8px; color: #666; }
        h4 { margin: 0; font-size: 1.2em; }
      `}</style>
    </div>
  );
}

export default Billing;
