// src/problems/problems.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const problems = await this.prisma.problem.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    return problems.map((p: any) => this.parseProblem(p));
  }

  async findOne(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem ${id} not found`);
    }

    return this.parseProblem(problem);
  }

  async findBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    return this.parseProblem(problem);
  }

  private parseProblem(problem: any) {
    return {
      ...problem,
      requirements: this.safeParseJson(problem.requirements),
      expectedConcepts: this.safeParseJson(problem.expectedConcepts),
      hints: this.safeParseJson(problem.hints),
      attemptCount: problem._count?.attempts ?? 0,
      _count: undefined,
    };
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
}
