// src/problems/problems.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  /**
   * GET /api/problems
   * Returns all problems with attempt counts
   */
  @Get()
  findAll() {
    return this.problemsService.findAll();
  }

  /**
   * GET /api/problems/:id
   * Returns a single problem by id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }
}
