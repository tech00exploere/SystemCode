import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import MetricsHeader from './components/MetricsHeader';
import JobFilter from './components/JobFilter';
import JobTable from './components/JobTable';
import CreateJobModal from './components/CreateJobModal';
import ConcurrencyModal from './components/ConcurrencyModal';
import { getJobs, createJob, updateJobStatus, deleteJob } from './services/api';

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, running: 0, completed: 0, failed: 0 });
  const [activeStatus, setActiveStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [selectedJobForBenchmark, setSelectedJobForBenchmark] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJobs(activeStatus);
      setJobs(data.jobs || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      showToast('Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

  const handleCreateJob = async (jobData) => {
    const newJob = await createJob(jobData);
    showToast(`Job "${newJob.title}" created!`, 'success');
    fetchJobs();
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await updateJobStatus(id, status);
      showToast(`Status updated to "${updated.status}" (v${updated.version})`, 'success');
      fetchJobs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await deleteJob(id);
      showToast('Job deleted', 'info');
      fetchJobs();
    } catch {
      showToast('Failed to delete job', 'error');
    }
  };

  const handleOpenConcurrencyForJob = (job) => {
    setSelectedJobForBenchmark(job);
    setIsConcurrencyModalOpen(true);
  };

  const handleOpenConcurrencyHeader = () => {
    setSelectedJobForBenchmark(jobs[0] || null);
    setIsConcurrencyModalOpen(true);
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return job.title.toLowerCase().includes(q) || job.type.toLowerCase().includes(q);
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="brand-title">Mini Job Queue Dashboard</h1>
            <p className="brand-subtitle">NestJS + React · State Machine + Concurrency Control</p>
          </div>
        </div>
        <div className="backend-status-badge">
          <Server size={14} /> localhost:3000
        </div>
      </header>

      <MetricsHeader metrics={metrics} activeFilter={activeStatus} onFilterChange={setActiveStatus} />

      <JobFilter
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={fetchJobs}
        loading={loading}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenConcurrencyModal={handleOpenConcurrencyHeader}
      />

      <JobTable
        jobs={filteredJobs}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteJob}
        onOpenConcurrencyModal={handleOpenConcurrencyForJob}
      />

      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateJob}
      />

      <ConcurrencyModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        selectedJob={selectedJobForBenchmark}
        onRefresh={fetchJobs}
      />

      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
