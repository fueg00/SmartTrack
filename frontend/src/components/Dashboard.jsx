import React, { useState, useEffect } from 'react';
import * as api from '../api';

function Dashboard({ onAdjustStock }) {
  const [stats, setStats] = useState({ totalProducts: 0, inventoryValue: 0, lowStockCount: 0 })
  const [billing, setBilling] = useState({ subscription_tier: 'Free', subscription_status: 'active' })
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getLowStockItems(), api.getBillingStatus()])
      .then(([statsRes, lowStockRes, billingRes]) => {
        setStats(statsRes.data)
        setLowStockItems(lowStockRes.data)
        setBilling(billingRes.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading dashboard...</p>

  return (
    <div className="dashboard">
      <div className="billing-info-bar">
        <span>Current Plan: <strong>{billing.subscription_tier}</strong></span>
        {billing.subscription_tier === 'Free' && (
          <button onClick={() => window.location.hash = '#billing'} className="btn-link">Upgrade for more limits</button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <div className="value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <h3>Inventory Value</h3>
          <div className="value">${stats.inventoryValue.toFixed(2)}</div>
        </div>
        <div className="stat-card warning">
          <h3>Low Stock Items</h3>
          <div className="value">{stats.lowStockCount}</div>
        </div>
      </div>

      <h2>Low Stock Alerts</h2>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Current Stock</th>
            <th>Reorder Point</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lowStockItems.length === 0 ? (
            <tr><td colSpan="5">No low stock items.</td></tr>
          ) : (
            lowStockItems.map(item => (
              <tr key={item.id}>
                <td data-label="Name">{item.name}</td>
                <td data-label="SKU">{item.sku}</td>
                <td data-label="Stock" className="low-stock">{item.current_stock}</td>
                <td data-label="Reorder Point">{item.reorder_point}</td>
                <td data-label="Action">
                  <button className="btn btn-warning" onClick={() => onAdjustStock(item)}>Adjust Stock</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard;
