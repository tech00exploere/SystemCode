// src/attempts/dto/create-attempt.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAttemptDto {
  @IsString()
  @IsNotEmpty()
  problemId: string;
}
