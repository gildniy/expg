// Setup global test configuration
import { PrismaClient } from '@prisma/client';

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Clean up resources after all tests
afterAll(async () => {
  // Ensure all Prisma connections are properly closed
  const prisma = new PrismaClient();
  await prisma.$disconnect();
}); 