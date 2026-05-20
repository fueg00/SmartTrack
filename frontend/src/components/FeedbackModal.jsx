import React, { useState } from 'react';
import * as api from '../api';

function FeedbackModal({ onClose, showToast }) {
  const [category, setCategory] = useState('General Feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.length < 10) {
      alert('Message must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.submitFeedback({
        category,
        subject,
        message,
        current_url: window.location.href,
        browser_info: navigator.userAgent
      });
      showToast('Thank you for your feedback! We\'ll review it shortly.');
      onClose();
    } catch (err) {
      console.error('Failed to submit feedback', err);
      alert(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-card" style={{ maxWidth: '500px' }}>
        <h2>Give Feedback</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="General Feedback">General Feedback</option>
              <option value="Question / Help">Question / Help</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. Can't save new products"
              maxLength="100"
              required 
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Please provide details..."
              rows="5"
              required
            />
            <small style={{ color: '#666' }}>Min 10 characters</small>
          </div>
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
