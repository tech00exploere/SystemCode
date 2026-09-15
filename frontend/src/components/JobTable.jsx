import React from 'react';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Zap,
  Clock,
  Check,
  X,
} from 'lucide-react';

export default function JobTable({
  jobs = [],
  loading,
  onUpdateStatus,
  onDelete,
  onOpenConcurrencyModal,
}) {
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending"><Clock size={12} /> Pending</span>;
      case 'running':
        return <span className="badge badge-running"><Play size={12} className="pulse-icon" /> Running</span>;
      case 'completed':
        return <span className="badge badge-completed"><Check size={12} /> Completed</span>;
      case 'failed':
        return <span className="badge badge-failed"><X size={12} /> Failed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="table-empty-state">
        <h4>No jobs found</h4>
        <p>Create a new job to start managing your queue.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="job-table">
        <thead>
          <tr>
            <th>Job Title & Type</th>
            <th>Status</th>
            <th>Version</th>
            <th>Created At</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                <div className="job-info">
                  <span className="job-title">{job.title}</span>
                  <span className="job-type-pill">{job.type}</span>
                </div>
              </td>
              <td>{getStatusBadge(job.status)}</td>
              <td>
                <span className="version-tag">v{job.version || 1}</span>
              </td>
              <td className="text-subtle">{formatDate(job.createdAt)}</td>
              <td>
                <div className="action-buttons">
                  {job.status === 'pending' && (
                    <>
                      <button onClick={() => onUpdateStatus(job.id, 'running')} className="btn-action btn-action-start">
                        <Play size={14} /> Start
                      </button>
                      <button onClick={() => onUpdateStatus(job.id, 'failed')} className="btn-action btn-action-fail">
                        <AlertTriangle size={14} /> Fail
                      </button>
                    </>
                  )}

                  {job.status === 'running' && (
                    <>
                      <button onClick={() => onUpdateStatus(job.id, 'completed')} className="btn-action btn-action-complete">
                        <CheckCircle size={14} /> Complete
                      </button>
                      <button onClick={() => onUpdateStatus(job.id, 'failed')} className="btn-action btn-action-fail">
                        <AlertTriangle size={14} /> Fail
                      </button>
                    </>
                  )}

                  {(job.status === 'completed' || job.status === 'failed') && (
                    <span className="terminal-badge">Locked State</span>
                  )}

                  <button onClick={() => onOpenConcurrencyModal(job)} className="btn-action btn-action-benchmark">
                    <Zap size={14} /> Benchmark
                  </button>

                  <button onClick={() => onDelete(job.id)} className="btn-action btn-action-delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
