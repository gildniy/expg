import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from '../../../src/webhooks/webhooks.controller';
import { WebhooksService } from '../../../src/webhooks/webhooks.service';
import { EzpgDepositNotificationDto, EzpgWithdrawalNotificationDto } from '../../../src/webhooks/dto/webhook.dto';
import { HttpStatus } from '@nestjs/common';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let webhooksService: WebhooksService;

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

  // Create mock for webhooks service
  const mockWebhooksService = {
    handleDepositNotification: jest.fn(),
    handleWithdrawalNotification: jest.fn(),
  };

  // Mock Express response object
  const mockResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    webhooksService = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleDepositNotification', () => {
    it('should call webhooksService.handleDepositNotification and return success response', async () => {
      // Set up service mock to return success code
      mockWebhooksService.handleDepositNotification.mockResolvedValueOnce('0000');
      
      // Create mock response object
      const res = mockResponse();

      // Call the controller method
      await controller.handleDepositNotification(mockDepositNotification, res as any);

      // Verify service method was called with the dto
      expect(mockWebhooksService.handleDepositNotification).toHaveBeenCalledWith(mockDepositNotification);
      
      // Verify response was properly sent
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith('0000');
    });

    it('should handle errors from webhooksService.handleDepositNotification and return error response', async () => {
      // Set up service mock to throw an error
      const testError = new Error('Test error');
      mockWebhooksService.handleDepositNotification.mockRejectedValueOnce(testError);
      
      // Create mock response object
      const res = mockResponse();

      // Call the controller method
      await controller.handleDepositNotification(mockDepositNotification, res as any);
      
      // Verify service method was called with the dto
      expect(mockWebhooksService.handleDepositNotification).toHaveBeenCalledWith(mockDepositNotification);
      
      // Verify error response was properly sent
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith('9999');
    });
  });

  describe('handleWithdrawalNotification', () => {
    it('should call webhooksService.handleWithdrawalNotification and return success response', async () => {
      // Set up service mock to return success code
      mockWebhooksService.handleWithdrawalNotification.mockResolvedValueOnce('0000');
      
      // Create mock response object
      const res = mockResponse();

      // Call the controller method
      await controller.handleWithdrawalNotification(mockWithdrawalNotification, res as any);

      // Verify service method was called with the dto
      expect(mockWebhooksService.handleWithdrawalNotification).toHaveBeenCalledWith(mockWithdrawalNotification);
      
      // Verify response was properly sent
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith('0000');
    });

    it('should handle errors from webhooksService.handleWithdrawalNotification and return error response', async () => {
      // Set up service mock to throw an error
      const testError = new Error('Test error');
      mockWebhooksService.handleWithdrawalNotification.mockRejectedValueOnce(testError);
      
      // Create mock response object
      const res = mockResponse();

      // Call the controller method
      await controller.handleWithdrawalNotification(mockWithdrawalNotification, res as any);
      
      // Verify service method was called with the dto
      expect(mockWebhooksService.handleWithdrawalNotification).toHaveBeenCalledWith(mockWithdrawalNotification);
      
      // Verify error response was properly sent
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith('9999');
    });
  });
}); 