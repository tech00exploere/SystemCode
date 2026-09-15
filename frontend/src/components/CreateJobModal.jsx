import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';

export default function CreateJobModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Data Ingestion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const jobTypes = [
    'Data Ingestion',
    'ETL Processing',
    'PDF Export',
    'Email Notification',
    'Image Optimization',
    'Backup Generation',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !type.trim()) {
      setError('Title and Type are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onCreate({ title: title.trim(), type: type.trim() });
      setTitle('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <PlusCircle size={20} className="modal-title-icon" />
            <h3>Create New Job</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Job Title</label>
            <input
              type="text"
              placeholder="e.g. Export Sales Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Job Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select"
            >
              {jobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
