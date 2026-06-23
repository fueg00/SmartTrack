import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function SupplierManager() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', lead_time_days: 7, payment_terms: 'Net 30', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.getSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load suppliers'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', lead_time_days: 7, payment_terms: 'Net 30', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', lead_time_days: s.lead_time_days, payment_terms: s.payment_terms || 'Net 30', notes: s.notes || '' });
    setEditing(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.updateSupplier(editing, form);
      } else {
        await api.createSupplier(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save supplier'));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await api.deleteSupplier(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete supplier'));
    }
  };

  if (loading) return <div className="loading-text">Loading suppliers…</div>;

  return (
    <div>
      {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}

      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="h1">Suppliers</div>
          <div className="subhead">Manage your vendors and lead times</div>
        </div>
        <button className="apple-btn apple-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="apple-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>
            {editing ? 'Edit Supplier' : 'New Supplier'}
          </div>
          <div className="product-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input className="apple-input" placeholder="Supplier name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="apple-input" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input className="apple-input" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--apple-system-gray)' }}>Lead Time (days):</label>
              <input className="apple-input" type="number" min="1" style={{ width: '80px' }} value={form.lead_time_days} onChange={e => setForm({...form, lead_time_days: parseInt(e.target.value) || 7})} />
            </div>
            <select className="apple-input" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
            <input className="apple-input" placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="apple-btn apple-btn-primary apple-btn-sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {suppliers.length === 0 ? (
        <div className="apple-card apple-card-sm" style={{ textAlign: 'center', color: 'var(--apple-system-gray)', padding: '40px' }}>
          No suppliers yet. Add one to start tracking vendor lead times.
        </div>
      ) : (
        <div className="apple-table-container">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lead Time</th>
                <th>Payment Terms</th>
                <th>Notes</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td><span className="runway-badge badge-neutral">{s.lead_time_days} day{s.lead_time_days !== 1 ? 's' : ''}</span></td>
                  <td>{s.payment_terms || 'Net 30'}</td>
                  <td style={{ color: 'var(--apple-system-gray)', fontSize: '12px' }}>{s.notes || '—'}</td>
                  <td>
                    <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={() => openEdit(s)}>Edit</button>
                    <button className="apple-btn apple-btn-ghost apple-btn-sm" style={{ color: '#FF3B30' }} onClick={() => handleDelete(s.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SupplierManager;