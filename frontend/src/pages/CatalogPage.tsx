// src/pages/CatalogPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Problem, Difficulty } from '../types';
import './CatalogPage.css';

const DIFF_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

function DiffBadge({ d }: { d: Difficulty }) {
  return <span className={`badge badge--${d.toLowerCase()}`}>{DIFF_LABEL[d]}</span>;
}

function ProblemCard({
  problem,
  onStart,
  loading,
}: {
  problem: Problem;
  onStart: (id: string) => void;
  loading: boolean;
}) {
  return (
    <article className="problem-card fade-up">
      <div className="problem-card__header">
        <span className="problem-card__category">{problem.category}</span>
        <DiffBadge d={problem.difficulty} />
      </div>

      <h2 className="problem-card__title">{problem.title}</h2>
      <p className="problem-card__desc">{problem.description.slice(0, 160)}…</p>

      <div className="problem-card__reqs">
        <span className="problem-card__reqs-label">Requirements</span>
        <ul>
          {problem.requirements.slice(0, 4).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
          {problem.requirements.length > 4 && (
            <li className="more">+{problem.requirements.length - 4} more</li>
          )}
        </ul>
      </div>

      <div className="problem-card__footer">
        <span className="problem-card__attempts">
          {problem.attemptCount} attempt{problem.attemptCount !== 1 ? 's' : ''}
        </span>
        <button
          className="btn btn--primary"
          onClick={() => onStart(problem.id)}
          disabled={loading}
          id={`start-problem-${problem.slug}`}
        >
          {loading ? (
            <>
              <span className="spinner" /> Starting…
            </>
          ) : (
            'Start Practice →'
          )}
        </button>
      </div>
    </article>
  );
}

export function CatalogPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.problems
      .list()
      .then(setProblems)
      .catch(() => setError('Failed to load problems. Is the backend running?'))
      .finally(() => setFetching(false));
  }, []);

  const handleStart = async (problemId: string) => {
    setLoadingId(problemId);
    try {
      const attempt = await api.attempts.create(problemId);
      navigate(`/practice/${attempt.id}`);
    } catch {
      setError('Could not start attempt. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className="page">
      <div className="container">
        {/* Hero */}
        <section className="catalog-hero fade-up">
          <div className="catalog-hero__tag">Low-Level Design Practice</div>
          <h1 className="catalog-hero__title">
            Master <span>System Design</span>
            <br />
            through structured practice
          </h1>
          <p className="catalog-hero__sub">
            Pick a problem, write your design, get detailed feedback from rule-based
            checks&nbsp;&amp;&nbsp;AI reasoning — then iterate.
          </p>

          <div className="catalog-hero__flow">
            {['Choose Problem', 'Design', 'Submit', 'AI Feedback', 'Review', 'Try Again'].map(
              (step, i) => (
                <div key={step} className="flow-step">
                  <span className="flow-step__num">{i + 1}</span>
                  <span className="flow-step__label">{step}</span>
                  {i < 5 && <span className="flow-step__arrow">→</span>}
                </div>
              ),
            )}
          </div>
        </section>

        {/* Problems */}
        <section className="catalog-problems">
          <h2 className="catalog-problems__heading">
            Available Problems
            <span className="catalog-problems__count">{problems.length}</span>
          </h2>

          {fetching && (
            <div className="catalog-loading">
              <span className="spinner" /> Loading problems…
            </div>
          )}

          {error && <div className="catalog-error">{error}</div>}

          {!fetching && !error && (
            <div className="catalog-grid">
              {problems.map((p) => (
                <ProblemCard
                  key={p.id}
                  problem={p}
                  onStart={handleStart}
                  loading={loadingId === p.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
