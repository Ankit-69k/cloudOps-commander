import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please configure it before initializing the database.'
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info'] : ['error'],
  adapter,
});

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample infrastructure
  const infra1 = await prisma.infrastructure.create({
    data: {
      name: 'Production Web Server',
      type: 'compute',
      provider: 'aws',
      region: 'us-east-1',
      status: 'running',
      config: {
        instanceType: 't3.medium',
        ami: 'ami-12345678',
        securityGroups: ['sg-12345678'],
      },
      tags: {
        environment: 'production',
        team: 'platform',
      },
    },
  });

  // const infra2 =
  await prisma.infrastructure.create({
    data: {
      name: 'PostgreSQL Database',
      type: 'database',
      provider: 'aws',
      region: 'us-east-1',
      status: 'running',
      config: {
        engine: 'postgres',
        version: '15.4',
        instanceClass: 'db.t3.large',
      },
    },
  });

  // Create sample metrics
  await prisma.metric.createMany({
    data: [
      {
        infrastructureId: infra1.id,
        type: 'cpu',
        name: 'CPU Usage',
        value: 45.2,
        unit: 'percent',
        timestamp: new Date(),
      },
      {
        infrastructureId: infra1.id,
        type: 'memory',
        name: 'Memory Usage',
        value: 72.5,
        unit: 'percent',
        timestamp: new Date(),
      },
    ],
  });

  // Create sample incident
  await prisma.incident.create({
    data: {
      title: 'High CPU Usage Detected',
      description: 'CPU usage exceeded 90% for 5 minutes',
      severity: 'high',
      status: 'investigating',
      infrastructureId: infra1.id,
      detectedBy: 'ai-agent',
      context: {
        threshold: 90,
        duration: '5m',
        currentValue: 95.3,
      },
    },
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
