// src/pages/FeedbackPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Attempt, Feedback, FeedbackDimension } from '../types';
import './FeedbackPage.css';

const RULE_DIMS = new Set([
  'Submission Completeness',
  'Concept Coverage',
  'Code Structure',
  'Assumptions Quality',
  'Requirements Coverage',
]);

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="score-ring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="score-ring__value" style={{ color }}>
        {score}
      </div>
    </div>
  );
}

function DimensionCard({ dim }: { dim: FeedbackDimension }) {
  const isRule = RULE_DIMS.has(dim.name);
  const color =
    dim.score >= 7 ? 'var(--success)' : dim.score >= 4 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="dimension-card fade-up">
      <div className="dimension-card__header">
        <div className="dimension-card__name-row">
          <span className={`dimension-tag ${isRule ? 'rule' : 'ai'}`}>
            {isRule ? '✓ Rule-based' : '✦ AI'}
          </span>
          <h3 className="dimension-card__name">{dim.name}</h3>
        </div>
        <div className="dimension-card__score" style={{ color }}>
          {dim.score}/10
        </div>
      </div>

      <div className="dimension-card__bar">
        <div
          className="dimension-card__fill"
          style={{ width: `${dim.score * 10}%`, background: color }}
        />
      </div>

      <p className="dimension-card__comment">{dim.comment}</p>

      {dim.suggestions.length > 0 && (
        <ul className="dimension-card__suggestions">
          {dim.suggestions.map((s, i) => (
            <li key={i}>
              <span className="suggestion-icon">→</span> {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EvaluatingState({ onRefresh }: { onRefresh: () => void }) {
  useEffect(() => {
    const id = setInterval(onRefresh, 3000);
    return () => clearInterval(id);
  }, [onRefresh]);

  return (
    <div className="feedback-evaluating">
      <div className="feedback-evaluating__anim">
        <span className="spinner spinner--lg" />
      </div>
      <h2>Evaluating your submission…</h2>
      <p>
        Rule-based checks are running. The AI is reasoning about your design.
        <br />
        This usually takes 5–15 seconds.
      </p>
      <div className="feedback-evaluating__steps">
        {['Running rule-based checks', 'Sending to Gemini AI', 'Combining results', 'Storing feedback'].map((s) => (
          <div key={s} className="eval-step">
            <span className="spinner spinner--xs" /> {s}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedbackPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!attemptId) return;
    try {
      const [attemptData, feedbackData] = await Promise.all([
        api.attempts.get(attemptId),
        api.attempts.getFeedback(attemptId),
      ]);
      setAttempt(attemptData);
      setStatus(feedbackData.status);
      if (feedbackData.feedback) {
        setFeedback(feedbackData.feedback);
      }
    } catch {
      setError('Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const ruleDims = feedback?.dimensions.filter((d) => RULE_DIMS.has(d.name)) ?? [];
  const aiDims = feedback?.dimensions.filter((d) => !RULE_DIMS.has(d.name)) ?? [];

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="feedback-loading">
            <span className="spinner" /> Loading feedback…
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="container">
          <div className="feedback-error">{error}</div>
        </div>
      </main>
    );
  }

  if (status === 'EVALUATING' || (status === 'SUBMITTED' && !feedback)) {
    return (
      <main className="page">
        <div className="container">
          <EvaluatingState onRefresh={fetchFeedback} />
        </div>
      </main>
    );
  }

  if (!feedback) {
    return (
      <main className="page">
        <div className="container">
          <div className="feedback-empty">
            <p>No feedback available yet. Submit your design first.</p>
            <button className="btn btn--primary" onClick={() => navigate(`/practice/${attemptId}`)}>
              Go to Practice
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        {/* Header */}
        <div className="feedback-header fade-up">
          <div>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')}>
              ← Problems
            </button>
            <h1 className="feedback-header__title">Evaluation Results</h1>
            {attempt?.problem && (
              <p className="feedback-header__problem">{attempt.problem.title}</p>
            )}
          </div>
          <div className="feedback-header__actions">
            <button
              className="btn btn--secondary"
              onClick={() => navigate(`/practice/${attemptId}`)}
            >
              Review Submission
            </button>
            {attempt?.problem && (
              <button
                className="btn btn--primary"
                onClick={async () => {
                  const newAttempt = await api.attempts.create(attempt.problem.id);
                  navigate(`/practice/${newAttempt.id}`);
                }}
                id="try-again-btn"
              >
                Try Again →
              </button>
            )}
          </div>
        </div>

        {/* Score Overview */}
        <div className="feedback-overview fade-up">
          <div className="feedback-scores">
            <div className="score-box score-box--overall">
              <ScoreRing score={feedback.overallScore} />
              <div className="score-box__info">
                <span className="score-box__label">Overall Score</span>
                <span className="score-box__sub">40% rule-based + 60% AI</span>
              </div>
            </div>
            <div className="score-divider" />
            <div className="score-box">
              <div className="score-box__num" style={{ color: 'var(--accent)' }}>
                {feedback.ruleScore}
              </div>
              <span className="score-box__label">Rule-based</span>
              <span className="score-box__sub">Deterministic checks</span>
            </div>
            <div className="score-box">
              <div className="score-box__num" style={{ color: 'var(--primary)' }}>
                {feedback.aiScore}
              </div>
              <span className="score-box__label">AI Score</span>
              <span className="score-box__sub">Design reasoning</span>
            </div>
          </div>

          <div className="feedback-summary">
            <h3>Summary</h3>
            <p>{feedback.summary}</p>
            {status === 'EVALUATION_FAILED' && (
              <div className="feedback-failed-note">
                ⚠ AI evaluation encountered an issue. Only rule-based scores are shown.
              </div>
            )}
          </div>
        </div>

        {/* Dimensions */}
        <div className="feedback-dimensions">
          {ruleDims.length > 0 && (
            <section>
              <h2 className="dimensions-heading">
                <span className="dim-tag dim-tag--rule">✓ Rule-based</span>
                Deterministic Checks
              </h2>
              <div className="dimensions-grid">
                {ruleDims.map((d) => (
                  <DimensionCard key={d.id} dim={d} />
                ))}
              </div>
            </section>
          )}

          {aiDims.length > 0 && (
            <section>
              <h2 className="dimensions-heading">
                <span className="dim-tag dim-tag--ai">✦ AI</span>
                Design Quality
              </h2>
              <div className="dimensions-grid">
                {aiDims.map((d) => (
                  <DimensionCard key={d.id} dim={d} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
