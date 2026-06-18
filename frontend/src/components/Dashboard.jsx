import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';
import OwnerInsights from './OwnerInsights';

function Dashboard({ user, onAdjustStock }) {
  const [stats, setStats] = useState({ totalProducts: 0, inventoryValue: 0, lowStockCount: 0 })
  const [billing, setBilling] = useState({ subscription_tier: 'Free', subscription_status: 'active' })
  const [lowStockItems, setLowStockItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isOwner = user?.role === 'Owner';

  useEffect(() => {
    setError(null);
    const promises = [api.getDashboardStats(), api.getLowStockItems(), api.getBillingStatus()];
    if (isOwner) {
      promises.push(api.getProducts());
    }
    Promise.all(promises)
      .then(([statsRes, lowStockRes, billingRes, productsRes]) => {
        setStats(statsRes.data)
        setLowStockItems(lowStockRes.data)
        setBilling(billingRes.data)
        if (productsRes) {
          setProducts(productsRes.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(getErrorMessage(err, 'Failed to load dashboard data'))
        setLoading(false)
      })
  }, [isOwner])

  if (loading) return <div className="loading-text">Loading dashboard…</div>
  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button className="apple-btn apple-btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  )

  return (
    <div>
      {/* Current Plan Card */}
      <div className="apple-card apple-card-sm" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="subhead">Current Plan:</span>
          <span className="tier-badge" style={{ marginLeft: '8px', background: 'var(--apple-blue)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}>
            {billing.subscription_tier}
          </span>
        </div>
        {billing.subscription_tier === 'Free' && (
          <button
            onClick={() => window.location.hash = '#billing'}
            className="apple-btn apple-btn-ghost apple-btn-sm"
            style={{ color: 'var(--apple-blue)', fontWeight: 600 }}
          >
            Upgrade for more limits →
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="apple-card stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="apple-card stat-card">
          <div className="stat-label">Inventory Value</div>
          <div className="stat-value">${stats.inventoryValue.toFixed(2)}</div>
        </div>
        <div className="apple-card stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className={`stat-value ${stats.lowStockCount > 0 ? 'danger' : ''}`}>{stats.lowStockCount}</div>
        </div>
      </div>

      {/* Owner Insights — exclusive section for the business owner */}
      {isOwner && products.length > 0 && (
        <OwnerInsights products={products} lowStockItems={lowStockItems} />
      )}

      {/* Low Stock Section */}
      <div className="section-title">Low Stock Alerts</div>
      {lowStockItems.length === 0 ? (
        <div className="apple-card apple-card-sm" style={{ textAlign: 'center', color: 'var(--apple-system-gray)' }}>
          All items are well-stocked. ✓
        </div>
      ) : (
        <div className="activity-list">
          {lowStockItems.map(item => (
            <div key={item.id} className="apple-card activity-item" onClick={() => onAdjustStock(item)}>
              <div className="activity-item-left">
                <div className="activity-item-name">{item.name}</div>
                <div className="activity-item-sku">SKU: {item.sku} · Reorder at {item.reorder_point}</div>
              </div>
              <div className="activity-item-right">
                <div className="activity-item-stock danger">{item.current_stock} in stock</div>
                <div className="activity-item-date danger">Low Stock Alert</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard;