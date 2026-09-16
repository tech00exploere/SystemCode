// src/evaluation/evaluators/rule-based.evaluator.ts
import { Injectable } from '@nestjs/common';
import {
  IEvaluator,
  EvaluatorInput,
  EvaluatorResult,
  DimensionResult,
} from './base.evaluator';

@Injectable()
export class RuleBasedEvaluator implements IEvaluator {
  async evaluate(input: EvaluatorInput): Promise<EvaluatorResult> {
    const dimensions: DimensionResult[] = [
      this.checkCompleteness(input),
      this.checkConceptCoverage(input),
      this.checkCodeStructure(input),
      this.checkAssumptions(input),
      this.checkRequirementsCoverage(input),
    ];

    const weights = [0.15, 0.30, 0.25, 0.15, 0.15];
    const score = Math.round(
      dimensions.reduce((acc, dim, i) => acc + dim.score * 10 * weights[i], 0),
    );

    return { score, dimensions };
  }

  private checkCompleteness(input: EvaluatorInput): DimensionResult {
    const suggestions: string[] = [];
    let score = 10;

    if (!input.textDesign || input.textDesign.trim().length < 100) {
      suggestions.push('Your design explanation is too short. Aim for at least 2–3 paragraphs explaining the overall approach.');
      score -= 4;
    }
    if (!input.classDefinitions || input.classDefinitions.trim().length < 80) {
      suggestions.push('Add class definitions with attributes and methods, even in pseudo-code form.');
      score -= 3;
    }
    if (!input.assumptions || input.assumptions.trim().length < 40) {
      suggestions.push('State your assumptions explicitly. What constraints are you assuming?');
      score -= 3;
    }

    return {
      name: 'Submission Completeness',
      score: Math.max(0, score),
      comment: score >= 8
        ? 'All three submission sections are well-populated.'
        : 'Some sections need more detail.',
      suggestions,
    };
  }

  private checkConceptCoverage(input: EvaluatorInput): DimensionResult {
    const allText = `${input.textDesign} ${input.classDefinitions} ${input.assumptions}`.toLowerCase();
    const expected = input.expectedConcepts.map((c: string) => c.toLowerCase());

    const covered = expected.filter((concept: string) => allText.includes(concept));
    const missing = expected.filter((concept: string) => !allText.includes(concept));
    const coverageRatio = expected.length > 0 ? covered.length / expected.length : 1;
    const score = Math.round(coverageRatio * 10);

    const suggestions: string[] = [];
    if (missing.length > 0) {
      const topMissing = missing.slice(0, 5).join(', ');
      suggestions.push(`Consider addressing these concepts: ${topMissing}.`);
    }

    return {
      name: 'Concept Coverage',
      score,
      comment: `Covered ${covered.length}/${expected.length} expected concepts (${Math.round(coverageRatio * 100)}%).`,
      suggestions,
    };
  }

  private checkCodeStructure(input: EvaluatorInput): DimensionResult {
    const code = input.classDefinitions.toLowerCase();
    const suggestions: string[] = [];
    let score = 10;

    const hasClasses = /\bclass\b/.test(code);
    const hasInterfaces = /\binterface\b/.test(code);
    const hasEnums = /\benum\b/.test(code);
    const hasConstructors = /constructor|__init__|def __/.test(code);
    const hasMethodBodies = /\(.*\).*{|def .*:/.test(code);
    const hasRelationships = /extends|implements|:\s*[A-Z]/.test(input.classDefinitions);

    if (!hasClasses && !hasInterfaces) {
      suggestions.push('Define at least one class or interface to model the domain.');
      score -= 4;
    }
    if (!hasInterfaces) {
      suggestions.push('Interfaces or abstract classes define contracts — they show extensibility thinking.');
      score -= 2;
    }
    if (!hasRelationships) {
      suggestions.push('Show relationships: which classes extend, implement, or compose others.');
      score -= 2;
    }
    if (!hasEnums) {
      suggestions.push('Use enums for fixed states or types (e.g., VehicleType, SpotStatus).');
      score -= 1;
    }
    if (!hasConstructors && !hasMethodBodies) {
      suggestions.push('Add method signatures — even empty stubs show your interface thinking.');
      score -= 1;
    }

    return {
      name: 'Code Structure',
      score: Math.max(0, score),
      comment: hasClasses && hasInterfaces && hasRelationships
        ? 'Good use of classes, interfaces, and relationships.'
        : 'Code structure could be more complete.',
      suggestions,
    };
  }

  private checkAssumptions(input: EvaluatorInput): DimensionResult {
    const text = input.assumptions.toLowerCase();
    const suggestions: string[] = [];
    let score = 10;

    const wordCount = input.assumptions.trim().split(/\s+/).length;
    const hasBullets = /[-*•]|\d+\./.test(input.assumptions);
    const mentionsScale = /scale|concurrent|million|thousand|per second|tps|qps/.test(text);
    const mentionsScope = /not in scope|out of scope|exclude|assumption/.test(text);

    if (wordCount < 20) {
      suggestions.push('Be more specific about your assumptions. List at least 3–5 concrete constraints.');
      score -= 4;
    }
    if (!hasBullets) {
      suggestions.push('Format assumptions as a list for clarity.');
      score -= 1;
    }
    if (!mentionsScale) {
      suggestions.push('Include scale assumptions (e.g., "assume single server", "100 concurrent users").');
      score -= 2;
    }
    if (!mentionsScope) {
      suggestions.push('Explicitly state what is out of scope for this design.');
      score -= 2;
    }

    return {
      name: 'Assumptions Quality',
      score: Math.max(0, score),
      comment: score >= 7
        ? 'Assumptions are clear and well-scoped.'
        : 'Assumptions need more specificity and scope definition.',
      suggestions,
    };
  }

  private checkRequirementsCoverage(input: EvaluatorInput): DimensionResult {
    const allText = `${input.textDesign} ${input.classDefinitions}`.toLowerCase();
    const requirements = input.requirements;

    const covered = requirements.filter((req: string) => {
      const keywords = req
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter((w: string) => w.length > 4);
      return keywords.some((kw: string) => allText.includes(kw));
    });

    const ratio = requirements.length > 0 ? covered.length / requirements.length : 1;
    const score = Math.round(ratio * 10);
    const uncovered = requirements.filter((r: string) => !covered.includes(r)).slice(0, 3);

    return {
      name: 'Requirements Coverage',
      score,
      comment: `Design appears to address ${covered.length}/${requirements.length} requirements.`,
      suggestions: uncovered.length > 0
        ? [`Consider addressing: "${uncovered[0].substring(0, 60)}..."`]
        : [],
    };
  }
}
