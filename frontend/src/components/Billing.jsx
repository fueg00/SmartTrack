import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

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
      setError(getErrorMessage(err, 'Failed to fetch billing status'));
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
      setError(getErrorMessage(err, 'Failed to start checkout'));
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-text">Loading billing information…</div>;

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/mo',
      features: ['50 Products', '100 Transactions/mo', '1 User'],
      cta: 'Current Plan',
      disabled: status.subscription_tier === 'Free',
      action: null
    },
    {
      name: 'Pro',
      price: '$39',
      period: '/mo',
      features: ['1,000 Products', 'Unlimited Transactions', '5 Users', 'Email Alerts'],
      cta: status.subscription_tier === 'Pro' ? 'Current Plan' : 
            status.subscription_tier === 'Enterprise' ? 'Downgrade to Pro' : 'Upgrade to Pro',
      disabled: status.subscription_tier === 'Pro',
      action: () => handleUpgrade('Pro')
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/mo',
      features: ['Unlimited Products', 'Unlimited Transactions', 'Unlimited Users', 'Priority Support'],
      cta: status.subscription_tier === 'Enterprise' ? 'Current Plan' : 'Upgrade to Enterprise',
      disabled: status.subscription_tier === 'Enterprise',
      action: () => handleUpgrade('Enterprise')
    }
  ];

  return (
    <div className="billing-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="current-plan-card">
        <div>
          <h3 style={{ font: 'var(--font-h3)', margin: 0 }}>Current Plan</h3>
          <div className="subhead" style={{ marginTop: '4px' }}>Status: {status.subscription_status}</div>
        </div>
        <span className="tier-badge">{status.subscription_tier}</span>
      </div>

      <div className="tiers-grid">
        {tiers.map(tier => (
          <div key={tier.name} className={`tier-card ${status.subscription_tier === tier.name ? 'current' : ''}`}>
            <h4>{tier.name}</h4>
            <div className="price">{tier.price}<span>{tier.period}</span></div>
            <ul>
              {tier.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            {tier.disabled ? (
              <button disabled className="apple-btn apple-btn-secondary" style={{ width: '100%' }}>
                {tier.cta}
              </button>
            ) : (
              <button 
                onClick={tier.action} 
                className="apple-btn apple-btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Billing;