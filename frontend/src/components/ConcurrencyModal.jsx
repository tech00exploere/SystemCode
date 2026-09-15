import React, { useState } from 'react';
import { X, Zap, ShieldCheck } from 'lucide-react';
import { simulateConcurrency } from '../services/api';

export default function ConcurrencyModal({ isOpen, onClose, selectedJob, onRefresh }) {
  const [requestCount, setRequestCount] = useState(100);
  const [targetStatus, setTargetStatus] = useState('running');
  const [running, setRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    if (!selectedJob) {
      setError('Please select a job first');
      return;
    }

    try {
      setRunning(true);
      setError('');
      setBenchmarkResult(null);

      const data = await simulateConcurrency(selectedJob.id, targetStatus, requestCount);
      setBenchmarkResult(data);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run simulation');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Zap size={20} className="modal-title-icon text-warning" />
            <h3>Simulate Race Condition</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="benchmark-config-grid">
            <div className="form-group">
              <label>Selected Job</label>
              <div className="job-select-box">
                {selectedJob ? (
                  <div>
                    <strong>{selectedJob.title}</strong>
                    <div className="sub-text">Status: {selectedJob.status}</div>
                  </div>
                ) : (
                  <div className="text-subtle">No job selected.</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Target Status</label>
              <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} className="form-select" disabled={running}>
                <option value="running">running</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Simultaneous Requests</label>
              <select value={requestCount} onChange={(e) => setRequestCount(Number(e.target.value))} className="form-select" disabled={running}>
                <option value={10}>10 Requests</option>
                <option value={50}>50 Requests</option>
                <option value={100}>100 Requests</option>
                <option value={500}>500 Requests</option>
                <option value={1000}>1000 Requests</option>
              </select>
            </div>
          </div>

          {benchmarkResult && (
            <div className="benchmark-results-card">
              <div className="benchmark-status-banner success">
                <ShieldCheck size={20} />
                <div>
                  <strong>Race Condition Protected!</strong>
                  <div>Executed {benchmarkResult.testSummary.totalConcurrentRequests} requests in {benchmarkResult.testSummary.durationMs}ms ({benchmarkResult.testSummary.throughputReqPerSec} req/sec).</div>
                </div>
              </div>

              <div className="results-metrics-grid">
                <div className="result-metric-card green">
                  <div className="result-value">{benchmarkResult.resultsBreakdown.succeeded}</div>
                  <div className="result-label">Succeeded (200 OK)</div>
                </div>
                <div className="result-metric-card amber">
                  <div className="result-value">{benchmarkResult.resultsBreakdown.conflicts409}</div>
                  <div className="result-label">Conflicts (409)</div>
                </div>
                <div className="result-metric-card blue">
                  <div className="result-value">{benchmarkResult.resultsBreakdown.badRequests400}</div>
                  <div className="result-label">Illegal State (400)</div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={running}>
              Close
            </button>
            <button type="button" onClick={handleRunSimulation} className="btn btn-warning" disabled={running || !selectedJob}>
              {running ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
