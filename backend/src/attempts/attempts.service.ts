// src/attempts/attempts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AttemptStatus } from '../common/enums';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
  ) {}

  /**
   * Create a new DRAFT attempt for a given problem.
   */
  async create(dto: CreateAttemptDto) {
    // Verify problem exists
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
    });
    if (!problem) {
      throw new NotFoundException(`Problem ${dto.problemId} not found`);
    }

    return this.prisma.attempt.create({
      data: { problemId: dto.problemId },
      include: { problem: true },
    });
  }

  /**
   * Return all attempts, ordered by most recent.
   * Includes problem info and feedback summary (score only).
   */
  async findAll() {
    const attempts = await this.prisma.attempt.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true, category: true },
        },
        feedback: {
          select: { overallScore: true, ruleScore: true, aiScore: true, generatedAt: true },
        },
      },
    });

    return attempts;
  }

  /**
   * Return a single attempt with its full submission and feedback.
   */
  async findOne(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        problem: true,
        submission: true,
        feedback: {
          include: { dimensions: true },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt ${id} not found`);
    }

    // Parse JSON fields in feedback dimensions
    if (attempt.feedback?.dimensions) {
      (attempt.feedback as any).dimensions = attempt.feedback.dimensions.map((d: any) => ({
        ...d,
        suggestions: this.safeParseJson(d.suggestions),
      }));
    }

    // Parse JSON fields in problem
    if (attempt.problem) {
      (attempt as any).problem = {
        ...attempt.problem,
        requirements: this.safeParseJson(attempt.problem.requirements),
        expectedConcepts: this.safeParseJson(attempt.problem.expectedConcepts),
        hints: this.safeParseJson(attempt.problem.hints),
      };
    }

    return attempt;
  }

  private safeParseJson(value: any) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  /**
   * Submit an attempt: save submission, trigger evaluation, return updated attempt.
   *
   * State machine: DRAFT → SUBMITTED → EVALUATING → EVALUATED | EVALUATION_FAILED
   */
  async submit(id: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id } });
    if (!attempt) throw new NotFoundException(`Attempt ${id} not found`);

    if (attempt.status === AttemptStatus.EVALUATED) {
      throw new BadRequestException('This attempt has already been evaluated.');
    }
    if (attempt.status === AttemptStatus.EVALUATING) {
      throw new BadRequestException('This attempt is currently being evaluated.');
    }

    // Upsert submission (allow re-submitting a DRAFT or EVALUATION_FAILED)
    await this.prisma.$transaction(async (tx: any) => {
      await tx.submission.upsert({
        where: { attemptId: id },
        update: {
          textDesign: dto.textDesign,
          classDefinitions: dto.classDefinitions,
          assumptions: dto.assumptions,
        },
        create: {
          attemptId: id,
          textDesign: dto.textDesign,
          classDefinitions: dto.classDefinitions,
          assumptions: dto.assumptions,
        },
      });

      await tx.attempt.update({
        where: { id },
        data: {
          status: AttemptStatus.EVALUATING,
          submittedAt: new Date(),
        },
      });
    });

    // Trigger evaluation asynchronously (don't await — respond immediately)
    this.evaluationService.evaluate(id).catch((err: any) => {
      console.error(`Background evaluation failed for ${id}:`, err);
    });

    return this.findOne(id);
  }

  /**
   * Get just the feedback for an attempt.
   */
  async getFeedback(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        feedback: { include: { dimensions: true } },
      },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${id} not found`);
    if (!attempt.feedback) {
      return {
        status: attempt.status,
        message:
          attempt.status === AttemptStatus.EVALUATING
            ? 'Evaluation in progress. Please poll again in a few seconds.'
            : attempt.status === AttemptStatus.EVALUATION_FAILED
            ? 'Evaluation failed. Rule-based feedback may still be available.'
            : 'No feedback yet. Submit your attempt first.',
      };
    }

    const feedback = {
      ...attempt.feedback,
      dimensions: attempt.feedback.dimensions.map((d: any) => ({
        ...d,
        suggestions: this.safeParseJson(d.suggestions),
      })),
    };

    return { status: attempt.status, feedback };
  }
}
