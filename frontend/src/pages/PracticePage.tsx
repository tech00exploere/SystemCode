// src/pages/PracticePage.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Attempt } from '../types';
import './PracticePage.css';

/** Live elapsed-time counter from attempt start */
function useElapsed(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState('00:00');
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      setElapsed(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

export function PracticePage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'hints'>('problem');

  // Submission fields
  const [textDesign, setTextDesign] = useState('');
  const [classDefinitions, setClassDefinitions] = useState('');
  const [assumptions, setAssumptions] = useState('');

  const elapsed = useElapsed(attempt?.startedAt);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!attemptId) return;
    api.attempts
      .get(attemptId)
      .then((a) => {
        setAttempt(a);
        if (a.submission) {
          setTextDesign(a.submission.textDesign);
          setClassDefinitions(a.submission.classDefinitions);
          setAssumptions(a.submission.assumptions);
        }
      })
      .catch(() => setError('Failed to load attempt.'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const canSubmit =
    textDesign.trim().length >= 50 &&
    classDefinitions.trim().length >= 30 &&
    assumptions.trim().length >= 20;

  const handleSubmit = async () => {
    if (!attemptId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.attempts.submit(attemptId, {
        textDesign,
        classDefinitions,
        assumptions,
      });
      navigate(`/feedback/${attemptId}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="practice-loading">
            <span className="spinner" /> Loading problem…
          </div>
        </div>
      </main>
    );
  }

  if (error && !attempt) {
    return (
      <main className="page">
        <div className="container">
          <div className="practice-error">{error}</div>
        </div>
      </main>
    );
  }

  const problem = attempt?.problem;

  return (
    <main className="page">
      <div className="practice-layout">
        {/* ── Left: Problem Panel ─── */}
        <aside className="problem-panel">
          <div className="problem-panel__top">
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')}>
              ← Back
            </button>
            <div className="problem-panel__timer" title="Time elapsed">
              ⏱ {elapsed}
            </div>
          </div>

          <div className="problem-panel__tabs">
            <button
              className={`tab ${activeTab === 'problem' ? 'active' : ''}`}
              onClick={() => setActiveTab('problem')}
            >
              Problem
            </button>
            <button
              className={`tab ${activeTab === 'hints' ? 'active' : ''}`}
              onClick={() => setActiveTab('hints')}
            >
              Hints
            </button>
          </div>

          <div className="problem-panel__body">
            {activeTab === 'problem' && problem && (
              <>
                <div className="pp-meta">
                  <span className={`badge badge--${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                  <span className="pp-category">{problem.category}</span>
                </div>

                <h1 className="pp-title">{problem.title}</h1>
                <p className="pp-desc">{problem.description}</p>

                <div className="pp-section">
                  <h3>Requirements</h3>
                  <ol className="pp-requirements">
                    {problem.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {activeTab === 'hints' && problem && (
              <div className="pp-section">
                <h3>Hints</h3>
                <ul className="pp-hints">
                  {problem.hints.map((h, i) => (
                    <li key={i}>
                      <span className="hint-icon">💡</span> {h}
                    </li>
                  ))}
                </ul>
                <div className="pp-hint-note">
                  Hints are meant to guide, not give away. Try to reason through them first.
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: Editor Panel ─── */}
        <section className="editor-panel">
          <div className="editor-panel__header">
            <span className="editor-panel__title">Your Design</span>
            <span className="editor-panel__status">
              {attempt?.status === 'DRAFT' && 'Draft'}
              {attempt?.status === 'EVALUATED' && '✓ Already evaluated'}
              {attempt?.status === 'EVALUATING' && '⏳ Evaluating…'}
            </span>
          </div>

          <div className="editor-sections">
            {/* Section 1 */}
            <div className="editor-section">
              <label className="editor-label" htmlFor="text-design">
                Design Explanation
                <span className="editor-label__hint">
                  Describe your overall approach. How does the system work?
                </span>
              </label>
              <textarea
                id="text-design"
                ref={textRef}
                className="editor-textarea"
                placeholder="Describe your design approach. Cover the main entities, their relationships, how the core flow works, and the key design decisions you made..."
                value={textDesign}
                onChange={(e) => setTextDesign(e.target.value)}
                rows={10}
              />
              <div className="editor-char-count">
                {textDesign.length} chars {textDesign.trim().length < 50 && '(min 50)'}
              </div>
            </div>

            {/* Section 2 */}
            <div className="editor-section">
              <label className="editor-label" htmlFor="class-defs">
                Class / Interface Definitions
                <span className="editor-label__hint">
                  Write your classes, interfaces, enums in any language or pseudo-code.
                </span>
              </label>
              <textarea
                id="class-defs"
                className="editor-textarea editor-textarea--mono"
                placeholder={`interface IVehicle {\n  getType(): VehicleType\n  getLicensePlate(): string\n}\n\nclass Car implements IVehicle {\n  constructor(private plate: string) {}\n  getType() { return VehicleType.CAR }\n  getLicensePlate() { return this.plate }\n}\n\nenum VehicleType { CAR, MOTORCYCLE, BUS }`}
                value={classDefinitions}
                onChange={(e) => setClassDefinitions(e.target.value)}
                rows={14}
              />
              <div className="editor-char-count">
                {classDefinitions.length} chars {classDefinitions.trim().length < 30 && '(min 30)'}
              </div>
            </div>

            {/* Section 3 */}
            <div className="editor-section">
              <label className="editor-label" htmlFor="assumptions">
                Assumptions
                <span className="editor-label__hint">
                  What are you assuming? What's out of scope?
                </span>
              </label>
              <textarea
                id="assumptions"
                className="editor-textarea"
                placeholder={`- Single server (no distributed system)\n- Assume 100 concurrent users max\n- No authentication required\n- Out of scope: payment processing, reservations\n- Vehicle data is pre-validated at entry`}
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                rows={6}
              />
              <div className="editor-char-count">
                {assumptions.length} chars {assumptions.trim().length < 20 && '(min 20)'}
              </div>
            </div>
          </div>

          {/* Submit bar */}
          <div className="editor-submit-bar">
            {error && <div className="editor-error">{error}</div>}
            <div className="editor-submit-bar__actions">
              {!canSubmit && (
                <span className="editor-submit-bar__hint">
                  Fill all three sections to unlock submission
                </span>
              )}
              <button
                id="submit-btn"
                className="btn btn--primary btn--lg"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <><span className="spinner" /> Submitting & Evaluating…</>
                ) : (
                  'Submit for Evaluation →'
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
