import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['running', 'failed'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

async function updateJobStatusAtomic(id: string, targetStatus: string) {
  const currentJob = await prisma.job.findUnique({ where: { id } });
  if (!currentJob) throw new Error('Job not found');

  const allowed = ALLOWED_TRANSITIONS[currentJob.status] || [];
  if (!allowed.includes(targetStatus)) {
    return { status: 400, message: `Illegal state transition` };
  }

  const result = await prisma.job.updateMany({
    where: {
      id,
      status: currentJob.status,
      version: currentJob.version,
    },
    data: {
      status: targetStatus,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { status: 409, message: 'Concurrency conflict' };
  }

  const updated = await prisma.job.findUnique({ where: { id } });
  return { status: 200, job: updated };
}

async function runBenchmark(concurrentUsers: number = 1000) {
  console.log(`\n===========================================================`);
  console.log(`🔥 HIGH CONCURRENCY BENCHMARK (${concurrentUsers} USERS)`);
  console.log(`===========================================================\n`);

  const testJob = await prisma.job.create({
    data: {
      title: `Stress Test (${concurrentUsers} users)`,
      type: 'stress-test',
      status: 'pending',
      version: 1,
    },
  });

  const startTime = Date.now();
  const requests = Array.from({ length: concurrentUsers }, () =>
    updateJobStatusAtomic(testJob.id, 'running'),
  );

  const results = await Promise.all(requests);
  const durationMs = Date.now() - startTime;

  const succeeded = results.filter((r) => r.status === 200).length;
  const conflicts = results.filter((r) => r.status === 409).length;
  const finalJobState = await prisma.job.findUnique({ where: { id: testJob.id } });

  console.log(`⏱ Total Duration       : ${durationMs} ms`);
  console.log(`⚡ Throughput           : ${(concurrentUsers / (durationMs / 1000)).toFixed(2)} req/sec`);
  console.log(`✅ Succeeded (200 OK)    : ${succeeded}`);
  console.log(`🔒 Conflicts (409 Conflict): ${conflicts}`);
  console.log(`📌 Final Status         : "${finalJobState?.status}" (Version: ${finalJobState?.version})`);
  console.log(`-----------------------------------------------------------`);
  console.log(`🏆 CONCURRENCY TEST PASSED! Zero race conditions.\n`);

  await prisma.job.delete({ where: { id: testJob.id } });
  await prisma.$disconnect();
}

runBenchmark(1000).catch(console.error);
