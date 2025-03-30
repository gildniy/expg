import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('Webhooks E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Setup test merchant ID
  const TEST_MERCHANT_ID = 'test-merchant-id';

  beforeAll(async () => {
    // Save original env
    const originalEnv = process.env.EZPG_MERCHANT_ID;
    
    // Set test env
    process.env.EZPG_MERCHANT_ID = TEST_MERCHANT_ID;
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Apply global pipes same as in main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();
    
    // Restore original env
    if (originalEnv) {
      process.env.EZPG_MERCHANT_ID = originalEnv;
    } else {
      delete process.env.EZPG_MERCHANT_ID;
    }
    
    // Mock PrismaService methods
    jest.spyOn(prismaService, '$transaction').mockImplementation(
      async (callback: any) => callback(prismaService)
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/webhooks/ezpg/deposit-notification', () => {
    const validDepositPayload = {
      mid: TEST_MERCHANT_ID,
      vacctNo: '1234567890',
      bankCd: '001',
      amt: '10000',
      depositDt: '20240301',
      depositTm: '120000',
      trNo: 'TR123456789',
      depositNm: 'John Doe',
      bankTrId: 'BANK123456789'
    };

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Mock virtual account lookup
      jest.spyOn(prismaService.virtualAccount, 'findUnique').mockResolvedValue({
        id: 'va-id',
        userId: 'user-id',
        accountNumber: '1234567890',
        bankCode: '001',
        bankName: 'Test Bank',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ezpgReferenceId: 'ref123'
      } as any);
      
      // Mock transaction checks
      jest.spyOn(prismaService.transaction, 'findFirst').mockResolvedValue(null);
      
      // Mock transaction creation
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        id: 'new-tx',
        userId: 'user-id',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 10000,
        pointsChange: 10000,
        description: 'Test deposit',
        referenceId: 'TR123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        bankCode: '001',
        accountNumber: '1234567890',
        merchantOrderId: 'MO123456789',
        accountHolder: 'Test User'
      } as any);
      
      // Mock point balance update
      jest.spyOn(prismaService.pointBalance, 'update').mockResolvedValue({ id: 'pb-id', balance: 10000 } as any);
    });

    it('should return 200 and "0000" for valid deposit notification', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/deposit-notification')
        .send(validDepositPayload)
        .expect(200)
        .expect('0000');
    });

    it('should return 400 when merchant ID is invalid', async () => {
      const invalidPayload = { ...validDepositPayload, mid: 'invalid-id' };
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/deposit-notification')
        .send(invalidPayload)
        .expect(400)
        .expect('9999');
    });

    it('should return 400 when virtual account is not found', async () => {
      // Mock virtual account not found
      jest.spyOn(prismaService.virtualAccount, 'findUnique').mockResolvedValue(null);
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/deposit-notification')
        .send(validDepositPayload)
        .expect(400)
        .expect('9999');
    });

    it('should handle duplicate deposit notifications gracefully', async () => {
      // Mock finding existing transaction
      jest.spyOn(prismaService.transaction, 'findFirst').mockResolvedValue({ id: 'existing-tx' } as any);
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/deposit-notification')
        .send(validDepositPayload)
        .expect(200)
        .expect('0000');
    });
  });

  describe('POST /api/v1/webhooks/ezpg/withdrawal-notification', () => {
    const validWithdrawalPayload = {
      mid: TEST_MERCHANT_ID,
      natvTrNo: 'TR123456789',
      moid: 'MO123456789',
      resultCd: '0000',
      resultMsg: 'Success',
      amt: '10000',
      bankCd: '001',
      accntNo: '1234567890',
      accntNm: 'John Doe',
      trDt: '20240301',
      trTm: '120000',
      bankTrId: 'BANK123456789'
    };

    const mockTransaction = {
      id: 'tx-id',
      userId: 'user-id',
      type: 'WITHDRAWAL_REQUEST',
      status: 'PENDING',
      amount: 10000,
      pointsChange: -10000,
      description: 'Withdrawal request',
      referenceId: 'TR123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      bankCode: '001',
      accountNumber: '1234567890',
      merchantOrderId: 'MO123456789',
      accountHolder: 'Test User'
    } as any;

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Mock original transaction lookup
      jest.spyOn(prismaService.transaction, 'findFirst')
        .mockImplementation((params?: Prisma.TransactionFindFirstArgs) => {
          if (params?.where?.referenceId === 'TR123456789' && params?.where?.type === 'WITHDRAWAL_REQUEST') {
            return {
              ...mockTransaction,
              user: {
                findUnique: () => Promise.resolve({
                  id: 'user-id',
                  email: 'test@example.com',
                  name: 'Test User'
                })
              }
            } as any;
          }
          // For the duplicate check
          return Promise.resolve(null);
        });
      
      // Mock transaction update
      jest.spyOn(prismaService.transaction, 'update').mockResolvedValue({
        ...mockTransaction,
        status: 'COMPLETED',
      } as any);
      
      // Mock notification transaction creation
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({ id: 'notification-tx' } as any);
    });

    it('should return 200 and "0000" for valid successful withdrawal notification', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/withdrawal-notification')
        .send(validWithdrawalPayload)
        .expect(200)
        .expect('0000');
    });

    it('should return 200 and "0000" for valid failed withdrawal notification and revert points', async () => {
      // Mock point balance update for failed withdrawal
      jest.spyOn(prismaService.pointBalance, 'update').mockResolvedValue({ id: 'pb-id', balance: 10000 } as any);
      
      const failedPayload = { ...validWithdrawalPayload, resultCd: '0001', resultMsg: 'Failed' };
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/withdrawal-notification')
        .send(failedPayload)
        .expect(200)
        .expect('0000');
    });

    it('should return 400 when merchant ID is invalid', async () => {
      const invalidPayload = { ...validWithdrawalPayload, mid: 'invalid-id' };
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/withdrawal-notification')
        .send(invalidPayload)
        .expect(400)
        .expect('9999');
    });

    it('should return 400 when original withdrawal transaction is not found', async () => {
      // Mock transaction not found
      jest.spyOn(prismaService.transaction, 'findFirst').mockResolvedValue(null);
      
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/ezpg/withdrawal-notification')
        .send(validWithdrawalPayload)
        .expect(400)
        .expect('9999');
    });
  });
}); 