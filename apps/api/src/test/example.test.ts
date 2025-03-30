import { TestHelper } from './test.helper';
import { TestingModule } from '@nestjs/testing';

describe('Example Test', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await TestHelper.createTestingModule();
  });

  beforeEach(async () => {
    await TestHelper.flushDatabase(module);
  });

  afterAll(async () => {
    await TestHelper.cleanup(module);
  });

  it('should seed and query test data', async () => {
    // Seed test data
    await TestHelper.seedDatabase(module, {
      User: [
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      ],
    });

    // Get PrismaService for queries
    const prisma = TestHelper.getPrismaService(module);

    // Query the seeded data
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
  });
});
