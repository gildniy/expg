import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from '../../../src/webhooks/webhooks.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { EzpgDepositNotificationDto, EzpgWithdrawalNotificationDto } from '../../../src/webhooks/dto/webhook.dto';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: PrismaService;

  // Mock deposit notification
  const mockDepositNotification: EzpgDepositNotificationDto = {
    mid: 'test-merchant-id',
    vacctNo: '1234567890',
    bankCd: '001',
    amt: '10000',
    depositDt: '20240301',
    depositTm: '120000',
    trNo: 'TR123456789',
    depositNm: 'John Doe',
    bankTrId: 'BANK123456789'
  };

  // Mock withdrawal notification
  const mockWithdrawalNotification: EzpgWithdrawalNotificationDto = {
    mid: 'test-merchant-id',
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

  // Mock virtual account
  const mockVirtualAccount = {
    id: 'va-id',
    userId: 'user-id',
    accountNumber: '1234567890',
    bankCode: '001',
    bankName: 'Test Bank',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ezpgReferenceId: 'ref123',
    user: {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  };

  // Mock transaction
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
    metadata: {},
    user: {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  };

  // Create mocks
  const mockPrismaService = {
    virtualAccount: {
      findUnique: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pointBalance: {
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };
  
  // Mock logger
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set environment variable
    process.env.EZPG_MERCHANT_ID = 'test-merchant-id';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Replace logger with mock
    (service as any).logger = mockLogger;
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.EZPG_MERCHANT_ID;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDepositNotification', () => {
    it('should throw BadRequestException when merchant ID is invalid', async () => {
      // Create notification with invalid merchant ID
      const invalidNotification = { ...mockDepositNotification, mid: 'invalid-id' };
      
      await expect(service.handleDepositNotification(invalidNotification)).rejects.toThrow(
        new BadRequestException('Invalid merchant ID')
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw BadRequestException when virtual account is not found', async () => {
      // Set up virtual account not found
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(null);
      
      await expect(service.handleDepositNotification(mockDepositNotification)).rejects.toThrow(
        new BadRequestException('Virtual account not found')
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return 0000 when deposit notification is duplicated', async () => {
      // Set up virtual account found
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(mockVirtualAccount);
      
      // Set up duplicate transaction
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({ id: 'existing-tx' });
      
      const result = await service.handleDepositNotification(mockDepositNotification);
      
      expect(result).toBe('0000');
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should process deposit notification successfully', async () => {
      // Set up virtual account found
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(mockVirtualAccount);
      
      // Set up no duplicate transaction
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      // Set up transaction mock returns
      mockPrismaService.transaction.create.mockResolvedValueOnce({ id: 'new-tx' });
      mockPrismaService.pointBalance.update.mockResolvedValueOnce({ id: 'pb-id', balance: 10000 });
      
      const result = await service.handleDepositNotification(mockDepositNotification);
      
      expect(result).toBe('0000');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id',
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount: 10000,
          pointsChange: 10000,
          referenceId: 'TR123456789',
        }),
      });
      expect(mockPrismaService.pointBalance.update).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { balance: { increment: 10000 } },
      });
      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Successfully processed deposit'));
    });

    it('should handle errors during transaction processing', async () => {
      // Set up virtual account found
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(mockVirtualAccount);
      
      // Set up no duplicate transaction
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      // Set up transaction error
      const testError = new Error('Transaction error');
      mockPrismaService.$transaction.mockRejectedValueOnce(testError);
      
      await expect(service.handleDepositNotification(mockDepositNotification)).rejects.toThrow(testError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing deposit'),
        expect.any(String)
      );
    });
  });

  describe('handleWithdrawalNotification', () => {
    it('should throw BadRequestException when merchant ID is invalid', async () => {
      // Create notification with invalid merchant ID
      const invalidNotification = { ...mockWithdrawalNotification, mid: 'invalid-id' };
      
      await expect(service.handleWithdrawalNotification(invalidNotification)).rejects.toThrow(
        new BadRequestException('Invalid merchant ID')
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw BadRequestException when original withdrawal transaction is not found', async () => {
      // Set up original transaction not found
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      await expect(service.handleWithdrawalNotification(mockWithdrawalNotification)).rejects.toThrow(
        new BadRequestException('Original withdrawal transaction not found')
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return 0000 when withdrawal notification is duplicated', async () => {
      // Set up original transaction found
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(mockTransaction);
      
      // Set up duplicate notification
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({ id: 'existing-notification' });
      
      const result = await service.handleWithdrawalNotification(mockWithdrawalNotification);
      
      expect(result).toBe('0000');
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should process successful withdrawal notification', async () => {
      // Set up original transaction found
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(mockTransaction);
      
      // Set up no duplicate notification
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      // Set up mock returns
      mockPrismaService.transaction.update.mockResolvedValueOnce({ ...mockTransaction, status: 'COMPLETED' });
      mockPrismaService.transaction.create.mockResolvedValueOnce({ id: 'new-notification-tx' });
      
      const result = await service.handleWithdrawalNotification(mockWithdrawalNotification);
      
      expect(result).toBe('0000');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: { status: 'COMPLETED' },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id',
          type: 'WITHDRAWAL_COMPLETED',
          status: 'COMPLETED',
          pointsChange: 0,
        }),
      });
      expect(mockPrismaService.pointBalance.update).not.toHaveBeenCalled(); // No update needed for successful withdrawal
      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Successfully processed withdrawal notification'));
    });

    it('should revert points for failed withdrawal notification', async () => {
      // Create failed notification
      const failedNotification = { ...mockWithdrawalNotification, resultCd: '0001', resultMsg: 'Failed' };
      
      // Set up original transaction found
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(mockTransaction);
      
      // Set up no duplicate notification
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      // Set up mock returns
      mockPrismaService.transaction.update.mockResolvedValueOnce({ ...mockTransaction, status: 'FAILED' });
      mockPrismaService.transaction.create.mockResolvedValueOnce({ id: 'failed-notification-tx' });
      mockPrismaService.pointBalance.update.mockResolvedValueOnce({ id: 'pb-id', balance: 0 });
      
      const result = await service.handleWithdrawalNotification(failedNotification);
      
      expect(result).toBe('0000');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: { status: 'FAILED' },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id',
          type: 'WITHDRAWAL_FAILED',
          status: 'COMPLETED',
        }),
      });
      expect(mockPrismaService.pointBalance.update).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { balance: { increment: 10000 } }, // Revert the negative points change
      });
      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Reverted 10000 points'));
    });

    it('should handle errors during transaction processing', async () => {
      // Set up original transaction found
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(mockTransaction);
      
      // Set up no duplicate notification
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce(null);
      
      // Set up transaction error
      const testError = new Error('Transaction error');
      mockPrismaService.$transaction.mockRejectedValueOnce(testError);
      
      await expect(service.handleWithdrawalNotification(mockWithdrawalNotification)).rejects.toThrow(testError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing withdrawal notification'),
        expect.any(String)
      );
    });
  });
}); 