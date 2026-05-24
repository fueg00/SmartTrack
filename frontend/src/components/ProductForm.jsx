import React, { useState } from 'react';

function ProductForm({ title, product, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState(product || {
    name: '',
    sku: '',
    category_id: '',
    description: '',
    unit_price: 0,
    unit_cost: 0,
    reorder_point: 0
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="apple-form-group">
            <label className="apple-form-label">Product Name</label>
            <input className="apple-input" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. iPhone 15 Pro" />
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">SKU</label>
            <input className="apple-input" name="sku" value={formData.sku} onChange={handleChange} required placeholder="e.g. IP15-PM-256" />
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Category</label>
            <select className="apple-select" name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Description</label>
            <textarea className="apple-textarea" name="description" value={formData.description} onChange={handleChange} placeholder="Optional description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="apple-form-group">
              <label className="apple-form-label">Unit Price ($)</label>
              <input className="apple-input" type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} required />
            </div>
            <div className="apple-form-group">
              <label className="apple-form-label">Unit Cost ($)</label>
              <input className="apple-input" type="number" step="0.01" name="unit_cost" value={formData.unit_cost} onChange={handleChange} required />
            </div>
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Reorder Point</label>
            <input className="apple-input" type="number" name="reorder_point" value={formData.reorder_point} onChange={handleChange} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="apple-btn apple-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="apple-btn apple-btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm;