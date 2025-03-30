import { Test, TestingModule } from '@nestjs/testing';
import { TestDatabaseService } from '../services/test-database.service';
import { TestModule } from '../modules/test.module';
import { PrismaService } from '../services/prisma.service';

export class TestHelper {
  static async createTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [TestModule],
    }).compile();
  }

  static async flushDatabase(module: TestingModule) {
    const testDb = module.get<TestDatabaseService>(TestDatabaseService);
    await testDb.flushDatabase();
  }

  static async seedDatabase(module: TestingModule, seedData: Record<string, any[]>) {
    const testDb = module.get<TestDatabaseService>(TestDatabaseService);
    await testDb.seedDatabase(seedData);
  }

  static async cleanup(module: TestingModule) {
    const testDb = module.get<TestDatabaseService>(TestDatabaseService);
    await testDb.cleanup();
  }

  static getPrismaService(module: TestingModule): PrismaService {
    return module.get<PrismaService>(PrismaService);
  }
}
