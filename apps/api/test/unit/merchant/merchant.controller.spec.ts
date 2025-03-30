import { Test, TestingModule } from '@nestjs/testing';
import { MerchantController } from '../../../src/merchant/merchant.controller';
import { MerchantService } from '../../../src/merchant/merchant.service';
import { VirtualAccountDto } from '../../../src/merchant/dto/merchant.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('MerchantController', () => {
  let controller: MerchantController;
  let merchantService: MerchantService;

  // Mock DTOs
  const mockVirtualAccountDto: VirtualAccountDto = {
    email: 'test@example.com'
  };

  // Mock return data
  const mockVirtualAccount = {
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

  const mockTransactionSearchResult = {
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

  // Create mock service
  const mockMerchantService = {
    registerVirtualAccount: jest.fn(),
    searchTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantController],
      providers: [
        {
          provide: MerchantService,
          useValue: mockMerchantService,
        },
      ],
    }).compile();

    controller = module.get<MerchantController>(MerchantController);
    merchantService = module.get<MerchantService>(MerchantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerVirtualAccount', () => {
    it('should call service.registerVirtualAccount with the correct parameters', async () => {
      // Mock service method to return success
      mockMerchantService.registerVirtualAccount.mockResolvedValueOnce(mockVirtualAccount);

      // Call controller method
      const result = await controller.registerVirtualAccount(mockVirtualAccountDto);

      // Check service was called with correct data
      expect(mockMerchantService.registerVirtualAccount).toHaveBeenCalledWith(mockVirtualAccountDto);
      
      // Check response is as expected
      expect(result).toEqual(mockVirtualAccount);
    });

    it('should propagate errors from the service', async () => {
      // Mock service to throw error
      const errorMessage = 'User already has a virtual account';
      mockMerchantService.registerVirtualAccount.mockRejectedValueOnce(
        new HttpException(errorMessage, HttpStatus.CONFLICT)
      );

      // Call controller method and expect error
      await expect(controller.registerVirtualAccount(mockVirtualAccountDto)).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.CONFLICT)
      );
      
      // Check service was called
      expect(mockMerchantService.registerVirtualAccount).toHaveBeenCalledWith(mockVirtualAccountDto);
    });
  });

  describe('searchTransaction', () => {
    it('should call service.searchTransaction with the correct parameters', async () => {
      // Mock service method to return success
      mockMerchantService.searchTransaction.mockResolvedValueOnce(mockTransactionSearchResult);

      // Call controller method
      const result = await controller.searchTransaction('test-moid-123');

      // Check service was called with correct data
      expect(mockMerchantService.searchTransaction).toHaveBeenCalledWith('test-moid-123');
      
      // Check response is as expected
      expect(result).toEqual(mockTransactionSearchResult);
    });

    it('should propagate errors from the service', async () => {
      // Mock service to throw error
      const errorMessage = 'Failed to search transaction';
      mockMerchantService.searchTransaction.mockRejectedValueOnce(
        new HttpException(errorMessage, HttpStatus.SERVICE_UNAVAILABLE)
      );

      // Call controller method and expect error
      await expect(controller.searchTransaction('test-moid-123')).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.SERVICE_UNAVAILABLE)
      );
      
      // Check service was called
      expect(mockMerchantService.searchTransaction).toHaveBeenCalledWith('test-moid-123');
    });
  });
}); 