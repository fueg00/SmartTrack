import React, { useState } from 'react';

function StockAdjustmentForm({ product, onClose, onSubmit }) {
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState('add') // add, remove
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
        <h2>Adjust Stock: {product.name}</h2>
        <p>Current Stock: <strong>{product.current_stock}</strong></p>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const change = type === 'add' ? parseInt(amount) : -parseInt(amount);
          onSubmit({ change_amount: change, reason }); 
        }}>
          <div className="form-group">
            <label>Adjustment Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className={`btn ${type === 'add' ? 'btn-success' : ''}`} 
                style={{ flex: 1, border: '1px solid #ccc' }}
                onClick={() => setType('add')}
              >
                Add Stock
              </button>
              <button 
                type="button" 
                className={`btn ${type === 'remove' ? 'btn-danger' : ''}`}
                style={{ flex: 1, border: '1px solid #ccc' }}
                onClick={() => setType('remove')}
              >
                Remove Stock
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required />
          </div>
          <div className="form-group">
            <label>Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} required>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Inventory</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockAdjustmentForm;
