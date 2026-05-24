import React, { useState } from 'react';

function StockAdjustmentForm({ product, onClose, onSubmit }) {
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState('add')
  const [reason, setReason] = useState('New Shipment')

  const reasons = [
    'New Shipment',
    'Sale',
    'Damage',
    'Return',
    'Correction'
  ]

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Adjust Stock</div>
        <div className="apple-card apple-card-sm" style={{ marginBottom: '24px', background: 'var(--apple-system-gray-6)' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
          <div className="subhead" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>SKU: {product.sku}</span>
            <span>Current Stock: <strong style={{ color: 'var(--apple-black)' }}>{product.current_stock}</strong></span>
          </div>
        </div>

        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const change = type === 'add' ? parseInt(amount) : -parseInt(amount);
          onSubmit({ change_amount: change, reason }); 
        }}>
          <div className="apple-form-group">
            <label className="apple-form-label">Adjustment Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className={`apple-btn ${type === 'add' ? 'apple-btn-success' : 'apple-btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setType('add')}
              >
                + Add Stock
              </button>
              <button 
                type="button" 
                className={`apple-btn ${type === 'remove' ? 'apple-btn-danger' : 'apple-btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setType('remove')}
              >
                − Remove Stock
              </button>
            </div>
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Amount</label>
            <input className="apple-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required placeholder="Enter quantity" />
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Reason</label>
            <select className="apple-select" value={reason} onChange={(e) => setReason(e.target.value)} required>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="apple-btn apple-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="apple-btn apple-btn-primary">Update Inventory</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockAdjustmentForm;