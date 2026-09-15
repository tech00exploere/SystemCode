import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, IdempotencyService],
})
export class JobsModule {}
