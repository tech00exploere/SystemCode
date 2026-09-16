// src/types/index.ts

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type AttemptStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'EVALUATING'
  | 'EVALUATED'
  | 'EVALUATION_FAILED';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  requirements: string[];
  expectedConcepts: string[];
  hints: string[];
  attemptCount: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  attemptId: string;
  textDesign: string;
  classDefinitions: string;
  assumptions: string;
  createdAt: string;
}

export interface FeedbackDimension {
  id: string;
  name: string;
  score: number;
  comment: string;
  suggestions: string[];
}

export interface Feedback {
  id: string;
  attemptId: string;
  overallScore: number;
  ruleScore: number;
  aiScore: number;
  summary: string;
  dimensions: FeedbackDimension[];
  generatedAt: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  problem: Problem;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  submission: Submission | null;
  feedback: Feedback | null;
}

export interface AttemptSummary {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  problem: Pick<Problem, 'id' | 'title' | 'slug' | 'difficulty' | 'category'>;
  feedback: Pick<Feedback, 'overallScore' | 'ruleScore' | 'aiScore' | 'generatedAt'> | null;
}

export interface FeedbackResponse {
  status: AttemptStatus;
  feedback?: Feedback;
  message?: string;
}

export interface SubmitPayload {
  textDesign: string;
  classDefinitions: string;
  assumptions: string;
}
