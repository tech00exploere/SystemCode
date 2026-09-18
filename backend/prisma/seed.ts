import { PrismaClient } from '@prisma/client';
import { Difficulty } from '../src/common/enums';

const prisma = new PrismaClient();

const problems = [
  {
    title: 'Design a Parking Lot System',  //
    slug: 'parking-lot',
    difficulty: Difficulty.MEDIUM,
    category: 'OOP / State Management',
    description: `Design a parking lot system that manages vehicle entry, exit, and fee calculation.
The system should support multiple levels, different vehicle types, and concurrent access.
Focus on clean class design, state transitions, and extensibility.`,
    requirements: JSON.stringify([
      'Support multiple parking levels (e.g., 3 levels, 50 spots each)',
      'Handle vehicle types: Motorcycle, Car, Bus (different spot sizes)',
      'Assign nearest available spot on entry',
      'Calculate parking fee based on duration (hourly rate per vehicle type)',
      'Track entry time and generate a ticket on entry',
      'Release spot and calculate fee on exit',
      'Display real-time availability per level',
      'Handle concurrent entry/exit without double-booking',
    ]),
    expectedConcepts: JSON.stringify([
      'ParkingLot', 'ParkingLevel', 'ParkingSpot', 'Vehicle', 'Ticket',
      'FeeCalculator', 'VehicleType', 'SpotType', 'singleton', 'factory',
      'strategy', 'state', 'interface', 'abstract', 'enum',
    ]),
    hints: JSON.stringify([
      'Think about the relationship between ParkingLot, Level, and Spot',
      'Consider using the Strategy pattern for fee calculation',
      'How do you handle thread safety for spot assignment?',
      'What state transitions does a ParkingSpot go through?',
    ]),
  },
  {
    title: 'Design a URL Shortener',
    slug: 'url-shortener',
    difficulty: Difficulty.MEDIUM,
    category: 'API Design / Distributed Systems',
    description: `Design a URL shortening service like bit.ly or TinyURL.
The system should generate unique short codes, redirect users, and track analytics.
Focus on the encoding strategy, collision handling, and system boundaries.`,
    requirements: JSON.stringify([
      'Shorten a long URL to a ~7-character code (e.g., abc1234)',
      'Redirect short URL to original URL with minimal latency',
      'Handle collisions in short code generation gracefully',
      'Support custom aliases (user-provided short codes)',
      'Track click count per short URL',
      'Expire URLs after a configurable TTL (e.g., 30 days)',
      'Return 404 for expired or unknown short codes',
      'Validate that input is a valid URL before shortening',
    ]),
    expectedConcepts: JSON.stringify([
      'UrlShortener', 'ShortCode', 'UrlRepository', 'Encoder', 'HashEncoder',
      'Base62', 'collision', 'cache', 'redirect', 'TTL', 'expiry',
      'analytics', 'ClickTracker', 'interface', 'repository pattern',
      'service layer', 'validation',
    ]),
    hints: JSON.stringify([
      'Compare MD5+truncate vs Base62(counter) vs random approaches',
      'What happens when two URLs hash to the same short code?',
      'Where would you add a cache layer and what does it store?',
      'How would you scale this to 100M URLs/day?',
    ]),
  },
  {
    title: 'Design a Rate Limiter',
    slug: 'rate-limiter',
    difficulty: Difficulty.HARD,
    category: 'Concurrency / Algorithms',
    description: `Design a rate limiting library/service that can throttle API requests.
The system should support multiple algorithms and be usable as both a library and a service.
Focus on algorithm design, thread safety, and the extensibility of the strategy interface.`,
    requirements: JSON.stringify([
      'Implement Token Bucket algorithm (baseline)',
      'Implement Sliding Window Counter algorithm',
      'Support per-user and per-IP rate limiting',
      'Allow configurable: max requests, window size, refill rate',
      'Return remaining quota and retry-after on rejection',
      'Thread-safe for concurrent requests',
      'Pluggable storage backend (in-memory vs Redis-compatible)',
      'Support middleware-style integration (wraps a handler)',
    ]),
    expectedConcepts: JSON.stringify([
      'RateLimiter', 'TokenBucket', 'SlidingWindow', 'FixedWindow',
      'RateLimitStrategy', 'RateLimitResult', 'algorithm', 'interface',
      'strategy pattern', 'decorator pattern', 'thread safety', 'atomic',
      'storage', 'InMemoryStore', 'middleware', 'quota', 'refill',
    ]),
    hints: JSON.stringify([
      'Why is Token Bucket better than Fixed Window for bursty traffic?',
      'How do you make token refill thread-safe without a lock on every request?',
      'What interface allows swapping Token Bucket for Sliding Window?',
      'How would you distribute this across multiple API servers?',
    ]),
  },
];

async function main() {
  console.log('Seeding database...');

  // Upsert problems (safe to re-run)
  for (const problem of problems) {
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problem,
      create: problem,
    });
    console.log(`  ✓ Seeded: ${problem.title}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
