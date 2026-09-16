import axios from 'axios';
import type {
  Problem,
  Attempt,
  AttemptSummary,
  FeedbackResponse,
  SubmitPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  problems: {
    list: (): Promise<Problem[]> =>
      http.get('/problems').then((r) => r.data),

    get: (id: string): Promise<Problem> =>
      http.get(`/problems/${id}`).then((r) => r.data),
  },

  attempts: {
    create: (problemId: string): Promise<Attempt> =>
      http.post('/attempts', { problemId }).then((r) => r.data),

    list: (): Promise<AttemptSummary[]> =>
      http.get('/attempts').then((r) => r.data),

    get: (id: string): Promise<Attempt> =>
      http.get(`/attempts/${id}`).then((r) => r.data),

    submit: (id: string, payload: SubmitPayload): Promise<Attempt> =>
      http.post(`/attempts/${id}/submit`, payload).then((r) => r.data),

    getFeedback: (id: string): Promise<FeedbackResponse> =>
      http.get(`/attempts/${id}/feedback`).then((r) => r.data),
  },
};
