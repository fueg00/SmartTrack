import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function RunwayPlanner({ user }) {
  const [runwayData, setRunwayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [poResult, setPoResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const loadRunway = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.getRunwayData();
      setRunwayData(res.data);
      setSelectedIds(new Set());
      setPoResult(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load runway data'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRunway();
  }, [loadRunway]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllNeedingRestock = () => {
    if (!runwayData) return;
    const ids = runwayData.items.filter(i => i.needs_restock).map(i => i.id);
    setSelectedIds(new Set(ids));
  };

  const handleGeneratePO = async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    setPoResult(null);
    try {
      const res = await api.generatePO([...selectedIds]);
      setPoResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate PO'));
    }
  };

  const handleCopyEmail = async (supplier) => {
    try {
      const orgName = user?.email?.split('@')[1] || 'My Business';
      const res = await api.generatePOEmail({
        supplier_name: supplier.supplier_name,
        items: supplier.items,
        org_name: orgName
      });
      await navigator.clipboard.writeText(res.data.email_body);
      setCopiedIndex(supplier.supplier_name);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      setError('Failed to copy email — clipboard access may be denied');
    }
  };

  const handleMailto = (supplier) => {
    if (!supplier.email) return;
    const subject = encodeURIComponent(`Purchase Order — ${supplier.supplier_name}`);
    const body = encodeURIComponent(
      `Dear ${supplier.supplier_name},\n\nPlease supply the following items:\n\n` +
      supplier.items.map(i => `${i.order_qty}x ${i.product_name} (${i.sku}) — $${i.line_total.toFixed(2)}`).join('\n') +
      `\n\nTotal: $${supplier.total.toFixed(2)}\n\nBest regards`
    );
    window.open(`mailto:${supplier.email}?subject=${subject}&body=${body}`, '_blank');
  };

  if (loading) return <div className="loading-text">Calculating runway…</div>;
  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button className="apple-btn apple-btn-primary" onClick={loadRunway}>Retry</button>
    </div>
  );
  if (!runwayData || runwayData.items.length === 0) {
    return (
      <div className="apple-card apple-card-sm" style={{ textAlign: 'center', color: 'var(--apple-system-gray)', padding: '40px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📡</div>
        <div>No products yet. Add some inventory first to see runway analysis.</div>
      </div>
    );
  }

  const { items, summary } = runwayData;

  return (
    <div className="runway-planner">
      {/* Summary cards */}
      <div className="runway-summary-grid">
        <div className="apple-card runway-summary-card">
          <div className="runway-summary-val">{summary.total_products}</div>
          <div className="runway-summary-lbl">Products Tracked</div>
        </div>
        <div className="apple-card runway-summary-card runway-risk">
          <div className="runway-summary-val">{summary.at_risk_count}</div>
          <div className="runway-summary-lbl">At Risk ⚠️</div>
        </div>
        <div className="apple-card runway-summary-card runway-warn">
          <div className="runway-summary-val">{summary.needs_restock_count}</div>
          <div className="runway-summary-lbl">Need Restock</div>
        </div>
        <div className="apple-card runway-summary-card">
          <div className="runway-summary-val">${summary.total_restock_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="runway-summary-lbl">Est. Restock Cost</div>
        </div>
      </div>

      {/* Action bar */}
      <div className="runway-actions">
        <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={selectAllNeedingRestock}>
          Select All Needing Restock
        </button>
        <button
          className={`apple-btn ${selectedIds.size > 0 ? 'apple-btn-primary' : 'apple-btn-ghost'} apple-btn-sm`}
          onClick={handleGeneratePO}
          disabled={selectedIds.size === 0}
        >
          📋 Generate PO ({selectedIds.size})
        </button>
        <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={loadRunway}>
          🔄 Refresh
        </button>
      </div>

      {/* Runway table */}
      <div className="apple-table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="apple-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th>Product</th>
              <th>Stock</th>
              <th>Reorder</th>
              <th>Daily Sales</th>
              <th>Runway</th>
              <th>Lead Time</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSelected = selectedIds.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={`runway-row ${item.is_at_risk ? 'row-risk' : ''} ${item.needs_restock ? 'row-warn' : ''} ${isSelected ? 'row-selected' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="runway-checkbox"
                    />
                  </td>
                  <td>
                    <div className="runway-product-name">{item.name}</div>
                    <div className="runway-product-sku">{item.sku}</div>
                  </td>
                  <td className="runway-cell-num">{item.current_stock}</td>
                  <td className="runway-cell-num">{item.reorder_point}</td>
                  <td className="runway-cell-num">{item.daily_sales_velocity || '—'}</td>
                  <td>
                    <span className={`runway-badge ${item.runway_days === null ? 'badge-neutral' : item.runway_days <= 7 ? 'badge-critical' : item.runway_days <= 30 ? 'badge-warning' : 'badge-ok'}`}>
                      {item.runway_label}
                    </span>
                  </td>
                  <td className="runway-cell-num">{item.supplier_lead_time ? `${item.supplier_lead_time}d` : '—'}</td>
                  <td className="runway-cell-text">{item.supplier_name || '—'}</td>
                  <td>
                    {item.is_at_risk && <span className="runway-tag tag-risk">⚠️ Order Now</span>}
                    {item.needs_restock && !item.is_at_risk && <span className="runway-tag tag-warn">Restock</span>}
                    {!item.needs_restock && !item.is_at_risk && <span className="runway-tag tag-ok">✓ OK</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PO Result */}
      {poResult && (
        <div className="po-result-section">
          <div className="section-title" style={{ marginTop: '24px' }}>
            📋 Purchase Order Preview — ${poResult.total_cost.toFixed(2)}
          </div>
          {poResult.by_supplier.map((supplier, i) => (
            <div key={i} className="apple-card po-supplier-card">
              <div className="po-supplier-header">
                <div>
                  <div className="po-supplier-name">{supplier.supplier_name}</div>
                  <div className="po-supplier-meta">{supplier.items.length} items · ${supplier.total.toFixed(2)} · Lead: {supplier.lead_time}d</div>
                </div>
                <div className="po-supplier-actions">
                  {supplier.email && (
                    <button className="apple-btn apple-btn-primary apple-btn-sm" onClick={() => handleMailto(supplier)}>
                      ✉️ Open Email ({supplier.email})
                    </button>
                  )}
                  <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={() => handleCopyEmail(supplier)}>
                    {copiedIndex === supplier.supplier_name ? '✅ Copied!' : '📋 Copy PO Body'}
                  </button>
                </div>
              </div>
              <div className="po-supplier-items">
                {supplier.items.map((item, j) => (
                  <div key={j} className="po-item">
                    <span className="po-item-name">{item.order_qty}x {item.product_name}</span>
                    <span className="po-item-cost">${item.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RunwayPlanner;