import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

describe('PrismaService Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  it('should connect to the database successfully', async () => {
    // A simple query that should succeed if connected
    const result = await prismaService.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  describe('Transaction support', () => {
    it('should support transactions', async () => {
      // This test verifies that transaction support works
      // We'll execute a transaction that we'll roll back to avoid affecting the database
      let transactionSucceeded = false;

      try {
        await prismaService.$transaction(async (tx) => {
          // A simple query inside transaction
          const result = await tx.$queryRaw`SELECT 1 as result`;
          expect(result).toBeDefined();
          
          // Throw error to roll back transaction
          throw new Error('Intentional error to roll back transaction');
        });
      } catch (error: any) {
        // We expect the error we threw
        if (error.message === 'Intentional error to roll back transaction') {
          transactionSucceeded = true;
        } else {
          throw error; // Unexpected error
        }
      }

      expect(transactionSucceeded).toBe(true);
    });

    it('should handle nested transactions via Prisma Client', async () => {
      let transactionSucceeded = false;

      try {
        await prismaService.$transaction(async (tx) => {
          // A simple query inside transaction
          const result = await tx.$queryRaw`SELECT 1 as result`;
          expect(result).toBeDefined();

          // Cast tx to PrismaClient to access $transaction method
          // This should work since Prisma handles nested transactions internally
          await ((tx as unknown) as PrismaClient).$transaction(async (nestedTx: any) => {
            const nestedResult = await nestedTx.$queryRaw`SELECT 2 as result`;
            expect(nestedResult).toBeDefined();
          });
          
          // Throw error to roll back transaction
          throw new Error('Intentional error to roll back transaction');
        });
      } catch (error: any) {
        // We expect the error we threw
        if (error.message === 'Intentional error to roll back transaction') {
          transactionSucceeded = true;
        } else {
          throw error; // Unexpected error
        }
      }

      expect(transactionSucceeded).toBe(true);
    });
  });

  describe('enableShutdownHooks', () => {
    it('should register app shutdown hooks', () => {
      // This is primarily testing that the method doesn't throw
      expect(() => {
        prismaService.enableShutdownHooks(app);
      }).not.toThrow();
    });
  });
}); 