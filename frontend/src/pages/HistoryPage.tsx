// src/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { AttemptSummary } from '../types';
import './HistoryPage.css';

export function HistoryPage() {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.attempts
      .list()
      .then((data) => {
        setAttempts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load attempt history');
        setLoading(false);
      });
  }, []);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="status-badge draft">Draft</span>;
      case 'SUBMITTED':
      case 'EVALUATING':
        return <span className="status-badge evaluating">Evaluating...</span>;
      case 'EVALUATED':
        return <span className="status-badge evaluated">Evaluated</span>;
      default:
        return <span className="status-badge failed">Failed</span>;
    }
  };

  if (loading) {
    return (
      <div className="history-page loading-container">
        <div className="spinner"></div>
        <p>Loading your attempt history...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <div>
            <h1>Attempt History</h1>
            <p className="history-subtitle">
              Track your low-level design submissions and AI feedback over time.
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Practice New Problem
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {attempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No attempts yet</h3>
            <p>Select a problem from the catalog to begin your design practice.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Browse Problems
            </button>
          </div>
        ) : (
          <div className="history-grid">
            {attempts.map((attempt) => {
              const overallScore = attempt.feedback?.overallScore;
              return (
                <div
                  key={attempt.id}
                  className="history-card"
                  onClick={() => {
                    if (attempt.status === 'DRAFT') {
                      navigate(`/practice/${attempt.id}`);
                    } else {
                      navigate(`/feedback/${attempt.id}`);
                    }
                  }}
                >
                  <div className="card-top">
                    <div className="problem-meta">
                      <span className={`diff-pill ${attempt.problem.difficulty.toLowerCase()}`}>
                        {attempt.problem.difficulty}
                      </span>
                      <span className="category-pill">{attempt.problem.category}</span>
                    </div>
                    {getStatusBadge(attempt.status)}
                  </div>

                  <h3 className="card-title">{attempt.problem.title}</h3>

                  <div className="card-body">
                    <div className="time-info">
                      <span className="time-label">Started:</span>{' '}
                      {formatDate(attempt.startedAt)}
                    </div>
                    {attempt.submittedAt && (
                      <div className="time-info">
                        <span className="time-label">Submitted:</span>{' '}
                        {formatDate(attempt.submittedAt)}
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    {overallScore !== undefined ? (
                      <div className="score-summary">
                        <div
                          className="score-pill"
                          style={{
                            borderColor: getScoreColor(overallScore),
                            color: getScoreColor(overallScore),
                          }}
                        >
                          <span className="score-num">{overallScore}</span>
                          <span className="score-denom">/100</span>
                        </div>
                        <div className="sub-scores">
                          <span>Rule: {attempt.feedback?.ruleScore}/100</span>
                          <span>AI: {attempt.feedback?.aiScore}/100</span>
                        </div>
                      </div>
                    ) : (
                      <span className="no-score">
                        {attempt.status === 'DRAFT'
                          ? 'In progress — Click to continue'
                          : 'Evaluation pending...'}
                      </span>
                    )}
                    <span className="arrow-icon">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
