import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  VirtualAccount,
  VirtualAccountProvider,
  VirtualAccountStatus,
} from '../entities/virtual-account.entity';
import { EzpgService } from './ezpg.service';
import { CreateVirtualAccountDto, VirtualAccountQueryDto } from '../dto/virtual-account.dto';

/**
 * Service responsible for managing virtual accounts
 * Handles creation, retrieval, and status updates of virtual accounts
 * through the EZPG payment gateway and local database
 */
@Injectable()
export class VirtualAccountService {
  constructor(
    @InjectRepository(VirtualAccount)
    private virtualAccountRepository: Repository<VirtualAccount>,
    private ezpgService: EzpgService,
    private dataSource: DataSource,
  ) {}

  /**
   * Creates a new virtual account both in the EZPG system and local database
   * Uses transaction to ensure data consistency
   *
   * @param createVirtualAccountDto - DTO containing virtual account creation details
   * @returns The created virtual account entity
   * @throws BadRequestException if creation fails
   */
  async createVirtualAccount(
    createVirtualAccountDto: CreateVirtualAccountDto,
  ): Promise<VirtualAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create virtual account through EZPG service
      const ezpgResponse = await this.ezpgService.createVirtualAccount({
        merchantId: createVirtualAccountDto.merchantId,
        bankCd: createVirtualAccountDto.bankCd,
        accountNo: createVirtualAccountDto.accountNo,
        accountName: createVirtualAccountDto.accountName,
        fixYn: createVirtualAccountDto.fixYn,
        depositAmt: createVirtualAccountDto.depositAmt,
        currency: createVirtualAccountDto.currency,
      });

      // Create virtual account in database
      const virtualAccount = this.virtualAccountRepository.create({
        ...createVirtualAccountDto,
        provider: VirtualAccountProvider.EZPG,
        status: VirtualAccountStatus.ACTIVE,
        providerTransactionId: ezpgResponse.transactionId,
      });

      await queryRunner.manager.save(virtualAccount);
      await queryRunner.commitTransaction();
      return virtualAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Failed to create virtual account');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves a virtual account by its ID
   *
   * @param id - The ID of the virtual account to retrieve
   * @returns The found virtual account entity
   * @throws NotFoundException if the virtual account does not exist
   */
  async getVirtualAccount(id: string): Promise<VirtualAccount> {
    const virtualAccount = await this.virtualAccountRepository.findOne({
      where: { id },
    });

    if (!virtualAccount) {
      throw new NotFoundException('Virtual account not found');
    }

    return virtualAccount;
  }

  /**
   * Retrieves multiple virtual accounts based on query parameters
   *
   * @param query - DTO containing filter criteria for virtual accounts
   * @returns Array of virtual account entities matching the criteria
   */
  async getVirtualAccounts(query: VirtualAccountQueryDto): Promise<VirtualAccount[]> {
    const where: any = {};

    if (query.merchantId) {
      where.merchantId = query.merchantId;
    }

    if (query.provider) {
      where.provider = query.provider;
    }

    return await this.virtualAccountRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates the status of a virtual account
   *
   * @param id - The ID of the virtual account to update
   * @param status - The new status to set for the virtual account
   * @returns The updated virtual account entity
   */
  async updateVirtualAccountStatus(
    id: string,
    status: VirtualAccountStatus,
  ): Promise<VirtualAccount> {
    const virtualAccount = await this.getVirtualAccount(id);

    virtualAccount.status = status;
    await this.virtualAccountRepository.save(virtualAccount);

    return virtualAccount;
  }

  /**
   * Retrieves a virtual account by its account number and provider
   *
   * @param accountNo - The account number to search for
   * @param provider - The provider of the virtual account (defaults to EZPG)
   * @returns The found virtual account entity
   * @throws HttpException if the virtual account does not exist
   */
  async getVirtualAccountByAccountNumber(
    accountNo: string,
    provider: VirtualAccountProvider = VirtualAccountProvider.EZPG,
  ) {
    const virtualAccount = await this.virtualAccountRepository.findOne({
      where: { accountNo, provider },
    });

    if (!virtualAccount) {
      throw new HttpException('Virtual account not found', HttpStatus.NOT_FOUND);
    }

    return virtualAccount;
  }

  /**
   * Retrieves all virtual accounts associated with a specific user
   *
   * @param userId - The ID of the user to find virtual accounts for
   * @returns Array of virtual account entities for the specified user
   */
  async getVirtualAccountsByUserId(userId: string) {
    return await this.virtualAccountRepository.find({
      where: { userId },
    });
  }

  /**
   * Retrieves all virtual accounts associated with a specific merchant
   *
   * @param merchantId - The ID of the merchant to find virtual accounts for
   * @returns Array of virtual account entities for the specified merchant
   */
  async getVirtualAccountsByMerchantId(merchantId: string) {
    return await this.virtualAccountRepository.find({
      where: { merchantId },
    });
  }

  /**
   * Deactivates a virtual account by setting status to INACTIVE
   *
   * @param id - The ID of the virtual account to deactivate
   * @returns The updated virtual account entity
   */
  async deactivateVirtualAccount(id: string) {
    const virtualAccount = await this.getVirtualAccount(id);
    virtualAccount.status = VirtualAccountStatus.INACTIVE;
    return await this.virtualAccountRepository.save(virtualAccount);
  }

  /**
   * Activates a virtual account by setting status to ACTIVE
   *
   * @param id - The ID of the virtual account to activate
   * @returns The updated virtual account entity
   */
  async activateVirtualAccount(id: string) {
    const virtualAccount = await this.getVirtualAccount(id);
    virtualAccount.status = VirtualAccountStatus.ACTIVE;
    return await this.virtualAccountRepository.save(virtualAccount);
  }
}
