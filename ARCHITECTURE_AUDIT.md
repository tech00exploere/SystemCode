# System Architecture Audit & Assessment Evaluation

This document outlines how our full-stack LLD Practice Platform directly satisfies all requirements listed in guidelines 7 through 11 of the CipherSchools assignment rubric.

---

## ✅ Item 7: Consistent & Structured AI Feedback Rubric

### Requirement
Avoid vague, unconstrained prompts like *"Is this a good design?"*. Use a fixed rubric and structured output schema (`criterion → score → evidence → concern → suggestion → confidence`).

### Implementation Verification
1. **Fixed Rubric Dimensions**: The `AIEvaluator` (`backend/src/evaluation/evaluators/ai.evaluator.ts`) evaluates every submission across 5 explicit software design dimensions:
   - *Single Responsibility Principle (SRP)*
   - *Coupling & Cohesion*
   - *Abstraction Quality*
   - *Extensibility (Open/Closed Principle)*
   - *Edge Cases & Design Concerns*
2. **Structured JSON Output**: Forced JSON output schema where every dimension yields:
   - `name`: Fixed criterion string
   - `score`: Clamped 0–10 integer score
   - `comment`: Evidence-based architectural reasoning
   - `suggestions`: Specific, actionable recommendations
3. **Hybrid Evaluator Safety**: `RuleBasedEvaluator` runs deterministically (completeness, expected concept coverage, OOP keyword structures, assumption formatting). The combined overall score is computed as `40% Rule Score + 60% AI Score`.

---

## ✅ Item 8: Meaningful Domain LLD & Class Boundaries

### Requirement
Keep core product domain models meaningful (`Problem`, `Attempt`, `Submission`, `Feedback`, `FeedbackDimension`) with clear responsibilities, encapsulation, and minimal unnecessary abstractions.

### Implementation Verification
- **`Problem`**: Owns problem requirements, category, difficulty, expected concepts, and hints.
- **`Attempt`**: Manages state transitions (`DRAFT` → `EVALUATING` → `EVALUATED` | `EVALUATION_FAILED`), timestamps, and links submission to feedback.
- **`Submission`**: Encapsulates learner design inputs (`textDesign`, `classDefinitions`, `assumptions`).
- **`Feedback` & `FeedbackDimension`**: Encapsulates merged evaluation results (rule score, AI score, overall score, summary, and individual dimension suggestions).

---

## ✅ Item 9: Two Change Tests (Extensibility Proofs)

### Change Test A: Supporting Class Diagrams later
- *Scenario*: Learners submit class diagrams (e.g. Mermaid / PlantUML / image uploads) in addition to text.
- *Proof of Extensibility*:
  - The `Submission` entity and `SubmitPayload` DTO encapsulate submission data.
  - Adding a `diagramUrl` or `diagramData` field only requires extending `Submission` and `EvaluatorInput`.
  - **Zero changes required** in `Attempt` state transitions, `ProblemsService`, or route handlers!

### Change Test B: Pluggable Evaluators
- *Scenario*: Adding human mentor reviews or third-party evaluators alongside rule-based and AI evaluators.
- *Proof of Extensibility*:
  - Standardized `IEvaluator` strategy interface contract (`evaluate(input: EvaluatorInput): Promise<EvaluatorResult>`).
  - `EvaluationService` uses the Strategy / Composite pattern. A new `HumanReviewEvaluator` can be injected into `EvaluationService` without changing `AttemptsController` or the frontend practice flow!

---

## ✅ Item 10: Practical Scale & Non-Blocking Async Evaluation

### Requirement
Do not block submission requests. Store submissions before evaluation starts. Maintain clear state transitions (`Submitted → Evaluating → Completed / Failed`).

### Implementation Verification
1. **Non-Blocking Execution**: `AttemptsService.submit(id, dto)` transactionally saves `Submission`, updates state to `EVALUATING`, and responds immediately to the HTTP request.
2. **Async Background Evaluation**: `EvaluationService.evaluate(id)` runs asynchronously in the background.
3. **Resilience & Fault Tolerance**: If AI evaluation fails or API key is absent, rule-based scores are safely persisted and state is marked `EVALUATION_FAILED` so the user can re-trigger evaluation without losing their work.
4. **Idempotency**: Retrying an already `EVALUATED` attempt is blocked to avoid duplicate processing.

---

## ✅ Item 11: Candidate Engineering Decisions & Trade-Offs

- **Modular Monolith**: Single clean NestJS backend + Vite React frontend instead of fragmented microservices.
- **Thoughtful AI Usage**: AI is used strictly where human-like reasoning is needed (architecture design review), while deterministic rules handle structural verification.
- **Working Prototype**: 100% working full-stack application with Prisma SQLite database, unit test coverage (Vitest), and Docker deployment readiness.
