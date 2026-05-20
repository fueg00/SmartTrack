import React, { useState, useEffect } from 'react';
import * as api from '../api';

function ProductList({ categories, onAdd, onEdit, onAdjustStock }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchProducts = () => {
    setLoading(true)
    api.getProducts({ search, category_id: categoryId })
      .then(res => {
        setProducts(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
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
    <div className="product-catalog">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search Name or SKU..." 
          style={{ flex: 1, padding: '8px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Product</button>
      </div>

      {loading ? <p>Loading products...</p> : (
        <table>
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
            {products.length === 0 ? (
              <tr><td colSpan="6">No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td data-label="Name">{p.name}</td>
                  <td data-label="SKU">{p.sku}</td>
                  <td data-label="Category">{p.category_name || 'N/A'}</td>
                  <td data-label="Stock" className={p.current_stock <= p.reorder_point ? 'low-stock' : ''}>
                    {p.current_stock}
                  </td>
                  <td data-label="Price">${p.unit_price.toFixed(2)}</td>
                  <td data-label="Actions">
                    <button className="btn btn-warning" onClick={() => onAdjustStock(p)}>Stock</button>
                    <button className="btn btn-primary" onClick={() => onEdit(p)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ProductList;
