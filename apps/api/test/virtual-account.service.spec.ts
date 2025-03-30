import { Test, TestingModule } from '@nestjs/testing';
import { VirtualAccountService } from '../src/services/virtual-account.service';
import { DataSource, Repository } from 'typeorm';
import {
  VirtualAccount,
  VirtualAccountProvider,
  VirtualAccountStatus,
} from '../src/entities/virtual-account.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EzpgService } from '../src/services/ezpg.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { CreateVirtualAccountDto, VirtualAccountQueryDto } from '../src/dto/virtual-account.dto';

describe('VirtualAccountService', () => {
  let service: VirtualAccountService;
  let mockRepository: jest.Mocked<Repository<VirtualAccount>>;
  let mockEzpgService: jest.Mocked<EzpgService>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirtualAccountService,
        {
          provide: getRepositoryToken(VirtualAccount),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EzpgService,
          useValue: {
            createVirtualAccount: jest.fn(),
            getVirtualAccountStatus: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<VirtualAccountService>(VirtualAccountService);
    mockRepository = module.get(getRepositoryToken(VirtualAccount));
    mockEzpgService = module.get(EzpgService);
    mockDataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(mockRepository).toBeDefined();
    expect(mockEzpgService).toBeDefined();
  });

  describe('createVirtualAccount', () => {
    it('should create a virtual account successfully', async () => {
      const createDto: CreateVirtualAccountDto = {
        merchantId: 'MERCH123',
        bankCd: '123',
        accountNo: '1234567890',
        accountName: 'Test Account',
        fixYn: 'Y',
        depositAmt: 1000,
        currency: 'USD',
        provider: VirtualAccountProvider.EZPG,
      };

      const mockEzpgResponse = {
        transactionId: 'TRANS123',
        bankCd: '123',
        accountNo: '1234567890',
        accountName: 'Test Account',
        userSeq: 'USER123',
      };

      const mockVirtualAccount = {
        id: '1',
        userId: '1',
        merchantId: 'MERCH123',
        bankCd: '123',
        accountNo: '1234567890',
        accountName: 'Test Account',
        fixYn: 'Y',
        depositAmt: 1000,
        currency: 'USD',
        provider: VirtualAccountProvider.EZPG,
        providerTransactionId: mockEzpgResponse.transactionId,
        status: VirtualAccountStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
        transactions: [],
      };

      mockEzpgService.createVirtualAccount.mockResolvedValue(mockEzpgResponse);
      mockRepository.create.mockReturnValue(mockVirtualAccount);
      mockQueryRunner.manager.save.mockResolvedValue(mockVirtualAccount);

      const result = await service.createVirtualAccount(createDto);

      expect(result).toEqual(mockVirtualAccount);
      expect(mockEzpgService.createVirtualAccount).toHaveBeenCalledWith({
        merchantId: createDto.merchantId,
        bankCd: createDto.bankCd,
        accountNo: createDto.accountNo,
        accountName: createDto.accountName,
        fixYn: createDto.fixYn,
        depositAmt: createDto.depositAmt,
        currency: createDto.currency,
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw an error if EZPG service fails', async () => {
      const createDto: CreateVirtualAccountDto = {
        merchantId: 'MERCH123',
        bankCd: '123',
        accountNo: '1234567890',
        accountName: 'Test Account',
        fixYn: 'Y',
        depositAmt: 1000,
        currency: 'USD',
        provider: VirtualAccountProvider.EZPG,
      };

      mockEzpgService.createVirtualAccount.mockRejectedValue(new Error('EZPG service error'));

      await expect(service.createVirtualAccount(createDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getVirtualAccount', () => {
    it('should return a virtual account by id', async () => {
      const virtualAccountId = '1';
      const mockVirtualAccount = {
        id: virtualAccountId,
        status: VirtualAccountStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);

      const result = await service.getVirtualAccount(virtualAccountId);

      expect(result).toEqual(mockVirtualAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: virtualAccountId },
      });
    });

    it('should throw NotFoundException when virtual account not found', async () => {
      const virtualAccountId = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getVirtualAccount(virtualAccountId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVirtualAccounts', () => {
    it('should return virtual accounts based on query', async () => {
      const query: VirtualAccountQueryDto = {
        merchantId: 'MERCH123',
        provider: VirtualAccountProvider.EZPG,
      };

      const mockVirtualAccounts = [
        { id: '1', merchantId: 'MERCH123', provider: VirtualAccountProvider.EZPG },
        { id: '2', merchantId: 'MERCH123', provider: VirtualAccountProvider.EZPG },
      ];

      mockRepository.find.mockResolvedValue(mockVirtualAccounts as VirtualAccount[]);

      const result = await service.getVirtualAccounts(query);

      expect(result).toEqual(mockVirtualAccounts);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          merchantId: query.merchantId,
          provider: query.provider,
        },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return virtual accounts with empty query', async () => {
      const query: VirtualAccountQueryDto = {};

      const mockVirtualAccounts = [
        { id: '1', merchantId: 'MERCH123', provider: VirtualAccountProvider.EZPG },
        { id: '2', merchantId: 'MERCH456', provider: VirtualAccountProvider.DAESUN },
      ];

      mockRepository.find.mockResolvedValue(mockVirtualAccounts as VirtualAccount[]);

      const result = await service.getVirtualAccounts(query);

      expect(result).toEqual(mockVirtualAccounts);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateVirtualAccountStatus', () => {
    it('should update a virtual account status', async () => {
      const virtualAccountId = '1';
      const newStatus = VirtualAccountStatus.INACTIVE;
      const mockVirtualAccount = {
        id: virtualAccountId,
        status: VirtualAccountStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);
      mockRepository.save.mockResolvedValue({
        ...mockVirtualAccount,
        status: newStatus,
      } as VirtualAccount);

      const result = await service.updateVirtualAccountStatus(virtualAccountId, newStatus);

      expect(result.status).toEqual(newStatus);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getVirtualAccountByAccountNumber', () => {
    it('should return a virtual account by account number and provider', async () => {
      const accountNo = '1234567890';
      const provider = VirtualAccountProvider.EZPG;
      const mockVirtualAccount = {
        id: '1',
        accountNo,
        provider,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);

      const result = await service.getVirtualAccountByAccountNumber(accountNo, provider);

      expect(result).toEqual(mockVirtualAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { accountNo, provider },
      });
    });

    it('should use EZPG as default provider when not specified', async () => {
      const accountNo = '1234567890';
      const mockVirtualAccount = {
        id: '1',
        accountNo,
        provider: VirtualAccountProvider.EZPG,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);

      const result = await service.getVirtualAccountByAccountNumber(accountNo);

      expect(result).toEqual(mockVirtualAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { accountNo, provider: VirtualAccountProvider.EZPG },
      });
    });

    it('should throw HttpException when virtual account not found', async () => {
      const accountNo = '1234567890';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getVirtualAccountByAccountNumber(accountNo)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getVirtualAccountsByUserId', () => {
    it('should return virtual accounts for a user', async () => {
      const userId = '1';
      const mockVirtualAccounts = [
        { id: '1', userId, merchantId: 'MERCH123' },
        { id: '2', userId, merchantId: 'MERCH123' },
      ];

      mockRepository.find.mockResolvedValue(mockVirtualAccounts as VirtualAccount[]);

      const result = await service.getVirtualAccountsByUserId(userId);

      expect(result).toEqual(mockVirtualAccounts);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('getVirtualAccountsByMerchantId', () => {
    it('should return virtual accounts for a merchant', async () => {
      const merchantId = 'MERCH123';
      const mockVirtualAccounts = [
        { id: '1', userId: '1', merchantId },
        { id: '2', userId: '2', merchantId },
      ];

      mockRepository.find.mockResolvedValue(mockVirtualAccounts as VirtualAccount[]);

      const result = await service.getVirtualAccountsByMerchantId(merchantId);

      expect(result).toEqual(mockVirtualAccounts);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { merchantId },
      });
    });
  });

  describe('deactivateVirtualAccount', () => {
    it('should deactivate a virtual account', async () => {
      const virtualAccountId = '1';
      const mockVirtualAccount = {
        id: virtualAccountId,
        status: VirtualAccountStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);
      mockRepository.save.mockImplementation((account) =>
        Promise.resolve(account as VirtualAccount),
      );

      const result = await service.deactivateVirtualAccount(virtualAccountId);

      expect(result.status).toEqual(VirtualAccountStatus.INACTIVE);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockVirtualAccount,
        status: VirtualAccountStatus.INACTIVE,
      });
    });
  });

  describe('activateVirtualAccount', () => {
    it('should activate a virtual account', async () => {
      const virtualAccountId = '1';
      const mockVirtualAccount = {
        id: virtualAccountId,
        status: VirtualAccountStatus.INACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockVirtualAccount as VirtualAccount);
      mockRepository.save.mockImplementation((account) =>
        Promise.resolve(account as VirtualAccount),
      );

      const result = await service.activateVirtualAccount(virtualAccountId);

      expect(result.status).toEqual(VirtualAccountStatus.ACTIVE);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockVirtualAccount,
        status: VirtualAccountStatus.ACTIVE,
      });
    });
  });
});
