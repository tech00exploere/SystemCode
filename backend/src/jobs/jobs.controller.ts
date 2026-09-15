import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { IdempotencyService } from './idempotency.service';
import { JobStatus } from './job-status';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Post()
  async createJob(
    @Body() dto: CreateJobDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = this.idempotencyService.get(idempotencyKey);
      if (cached) return cached;
    }

    const job = await this.jobsService.createJob(dto);

    if (idempotencyKey) {
      this.idempotencyService.set(idempotencyKey, job);
    }

    return job;
  }

  @Get()
  async getJobs(
    @Query('status') status?: JobStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobsService.getJobs(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  @Patch(':id/status')
  async updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateJobStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteJob(@Param('id') id: string) {
    return this.jobsService.deleteJob(id);
  }

  @Post(':id/simulate-concurrency')
  async simulateConcurrency(
    @Param('id') id: string,
    @Body('targetStatus') targetStatus: JobStatus = JobStatus.RUNNING,
    @Body('count') count: number = 100,
  ) {
    return this.jobsService.simulateConcurrency(id, targetStatus, count);
  }
}
