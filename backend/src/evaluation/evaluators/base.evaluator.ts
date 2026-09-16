// src/evaluation/evaluators/base.evaluator.ts

/**
 * The result from a single evaluator.
 * Score is 0-100 for the whole submission.
 */
export interface EvaluatorResult {
  score: number;
  dimensions: DimensionResult[];
}

export interface DimensionResult {
  name: string;
  score: number;       // 0–10
  comment: string;
  suggestions: string[];
}

/**
 * Contract for all evaluators.
 * Each evaluator receives the raw submission text and the problem's expected concepts.
 */
export interface IEvaluator {
  evaluate(input: EvaluatorInput): Promise<EvaluatorResult>;
}

export interface EvaluatorInput {
  problemTitle: string;
  problemDescription: string;
  requirements: string[];
  expectedConcepts: string[];
  textDesign: string;
  classDefinitions: string;
  assumptions: string;
}
