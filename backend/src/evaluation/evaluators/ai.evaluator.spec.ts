// src/evaluation/evaluators/ai.evaluator.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { AIEvaluator } from './ai.evaluator';
import { EvaluatorInput } from './base.evaluator';

const mockInput: EvaluatorInput = {
  problemTitle: 'Design a Parking Lot',
  problemDescription: 'Design a parking lot system.',
  requirements: ['Support multiple levels'],
  expectedConcepts: ['ParkingLot', 'ParkingSpot'],
  textDesign: 'The system manages parking spots across levels.',
  classDefinitions: 'class ParkingLot { }',
  assumptions: 'Single server.',
};

describe('AIEvaluator', () => {
  describe('when GEMINI_API_KEY is not set', () => {
    it('should return a fallback result with score 50', async () => {
      const configService = { get: vi.fn().mockReturnValue(undefined) } as any;
      const evaluator = new AIEvaluator(configService);

      const result = await evaluator.evaluate(mockInput);

      expect(result.score).toBe(50);
      expect(result.dimensions).toHaveLength(5);
      result.dimensions.forEach((d) => {
        expect(d.score).toBe(5);
        expect(d.comment).toContain('unavailable');
      });
    });
  });

  describe('when Gemini returns malformed JSON', () => {
    it('should throw an error (for EvaluationService to catch)', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => 'not valid json at all' },
        }),
      };

      const mockGenAI = { getGenerativeModel: vi.fn().mockReturnValue(mockModel) };
      const configService = { get: vi.fn().mockReturnValue('fake-key') } as any;

      const evaluator = new AIEvaluator(configService);
      (evaluator as any).genAI = mockGenAI;

      await expect(evaluator.evaluate(mockInput)).rejects.toThrow();
    });
  });

  describe('when Gemini returns valid JSON', () => {
    it('should parse and return structured result', async () => {
      const validResponse = JSON.stringify({
        overallComment: 'Good design.',
        dimensions: [
          { name: 'Single Responsibility', score: 7, comment: 'OK', suggestions: [] },
          { name: 'Coupling & Cohesion', score: 6, comment: 'OK', suggestions: ['improve'] },
          { name: 'Abstraction Quality', score: 8, comment: 'Good', suggestions: [] },
          { name: 'Extensibility', score: 7, comment: 'OK', suggestions: [] },
          { name: 'Design Concerns', score: 5, comment: 'Some issues', suggestions: ['fix X'] },
        ],
      });

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => validResponse },
        }),
      };

      const mockGenAI = { getGenerativeModel: vi.fn().mockReturnValue(mockModel) };
      const configService = { get: vi.fn().mockReturnValue('fake-key') } as any;

      const evaluator = new AIEvaluator(configService);
      (evaluator as any).genAI = mockGenAI;

      const result = await evaluator.evaluate(mockInput);

      expect(result.dimensions).toHaveLength(5);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.dimensions[0].name).toBe('Single Responsibility');
      expect(result.dimensions[0].score).toBe(7);
    });

    it('should clamp scores to [0, 10]', async () => {
      const responseWithBadScores = JSON.stringify({
        overallComment: 'Test.',
        dimensions: [
          { name: 'Single Responsibility', score: 15, comment: 'OK', suggestions: [] },
          { name: 'Coupling & Cohesion', score: -5, comment: 'OK', suggestions: [] },
          { name: 'Abstraction Quality', score: 8, comment: 'OK', suggestions: [] },
          { name: 'Extensibility', score: 7, comment: 'OK', suggestions: [] },
          { name: 'Design Concerns', score: 5, comment: 'OK', suggestions: [] },
        ],
      });

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => responseWithBadScores },
        }),
      };

      const mockGenAI = { getGenerativeModel: vi.fn().mockReturnValue(mockModel) };
      const configService = { get: vi.fn().mockReturnValue('fake-key') } as any;

      const evaluator = new AIEvaluator(configService);
      (evaluator as any).genAI = mockGenAI;

      const result = await evaluator.evaluate(mockInput);

      result.dimensions.forEach((d) => {
        expect(d.score).toBeGreaterThanOrEqual(0);
        expect(d.score).toBeLessThanOrEqual(10);
      });
    });
  });
});
