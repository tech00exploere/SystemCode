// src/evaluation/evaluators/ai.evaluator.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IEvaluator,
  EvaluatorInput,
  EvaluatorResult,
  DimensionResult,
} from './base.evaluator';

@Injectable()
export class AIEvaluator implements IEvaluator {
  private readonly logger = new Logger(AIEvaluator.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY not set — AI evaluation will return fallback scores.');
    }
  }

  async evaluate(input: EvaluatorInput): Promise<EvaluatorResult> {
    if (!this.genAI) {
      return this.fallbackResult('Gemini API key not configured.');
    }

    try {
      const prompt = this.buildPrompt(input);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.parseResponse(text);
    } catch (err) {
      this.logger.error('AI evaluation failed', err);
      throw err;
    }
  }

  private buildPrompt(input: EvaluatorInput): string {
    return `You are a friendly, experienced Staff System Architect providing direct, human code-review feedback to a software developer.

Problem: "${input.problemTitle}" (${input.problemDescription})

Developer's Submission:
- High-Level Approach: ${input.textDesign}
- Classes & Interfaces:
${input.classDefinitions}
- Key Assumptions: ${input.assumptions}

Evaluate this design constructively as a peer across these 5 dimensions:
1. Single Responsibility (Are class roles focused and intuitive?)
2. Coupling & Cohesion (Are modules decoupled with clear boundaries?)
3. Abstraction Quality (Are interfaces & abstractions well-designed?)
4. Extensibility (Can new features be added without rewriting existing code?)
5. Edge Cases & Concerns (Are concurrency, scale, or failure states addressed?)

Write feedback in a human, encouraging, direct tone. Keep comments concise (1-2 clear sentences) and suggestions brief and actionable.

Respond in strict JSON with no markdown fences:
{
  "overallComment": "Concise 2-sentence summary from a mentor perspective",
  "dimensions": [
    { "name": "Single Responsibility", "score": 8, "comment": "...", "suggestions": ["..."] },
    { "name": "Coupling & Cohesion", "score": 7, "comment": "...", "suggestions": ["..."] },
    { "name": "Abstraction Quality", "score": 8, "comment": "...", "suggestions": [] },
    { "name": "Extensibility", "score": 7, "comment": "...", "suggestions": ["..."] },
    { "name": "Design Concerns", "score": 6, "comment": "...", "suggestions": ["..."] }
  ]
}`;
  }

  private parseResponse(text: string): EvaluatorResult {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    const dimensions: DimensionResult[] = parsed.dimensions.map((d: any) => ({
      name: d.name,
      score: Math.max(0, Math.min(10, parseInt(d.score, 10))),
      comment: d.comment,
      suggestions: Array.isArray(d.suggestions) ? d.suggestions : [],
    }));

    const avgScore = dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length;
    const score = Math.round(avgScore * 10);

    return { score, dimensions };
  }

  private fallbackResult(reason: string): EvaluatorResult {
    const dimensions: DimensionResult[] = [
      'Single Responsibility',
      'Coupling & Cohesion',
      'Abstraction Quality',
      'Extensibility',
      'Design Concerns',
    ].map((name) => ({
      name,
      score: 5,
      comment: `AI evaluation unavailable: ${reason}`,
      suggestions: [],
    }));

    return { score: 50, dimensions };
  }
}
