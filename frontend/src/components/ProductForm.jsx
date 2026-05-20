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
        <h2>{title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="form-group">
            <label>Product Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input name="sku" value={formData.sku} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Unit Price ($)</label>
              <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Unit Cost ($)</label>
              <input type="number" step="0.01" name="unit_cost" value={formData.unit_cost} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Reorder Point</label>
            <input type="number" name="reorder_point" value={formData.reorder_point} onChange={handleChange} required />
          </div>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm;
