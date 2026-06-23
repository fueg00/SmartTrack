import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [seats, setSeats] = useState({ used: 0, limit: 1, tier: 'Free' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Manager' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const isOwner = user?.role === 'Owner';

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data.users);
      setSeats(res.data.seats);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load users'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.inviteUser(inviteForm);
      setShowInvite(false);
      setInviteForm({ email: '', role: 'Manager' });
      showToast('User invited! Check server logs for credentials.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to invite user'));
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      showToast('Role updated');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleRemove = async (userId, email) => {
    if (!window.confirm(`Remove ${email}?`)) return;
    try {
      await api.deleteUser(userId);
      showToast('User removed');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove user'));
    }
  };

  if (loading) return <div className="loading-text">Loading users…</div>;

  return (
    <div>
      {toast && <div className="apple-toast">{toast}</div>}
      {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}

      {/* Seats Usage Card */}
      <div className="apple-card" style={{ padding: '18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Team Seats</div>
          <div style={{ fontSize: '12px', color: 'var(--apple-system-gray)', marginTop: '4px' }}>
            {seats.used} of {seats.limit === Infinity ? '∞' : seats.limit} used · {seats.tier} tier
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="seat-bar">
            <div
              className="seat-bar-fill"
              style={{ width: `${Math.min(100, (seats.used / (seats.limit || 1)) * 100)}%` }}
            />
          </div>
          {isOwner && seats.used < seats.limit && (
            <button className="apple-btn apple-btn-primary apple-btn-sm" onClick={() => setShowInvite(true)}>
              + Invite
            </button>
          )}
        </div>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="apple-card" style={{ padding: '18px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Invite Team Member</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              className="apple-input"
              placeholder="Email address"
              type="email"
              value={inviteForm.email}
              onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select
              className="apple-input"
              value={inviteForm.role}
              onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
              style={{ width: '130px' }}
            >
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
            <button className="apple-btn apple-btn-primary apple-btn-sm" onClick={handleInvite} disabled={saving || !inviteForm.email.trim()}>
              {saving ? 'Sending…' : 'Send Invite'}
            </button>
            <button className="apple-btn apple-btn-ghost apple-btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--apple-system-gray)', marginTop: '8px' }}>
            Demo mode: credentials will be logged to the server console.
          </div>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="apple-card apple-card-sm" style={{ textAlign: 'center', color: 'var(--apple-system-gray)', padding: '40px' }}>
          No users yet.
        </div>
      ) : (
        <div className="apple-table-container">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                {isOwner && <th style={{ width: '120px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.email}</td>
                  <td>
                    {u.id === user?.id ? (
                      <span className="tier-badge" style={{ background: 'var(--apple-blue)', color: 'white', fontSize: '11px' }}>{u.role}</span>
                    ) : isOwner ? (
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Manager">Manager</option>
                        <option value="Staff">Staff</option>
                      </select>
                    ) : (
                      <span>{u.role}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--apple-system-gray)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td>
                      {u.id !== user?.id && (
                        <button
                          className="apple-btn apple-btn-ghost apple-btn-sm"
                          style={{ color: '#FF3B30' }}
                          onClick={() => handleRemove(u.id, u.email)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;