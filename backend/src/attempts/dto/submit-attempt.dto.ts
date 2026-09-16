// src/attempts/dto/submit-attempt.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SubmitAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Design explanation must be at least 50 characters.' })
  textDesign: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'Class definitions must be at least 30 characters.' })
  classDefinitions: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Assumptions must be at least 20 characters.' })
  assumptions: string;
}
