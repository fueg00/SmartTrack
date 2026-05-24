import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function ProductList({ categories, onAdd, onEdit, onAdjustStock }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = () => {
    setLoading(true)
    setError(null)
    api.getProducts({ search, category_id: categoryId })
      .then(res => {
        setProducts(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(getErrorMessage(err, 'Failed to load products'))
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProducts()
  }, [search, categoryId])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await api.deleteProduct(id)
      fetchProducts()
    }
  }

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '24px' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="apple-input" 
            placeholder="Search name or SKU…"
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="apple-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="apple-btn apple-btn-primary" onClick={onAdd}>+ Add Product</button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-container" style={{ marginBottom: '20px' }}>
          <div className="error-message">{error}</div>
          <button className="apple-btn apple-btn-primary" onClick={fetchProducts}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-text">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="apple-card apple-card-sm" style={{ textAlign: 'center', color: 'var(--apple-system-gray)' }}>
          No products found. Add your first product to get started.
        </div>
      ) : (
        /* Table */
        <div className="apple-table-wrapper">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td data-label="Name">{p.name}</td>
                  <td data-label="SKU" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px' }}>{p.sku}</td>
                  <td data-label="Category">{p.category_name || 'N/A'}</td>
                  <td data-label="Stock" className={p.current_stock <= p.reorder_point ? 'low-stock-label' : ''}>
                    {p.current_stock}
                  </td>
                  <td data-label="Price">${p.unit_price.toFixed(2)}</td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      <button className="apple-btn apple-btn-sm apple-btn-secondary" onClick={() => onAdjustStock(p)}>Stock</button>
                      <button className="apple-btn apple-btn-sm apple-btn-primary" onClick={() => onEdit(p)}>Edit</button>
                      <button className="apple-btn apple-btn-sm apple-btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProductList;