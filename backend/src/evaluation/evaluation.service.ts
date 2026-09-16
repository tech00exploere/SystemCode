// src/evaluation/evaluation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuleBasedEvaluator } from './evaluators/rule-based.evaluator';
import { AIEvaluator } from './evaluators/ai.evaluator';
import { EvaluatorInput, DimensionResult } from './evaluators/base.evaluator';
import { AttemptStatus } from '@prisma/client';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEvaluator: RuleBasedEvaluator,
    private readonly aiEvaluator: AIEvaluator,
  ) {}

  /**
   * Orchestrates evaluation for a submitted attempt.
   *
   * Flow:
   *   1. Build EvaluatorInput from attempt + problem + submission
   *   2. Run RuleBasedEvaluator (synchronous, always succeeds)
   *   3. Run AIEvaluator (async, may fail)
   *   4. Merge results into Feedback
   *   5. Persist Feedback, update Attempt status
   *
   * Graceful failure:
   *   If AIEvaluator throws, we still persist the rule-based feedback
   *   and mark the attempt EVALUATION_FAILED so it can be retried.
   */
  async evaluate(attemptId: string): Promise<void> {
    // 1. Load attempt with all relations
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        submission: true,
        problem: true,
      },
    });

    if (!attempt || !attempt.submission || !attempt.problem) {
      this.logger.error(`Cannot evaluate attempt ${attemptId}: missing data`);
      return;
    }

    const { submission, problem } = attempt;

    const input: EvaluatorInput = {
      problemTitle: problem.title,
      problemDescription: problem.description,
      requirements: JSON.parse(problem.requirements),
      expectedConcepts: JSON.parse(problem.expectedConcepts),
      textDesign: submission.textDesign,
      classDefinitions: submission.classDefinitions,
      assumptions: submission.assumptions,
    };

    // 2. Rule-based evaluation (always runs)
    const ruleResult = await this.ruleEvaluator.evaluate(input);

    // 3. AI evaluation (may fail)
    let aiResult = null;
    let evaluationFailed = false;

    try {
      aiResult = await this.aiEvaluator.evaluate(input);
    } catch (err: any) {
      this.logger.warn(`AI evaluation failed for attempt ${attemptId}: ${err?.message || err}`);
      evaluationFailed = true;
    }

    // 4. Merge results
    const allDimensions: DimensionResult[] = [
      ...ruleResult.dimensions,
      ...(aiResult?.dimensions ?? []),
    ];

    // Combined score: 40% rule-based, 60% AI (or 100% rule-based on failure)
    const ruleScore = ruleResult.score;
    const aiScore = aiResult?.score ?? ruleResult.score;
    const overallScore = aiResult
      ? Math.round(ruleScore * 0.4 + aiScore * 0.6)
      : ruleScore;

    const summary = aiResult
      ? `Rule-based score: ${ruleScore}/100 | AI score: ${aiScore}/100 | Combined: ${overallScore}/100`
      : `Rule-based score: ${ruleScore}/100. AI evaluation ${evaluationFailed ? 'failed' : 'unavailable'}.`;

    // 5. Persist feedback
    await this.prisma.$transaction(async (tx: any) => {
      const feedback = await tx.feedback.create({
        data: {
          attemptId,
          overallScore,
          ruleScore,
          aiScore,
          summary,
          dimensions: {
            create: allDimensions.map((d: DimensionResult) => ({
              name: d.name,
              score: d.score,
              comment: d.comment,
              suggestions: JSON.stringify(d.suggestions),
            })),
          },
        },
      });

      await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: evaluationFailed ? AttemptStatus.EVALUATION_FAILED : AttemptStatus.EVALUATED,
        },
      });

      return feedback;
    });

    this.logger.log(
      `Attempt ${attemptId} evaluated: score=${overallScore}, status=${evaluationFailed ? 'EVALUATION_FAILED' : 'EVALUATED'}`,
    );
  }
}
