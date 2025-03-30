import { Test, TestingModule } from '@nestjs/testing';
import { MerchantService, EzpgApiError } from '../../../src/merchant/merchant.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ProcessWithdrawalDto, VirtualAccountDto } from '../../../src/merchant/dto/merchant.dto';

describe('MerchantService', () => {
  let service: MerchantService;
  let _prismaService: PrismaService;
  let _httpService: HttpService;
  
  // Mock DTOs
  const mockWithdrawalDto: ProcessWithdrawalDto = {
    moid: 'test-moid-123',
    amount: 10000,
    bankCode: '001',
    accountNumber: '1234567890',
    accountHolderName: 'Test User',
    transactionId: 'tx-123',
  };

  const mockVirtualAccountDto: VirtualAccountDto = {
    email: 'test@example.com'
  };

  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    virtualAccount: null,
  };

  // Mock successful withdrawal API response
  const mockWithdrawalResponse = {
    resultCd: '0000',
    resultMsg: 'Success',
    natvTrNo: 'ezpg-ref-123',
  };

  // Mock transaction search API response
  const mockTransactionSearchResponse = {
    resultCd: '0000',
    resultMsg: 'Success',
    transactionList: [
      {
        moid: 'test-moid-123',
        trNo: 'tr-123',
        statusCd: '0000',
        statusMsg: 'Completed',
      },
    ],
  };

  // Mock successful virtual account creation
  const mockCreatedVirtualAccount = {
    id: 'va-123',
    userId: 'user-123',
    accountNumber: '1234567890',
    bankCode: '001',
    bankName: 'Test Bank',
    ezpgReferenceId: 'ref-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create mocks
  const mockHttpService = {
    post: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    virtualAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  // Mock logger
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.EZPG_API_BASE_URL = 'https://test-api.ez-pg.com';
    process.env.EZPG_MERCHANT_ID = 'test-merchant-id';
    process.env.EZPG_MERCHANT_KEY = 'test-merchant-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<MerchantService>(MerchantService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _httpService = module.get<HttpService>(HttpService);
    
    // Replace logger with mock
    (service as unknown as { logger: typeof mockLogger }).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.EZPG_API_BASE_URL;
    delete process.env.EZPG_MERCHANT_ID;
    delete process.env.EZPG_MERCHANT_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWithdrawal', () => {
    it('should successfully process a withdrawal', async () => {
      // Mock HttpService post method
      mockHttpService.post.mockReturnValueOnce(
        of({
          data: mockWithdrawalResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      const withdrawalResult = await service.processWithdrawal(mockWithdrawalDto);

      // Check HttpService was called with correct parameters
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://test-api.ez-pg.com/merWithdrawApi',
        {
          mid: 'test-merchant-id',
          meky: 'test-merchant-key',
          moid: mockWithdrawalDto.moid,
          withAmt: mockWithdrawalDto.amount.toString(),
          bankCd: mockWithdrawalDto.bankCode,
          withAccntNo: mockWithdrawalDto.accountNumber,
          withAccntNm: mockWithdrawalDto.accountHolderName,
          withType: '03',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Check the result is as expected
      expect(withdrawalResult).toEqual(mockWithdrawalResponse);
    });

    it('should throw EzpgApiError when API returns error status', async () => {
      // Mock HttpService post method with error response
      mockHttpService.post.mockReturnValueOnce(
        of({
          data: {
            resultCd: '1001',
            resultMsg: 'Invalid data',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      // Expect the service to throw an EzpgApiError
      await expect(service.processWithdrawal(mockWithdrawalDto)).rejects.toThrow(
        new EzpgApiError('EZPG withdrawal API error: Invalid data', '1001')
      );
    });

    it('should throw HttpException when API call fails', async () => {
      // Mock HttpService post method with network error
      mockHttpService.post.mockReturnValueOnce(
        throwError(() => new Error('Network error'))
      );

      // Expect the service to throw an HttpException
      await expect(service.processWithdrawal(mockWithdrawalDto)).rejects.toThrow(
        new HttpException(
          'Failed to process withdrawal request',
          HttpStatus.SERVICE_UNAVAILABLE
        )
      );
    });

    it('should use default values when environment variables are not set', async () => {
      // Save original env vars
      const originalApiUrl = process.env.EZPG_API_BASE_URL;
      
      // Set env vars to undefined
      delete process.env.EZPG_API_BASE_URL;
      
      // Create a new service instance to use default values
      const _localService = new MerchantService(
        mockPrismaService as unknown as PrismaService, 
        mockHttpService as unknown as HttpService
      );
      
      // Mock HttpService post method with success
      mockHttpService.post.mockReturnValueOnce(
        of({
          data: mockWithdrawalResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      const _result = await _localService.processWithdrawal(mockWithdrawalDto);
      
      // Verify that the default URL was used
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.ez-pg.com/merWithdrawApi',
        expect.any(Object),
        expect.any(Object)
      );
      
      // Restore original env vars
      if (originalApiUrl) {
        process.env.EZPG_API_BASE_URL = originalApiUrl;
      }
    });
  });

  describe('registerVirtualAccount', () => {
    it('should successfully register a virtual account', async () => {
      // Mock user exists without a virtual account
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock no existing account with the same number
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(null);
      
      // Mock successful virtual account creation
      mockPrismaService.virtualAccount.create.mockResolvedValueOnce(mockCreatedVirtualAccount);

      const result = await service.registerVirtualAccount(mockVirtualAccountDto);

      // Check that prisma methods were called correctly
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockVirtualAccountDto.email },
        include: { virtualAccount: true },
      });

      expect(result).toEqual(mockCreatedVirtualAccount);
    });

    it('should throw an exception when user is not found', async () => {
      // Mock user not found
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      // Expect the service to throw an HttpException
      await expect(service.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw an exception when user already has a virtual account', async () => {
      // Mock user with existing virtual account
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        virtualAccount: {
          id: 'existing-va',
          accountNumber: '9876543210',
        },
      });

      // Expect the service to throw an HttpException
      await expect(service.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException(
          'User already has a virtual account assigned',
          HttpStatus.CONFLICT
        )
      );
    });

    it('should throw an exception when account number is already in use', async () => {
      // Mock user exists without a virtual account
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock existing account with the same number
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce({
        id: 'existing-va',
        accountNumber: '1234567890',
        userId: 'other-user-id',
      });

      // Expect the service to throw an HttpException
      await expect(service.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException(
          'Virtual account number already in use',
          HttpStatus.CONFLICT
        )
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock user exists without a virtual account
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock no existing account with the same number
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(null);
      
      // Mock database error
      mockPrismaService.virtualAccount.create.mockRejectedValueOnce(
        new Error('Database error')
      );

      // Expect the service to throw an HttpException
      await expect(service.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException(
          'Failed to register virtual account',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    });

    it('should handle non-HttpException errors gracefully', async () => {
      // Mock user exists without a virtual account
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Mock no existing account with the same number
      mockPrismaService.virtualAccount.findUnique.mockResolvedValueOnce(null);
      
      // Mock non-HttpException error (like connection error)
      const connectionError = new Error('Connection error');
      mockPrismaService.virtualAccount.create.mockRejectedValueOnce(connectionError);

      // Expect the service to throw an HttpException with internal server error
      await expect(service.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException(
          'Failed to register virtual account',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
      
      // Verify the error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error registering virtual account'),
        expect.any(String)
      );
    });
  });

  describe('searchTransaction', () => {
    it('should successfully search for a transaction', async () => {
      // Mock HttpService post method
      mockHttpService.post.mockReturnValueOnce(
        of({
          data: mockTransactionSearchResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      const result = await service.searchTransaction('test-moid-123');

      // Check HttpService was called with correct parameters
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://test-api.ez-pg.com/searchTransApi',
        {
          mid: 'test-merchant-id',
          meky: 'test-merchant-key',
          moid: 'test-moid-123',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Check the result is as expected
      expect(result).toEqual(mockTransactionSearchResponse);
    });

    it('should throw HttpException when API call fails', async () => {
      // Mock HttpService post method with network error
      mockHttpService.post.mockReturnValueOnce(
        throwError(() => new Error('Network error'))
      );

      // Expect the service to throw an HttpException
      await expect(service.searchTransaction('test-moid-123')).rejects.toThrow(
        new HttpException(
          'Failed to search transaction',
          HttpStatus.SERVICE_UNAVAILABLE
        )
      );
    });
  });

  describe('constructor', () => {
    it('should log error when merchant ID or key is missing', () => {
      // Save original env vars
      const originalMerchantId = process.env.EZPG_MERCHANT_ID;
      const originalMerchantKey = process.env.EZPG_MERCHANT_KEY;
      
      // Set env vars to empty strings
      process.env.EZPG_MERCHANT_ID = '';
      process.env.EZPG_MERCHANT_KEY = '';
      
      // Create a new service instance to trigger the constructor
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const _localService = new MerchantService(
        mockPrismaService as unknown as PrismaService, 
        mockHttpService as unknown as HttpService
      );
      
      // Verify logger was called with the expected message
      expect(loggerSpy).toHaveBeenCalledWith('EZPG_MERCHANT_ID and EZPG_MERCHANT_KEY must be set in environment variables');
      
      // Restore original env vars
      process.env.EZPG_MERCHANT_ID = originalMerchantId;
      process.env.EZPG_MERCHANT_KEY = originalMerchantKey;
    });
  });
}); 