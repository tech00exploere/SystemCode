// src/evaluation/evaluation.module.ts
import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { RuleBasedEvaluator } from './evaluators/rule-based.evaluator';
import { AIEvaluator } from './evaluators/ai.evaluator';

@Module({
  providers: [EvaluationService, RuleBasedEvaluator, AIEvaluator],
  exports: [EvaluationService],
})
export class EvaluationModule {}
