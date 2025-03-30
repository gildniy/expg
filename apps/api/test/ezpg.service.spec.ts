import { Test, TestingModule } from '@nestjs/testing';
import { EzpgService } from '../src/services/ezpg.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HttpException } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EzpgService', () => {
  let service: EzpgService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [EzpgService],
    }).compile();

    service = module.get<EzpgService>(EzpgService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVirtualAccount', () => {
    it('should create a virtual account successfully', async () => {
      const mockResponse = {
        data: {
          transactionId: 'TRANS123',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
          userSeq: '12345',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.createVirtualAccount({
        merchantId: 'MERCH123',
        bankCd: 'BANK_ABC',
        accountNo: '1234567890',
        accountName: 'Test User',
        fixYn: 'Y',
        depositAmt: 100000,
        currency: 'USD',
      });

      expect(result).toEqual({
        transactionId: 'TRANS123',
        bankCd: 'BANK_ABC',
        accountNo: '1234567890',
        accountName: 'Test User',
        userSeq: '12345',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          merchantId: 'MERCH123',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
          fixYn: 'Y',
          depositAmt: 100000,
          currency: 'USD',
        }),
        expect.any(Object),
      );
    });

    it('should throw an error when virtual account creation fails', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Failed to create virtual account',
          },
          status: 400,
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        service.createVirtualAccount({
          merchantId: 'MERCH123',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
          fixYn: 'Y',
          depositAmt: 100000,
          currency: 'USD',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should handle errors with missing response data', async () => {
      const mockError = {
        // Missing response data
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        service.createVirtualAccount({
          merchantId: 'MERCH123',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
          fixYn: 'Y',
          depositAmt: 100000,
          currency: 'USD',
        }),
      ).rejects.toThrow(HttpException);

      // Should use default error message
      await expect(
        service.createVirtualAccount({
          merchantId: 'MERCH123',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
          fixYn: 'Y',
          depositAmt: 100000,
          currency: 'USD',
        }),
      ).rejects.toThrow('Failed to create virtual account');
    });
  });

  describe('getVirtualAccountStatus', () => {
    it('should get virtual account status successfully', async () => {
      const mockResponse = {
        data: {
          status: 'ACTIVE',
          message: 'Account is active',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getVirtualAccountStatus('VA123');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/virtual-accounts/VA123/status'),
        expect.any(Object),
      );
    });

    it('should handle axios errors when getting virtual account status', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Virtual account not found',
          },
          status: 404,
        },
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.getVirtualAccountStatus('VA123')).rejects.toThrow(HttpException);
      expect(mockedAxios.isAxiosError).toHaveBeenCalled();
    });

    it('should handle non-axios errors when getting virtual account status', async () => {
      const genericError = new Error('Generic error');
      mockedAxios.get.mockRejectedValueOnce(genericError);
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(service.getVirtualAccountStatus('VA123')).rejects.toThrow(HttpException);
      expect(mockedAxios.isAxiosError).toHaveBeenCalled();
    });

    it('should handle errors with missing response data', async () => {
      const mockError = {
        // Missing response data
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.getVirtualAccountStatus('VA123')).rejects.toThrow(HttpException);
      // Should receive a default error message
      await expect(service.getVirtualAccountStatus('VA123')).rejects.toThrow(/EZPG API error/);
    });
  });

  describe('withdraw', () => {
    it('should process a withdrawal successfully', async () => {
      const mockResponse = {
        data: {
          transactionId: 'TRANS123',
          status: 'PENDING',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.withdraw({
        amount: 50000,
        bankCd: 'BANK_ABC',
        accountNo: '1234567890',
        accountName: 'Test User',
      });

      expect(result).toEqual({
        transactionId: 'TRANS123',
        status: 'PENDING',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/withdrawals'),
        expect.objectContaining({
          amount: 50000,
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
        }),
        expect.any(Object),
      );
    });

    it('should throw an error when withdrawal processing fails', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Failed to process withdrawal',
          },
          status: 400,
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        service.withdraw({
          amount: 50000,
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should handle errors with missing response data during withdrawal', async () => {
      const mockError = {
        // Missing response data
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        service.withdraw({
          amount: 50000,
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
        }),
      ).rejects.toThrow(HttpException);

      // Should use default error message
      await expect(
        service.withdraw({
          amount: 50000,
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test User',
        }),
      ).rejects.toThrow(/Failed to process withdrawal/);
    });
  });

  describe('getTransactionDetails', () => {
    it('should get transaction details successfully', async () => {
      const mockResponse = {
        data: {
          transactionId: 'TRANS123',
          amount: '100000',
          status: 'COMPLETED',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getTransactionDetails('TRANS123');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/TRANS123'),
        expect.any(Object),
      );
    });

    it('should handle axios errors when getting transaction details', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Transaction not found',
          },
          status: 404,
        },
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.getTransactionDetails('TRANS123')).rejects.toThrow(HttpException);
      expect(mockedAxios.isAxiosError).toHaveBeenCalled();
    });

    it('should handle non-axios errors when getting transaction details', async () => {
      const genericError = new Error('Generic error');
      mockedAxios.get.mockRejectedValueOnce(genericError);
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(service.getTransactionDetails('TRANS123')).rejects.toThrow(HttpException);
    });
  });

  describe('validateDepositNotification', () => {
    it('should validate deposit notification successfully', async () => {
      const mockResponse = {
        data: {
          isValid: true,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.validateDepositNotification({
        transactionId: 'TRANS123',
        amount: 50000,
      });

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should handle axios errors when validating deposit notification', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid notification format',
          },
          status: 400,
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        service.validateDepositNotification({
          transactionId: 'TRANS123',
          amount: 50000,
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should handle non-axios errors when validating deposit notification', async () => {
      const genericError = new Error('Generic error');
      mockedAxios.post.mockRejectedValueOnce(genericError);
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(
        service.validateDepositNotification({
          transactionId: 'TRANS123',
          amount: 50000,
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('validateWithdrawalNotification', () => {
    it('should validate withdrawal notification successfully', async () => {
      const mockResponse = {
        data: {
          isValid: true,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.validateWithdrawalNotification({
        transactionId: 'TRANS123',
        amount: 50000,
      });

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should handle axios errors when validating withdrawal notification', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid notification format',
          },
          status: 400,
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        service.validateWithdrawalNotification({
          transactionId: 'TRANS123',
          amount: 50000,
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should handle non-axios errors when validating withdrawal notification', async () => {
      const genericError = new Error('Generic error');
      mockedAxios.post.mockRejectedValueOnce(genericError);
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(
        service.validateWithdrawalNotification({
          transactionId: 'TRANS123',
          amount: 50000,
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('handleError', () => {
    it('should handle axios errors properly', () => {
      const axiosError = {
        response: {
          data: {
            message: 'API error message',
          },
          status: 400,
        },
      };

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      // We need to call handleError indirectly since it's a private method
      const handleErrorCall = () => {
        // @ts-ignore - This is a hack to access the private method
        return service['handleError'](axiosError);
      };

      expect(handleErrorCall).toThrow(HttpException);
      expect(mockedAxios.isAxiosError).toHaveBeenCalledWith(axiosError);
    });

    it('should handle non-axios errors properly', () => {
      const genericError = new Error('Generic error');

      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      // We need to call handleError indirectly since it's a private method
      const handleErrorCall = () => {
        // @ts-ignore - This is a hack to access the private method
        return service['handleError'](genericError);
      };

      expect(handleErrorCall).toThrow(HttpException);
      expect(mockedAxios.isAxiosError).toHaveBeenCalledWith(genericError);
    });

    it('should handle axios errors without response data', () => {
      const axiosError = {};

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      const handleErrorCall = () => {
        // @ts-ignore - This is a hack to access the private method
        return service['handleError'](axiosError);
      };

      expect(handleErrorCall).toThrow(HttpException);
      expect(handleErrorCall).toThrow(/EZPG API error/);
      expect(mockedAxios.isAxiosError).toHaveBeenCalledWith(axiosError);
    });
  });
});
