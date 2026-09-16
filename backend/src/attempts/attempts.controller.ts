// src/attempts/attempts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('attempts')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  /**
   * POST /api/attempts
   * Start a new attempt for a problem.
   * Body: { problemId }
   */
  @Post()
  create(@Body() dto: CreateAttemptDto) {
    return this.attemptsService.create(dto);
  }

  /**
   * GET /api/attempts
   * List all attempts (history view).
   */
  @Get()
  findAll() {
    return this.attemptsService.findAll();
  }

  /**
   * GET /api/attempts/:id
   * Get a single attempt with full submission + feedback.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
  }

  /**
   * POST /api/attempts/:id/submit
   * Submit the attempt — triggers evaluation.
   * Body: { textDesign, classDefinitions, assumptions }
   */
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitAttemptDto) {
    return this.attemptsService.submit(id, dto);
  }

  /**
   * GET /api/attempts/:id/feedback
   * Get evaluation feedback for an attempt.
   * If still evaluating, returns { status: 'EVALUATING', message: '...' }
   */
  @Get(':id/feedback')
  getFeedback(@Param('id') id: string) {
    return this.attemptsService.getFeedback(id);
  }
}
