import React from 'react';
import { Search, RotateCw, Plus, Zap } from 'lucide-react';

export default function JobFilter({
  activeStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  loading,
  autoRefresh,
  onToggleAutoRefresh,
  onOpenCreateModal,
  onOpenConcurrencyModal,
}) {
  const statuses = [
    { id: '', label: 'All Jobs' },
    { id: 'pending', label: 'Pending' },
    { id: 'running', label: 'Running' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-search-group">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-pills">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusChange(st.id)}
              className={`status-pill ${activeStatus === st.id ? 'active' : ''}`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="action-buttons-group">
        <button
          onClick={onToggleAutoRefresh}
          className={`btn btn-secondary btn-auto-refresh ${autoRefresh ? 'active' : ''}`}
        >
          <span className={`pulse-dot ${autoRefresh ? 'active' : ''}`}></span>
          Auto-Poll {autoRefresh ? 'ON' : 'OFF'}
        </button>

        <button onClick={onRefresh} disabled={loading} className="btn btn-secondary">
          <RotateCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>

        <button onClick={onOpenConcurrencyModal} className="btn btn-warning">
          <Zap size={16} />
          Simulate Concurrency
        </button>

        <button onClick={onOpenCreateModal} className="btn btn-primary">
          <Plus size={16} />
          New Job
        </button>
      </div>
    </div>
  );
}
