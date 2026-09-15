import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobStatus } from './job-status';

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING, JobStatus.FAILED],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        title: dto.title.trim(),
        type: dto.type.trim(),
        status: JobStatus.PENDING,
        version: 1,
      },
    });
  }

  async getJobs(status?: JobStatus, page: number = 1, limit: number = 50) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [jobs, totalCount, statusGroupCounts] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
      this.prisma.job.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const metrics = {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    statusGroupCounts.forEach((g: any) => {
      const count = g._count._all;
      metrics.total += count;
      if (g.status in metrics) {
        (metrics as any)[g.status] = count;
      }
    });

    return {
      jobs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      metrics,
    };
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job '${id}' not found.`);
    }
    return job;
  }

  async updateJobStatus(id: string, dto: UpdateJobStatusDto) {
    const targetStatus = dto.status;
    const currentJob = await this.getJobById(id);
    const currentStatus = currentJob.status as JobStatus;

    if (currentStatus === targetStatus) {
      return currentJob;
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition status from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ') || 'None'}].`,
      );
    }

    const result = await this.prisma.job.updateMany({
      where: {
        id,
        status: currentStatus,
        version: currentJob.version,
      },
      data: {
        status: targetStatus,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        `Job status was modified concurrently by another process.`,
      );
    }

    return this.getJobById(id);
  }

  async deleteJob(id: string) {
    await this.getJobById(id);
    await this.prisma.job.delete({ where: { id } });
    return { success: true, message: `Job '${id}' deleted.` };
  }

  async simulateConcurrency(id: string, targetStatus: JobStatus, count: number = 100) {
    const start = Date.now();
    const promises = Array.from({ length: count }, () =>
      this.updateJobStatus(id, { status: targetStatus }).catch((err) => ({
        error: true,
        status: err.getStatus ? err.getStatus() : 500,
        message: err.message,
      })),
    );

    const results = await Promise.all(promises);
    const durationMs = Date.now() - start;

    const succeeded = results.filter((r: any) => !r.error).length;
    const conflicts = results.filter((r: any) => r.status === 409).length;
    const badRequests = results.filter((r: any) => r.status === 400).length;

    return {
      testSummary: {
        jobId: id,
        targetStatus,
        totalConcurrentRequests: count,
        durationMs,
        throughputReqPerSec: Math.round((count / (durationMs / 1000)) * 100) / 100,
      },
      resultsBreakdown: {
        succeeded,
        conflicts409: conflicts,
        badRequests400: badRequests,
      },
      concurrencyProtected: succeeded === 1 && conflicts === count - 1,
    };
  }
}
