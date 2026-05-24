import React, { useState } from 'react';
import * as api from '../api';
import { getErrorMessage } from '../utils/errorHandler';

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
      alert(getErrorMessage(err, 'Failed to submit feedback. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Give Feedback</div>
        <form onSubmit={handleSubmit}>
          <div className="apple-form-group">
            <label className="apple-form-label">Category</label>
            <select 
              className="apple-select"
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
          <div className="apple-form-group">
            <label className="apple-form-label">Subject</label>
            <input 
              className="apple-input"
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. Can't save new products"
              maxLength="100"
              required 
            />
          </div>
          <div className="apple-form-group">
            <label className="apple-form-label">Message</label>
            <textarea 
              className="apple-textarea"
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Please provide details…"
              rows="5"
              required
            />
            <div className="footnote" style={{ marginTop: '6px' }}>Min 10 characters</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="apple-btn apple-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="apple-btn apple-btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;