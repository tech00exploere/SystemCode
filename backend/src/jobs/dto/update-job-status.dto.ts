import { IsEnum } from 'class-validator';
import { JobStatus } from '../job-status';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
