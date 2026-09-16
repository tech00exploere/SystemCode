// src/evaluation/evaluators/rule-based.evaluator.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RuleBasedEvaluator } from './rule-based.evaluator';
import { EvaluatorInput } from './base.evaluator';

describe('RuleBasedEvaluator', () => {
  let evaluator: RuleBasedEvaluator;

  beforeEach(() => {
    evaluator = new RuleBasedEvaluator();
  });

  it('should evaluate a complete submission with high scores', async () => {
    const input: EvaluatorInput = {
      problemTitle: 'Parking Lot',
      problemDescription: 'Design a parking lot',
      requirements: ['Support multiple parking levels', 'Handle vehicle types'],
      expectedConcepts: ['ParkingLot', 'ParkingLevel', 'ParkingSpot', 'Vehicle', 'Ticket'],
      textDesign: `
        This parking lot design uses a Singleton for the ParkingLot manager.
        We have multiple ParkingLevels each containing a collection of ParkingSpots.
        Vehicles can be Motorcycles, Cars, or Buses. A Strategy pattern handles fee calculation.
        Concurrency is handled using atomic locks on spot reservation.
      `,
      classDefinitions: `
        enum VehicleType { MOTORCYCLE, CAR, BUS }
        enum SpotType { SMALL, MEDIUM, LARGE }

        interface FeeCalculatorStrategy {
          calculateFee(durationHours: number, vehicleType: VehicleType): number;
        }

        abstract class Vehicle {
          protected licensePlate: string;
          protected type: VehicleType;
        }

        class ParkingLot {
          private static instance: ParkingLot;
          private levels: ParkingLevel[];
          public issueTicket(vehicle: Vehicle): Ticket;
        }

        class ParkingSpot {
          private spotId: string;
          private isOccupied: boolean;
          public assignVehicle(vehicle: Vehicle): boolean;
        }
      `,
      assumptions: `
        - Scale: Assume up to 10,000 requests per day across 5 levels.
        - Out of scope: Payment processing system integration is omitted.
        - Single server instance; state stored in memory.
      `,
    };

    const result = await evaluator.evaluate(input);

    expect(result.score).toBeGreaterThan(70);
    expect(result.dimensions.length).toBe(5);

    const completeness = result.dimensions.find((d) => d.name === 'Submission Completeness');
    expect(completeness?.score).toBeGreaterThanOrEqual(8);

    const coverage = result.dimensions.find((d) => d.name === 'Concept Coverage');
    expect(coverage?.score).toBe(10);
  });

  it('should penalize incomplete submissions', async () => {
    const input: EvaluatorInput = {
      problemTitle: 'Parking Lot',
      problemDescription: 'Design a parking lot',
      requirements: ['Support multiple parking levels'],
      expectedConcepts: ['ParkingLot', 'ParkingLevel'],
      textDesign: 'Short text',
      classDefinitions: 'class A {}',
      assumptions: 'None',
    };

    const result = await evaluator.evaluate(input);
    expect(result.score).toBeLessThan(50);
  });
});
