import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TestDatabaseService {
  private testPrisma: PrismaClient;

  constructor(private prisma: PrismaService) {
    this.testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });
  }

  async flushDatabase() {
    const tables = [
      'User',
      'VirtualAccount',
      'Transaction',
      'Point',
      'SupportTicket',
      'TicketComment',
    ];

    // Disable foreign key checks
    await this.testPrisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Truncate all tables
    for (const table of tables) {
      await this.testPrisma.$executeRaw`TRUNCATE TABLE "public"."${table}" CASCADE;`;
    }

    // Re-enable foreign key checks
    await this.testPrisma.$executeRaw`SET session_replication_role = 'origin';`;
  }

  async seedDatabase(seedData: Record<string, any[]>) {
    for (const [model, data] of Object.entries(seedData)) {
      await this.testPrisma[model.toLowerCase()].createMany({
        data,
      });
    }
  }

  async cleanup() {
    await this.flushDatabase();
    await this.testPrisma.$disconnect();
  }
}
