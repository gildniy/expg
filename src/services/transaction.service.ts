import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { VirtualAccount } from '../entities/virtual-account.entity';
import { Point } from '../entities/point.entity';
import { EzpgService } from './ezpg.service';

/**
 * Service responsible for managing financial transactions
 * Handles deposits, withdrawals, transaction status updates, and related point balance operations
 */
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(VirtualAccount)
    private virtualAccountRepository: Repository<VirtualAccount>,
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
    private ezpgService: EzpgService,
    private dataSource: DataSource,
  ) {}

  /**
   * Creates a deposit transaction and credits points to the user
   * Uses a database transaction to ensure data consistency
   * 
   * @param data - Object containing deposit transaction details
   * @returns The created transaction entity
   * @throws HttpException if virtual account is not found
   */
  async createDeposit(data: {
    virtualAccountId: string;
    userId: string;
    merchantId: string;
    amount: number;
    moid: string;
    providerTransactionId: string;
    metadata?: Record<string, any>;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const virtualAccount = await queryRunner.manager.findOne(VirtualAccount, {
        where: { id: data.virtualAccountId },
      });

      if (!virtualAccount) {
        throw new HttpException('Virtual account not found', HttpStatus.NOT_FOUND);
      }

      const transaction = this.transactionRepository.create({
        ...data,
        transactionType: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // Credit points to user
      await this.creditPoints(data.userId, data.merchantId, data.amount, queryRunner);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Creates a withdrawal transaction and processes it through EZPG
   * Checks if user has sufficient points and debits them upon successful processing
   * Uses a database transaction to ensure data consistency
   * 
   * @param data - Object containing withdrawal transaction details
   * @returns The created transaction entity
   * @throws HttpException if user has insufficient points or withdrawal processing fails
   */
  async createWithdrawal(data: {
    userId: string;
    merchantId: string;
    amount: number;
    bankCd: string;
    accountNo: string;
    accountName: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user has enough points
      const points = await queryRunner.manager.findOne(Point, {
        where: {
          userId: data.userId,
          merchantId: data.merchantId,
        },
      });

      if (!points || points.balance < data.amount) {
        throw new HttpException('Insufficient points', HttpStatus.BAD_REQUEST);
      }

      // Create withdrawal transaction
      const transaction = this.transactionRepository.create({
        ...data,
        transactionType: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      try {
        // Process withdrawal through EZPG
        const ezpgResponse = await this.ezpgService.processWithdrawal({
          amount: data.amount,
          bankCd: data.bankCd,
          accountNo: data.accountNo,
          accountName: data.accountName,
        });

        // Update transaction with EZPG response
        savedTransaction.providerTransactionId = ezpgResponse.transactionId;
        savedTransaction.status = TransactionStatus.PROCESSING;
        await queryRunner.manager.save(savedTransaction);

        // Debit points from user
        await this.debitPoints(data.userId, data.merchantId, data.amount, queryRunner);

        await queryRunner.commitTransaction();
        return savedTransaction;
      } catch (error) {
        savedTransaction.status = TransactionStatus.FAILED;
        savedTransaction.metadata = {
          ...savedTransaction.metadata,
          error: error.message,
        };
        await queryRunner.manager.save(savedTransaction);
        throw error;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves a transaction by its ID
   * 
   * @param id - The ID of the transaction to retrieve
   * @returns The found transaction entity with virtual account relation
   * @throws HttpException if transaction is not found
   */
  async getTransaction(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['virtualAccount'],
    });

    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return transaction;
  }

  /**
   * Retrieves all transactions for a specific user
   * 
   * @param userId - The ID of the user to find transactions for
   * @returns Array of transaction entities for the specified user
   */
  async getTransactionsByUserId(userId: string) {
    return await this.transactionRepository.find({
      where: { userId },
      relations: ['virtualAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves all transactions for a specific merchant
   * 
   * @param merchantId - The ID of the merchant to find transactions for
   * @returns Array of transaction entities for the specified merchant
   */
  async getTransactionsByMerchantId(merchantId: string) {
    return await this.transactionRepository.find({
      where: { merchantId },
      relations: ['virtualAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates the status of a transaction
   * 
   * @param id - The ID of the transaction to update
   * @param status - The new status to set for the transaction
   * @returns The updated transaction entity
   */
  async updateTransactionStatus(id: string, status: TransactionStatus) {
    const transaction = await this.getTransaction(id);
    transaction.status = status;
    return await this.transactionRepository.save(transaction);
  }

  /**
   * Credits points to a user for a specific merchant
   * Creates a new point record if one doesn't exist
   * 
   * @param userId - The ID of the user to credit points to
   * @param merchantId - The ID of the merchant for which points are credited
   * @param amount - The amount of points to credit
   * @param queryRunner - The query runner for transaction management
   */
  private async creditPoints(userId: string, merchantId: string, amount: number, queryRunner: any) {
    const points = await queryRunner.manager.findOne(Point, {
      where: {
        userId,
        merchantId,
      },
    });

    if (points) {
      points.balance += amount;
      await queryRunner.manager.save(points);
    } else {
      await queryRunner.manager.save({
        userId,
        merchantId,
        balance: amount,
      });
    }
  }

  /**
   * Debits points from a user for a specific merchant
   * 
   * @param userId - The ID of the user to debit points from
   * @param merchantId - The ID of the merchant for which points are debited
   * @param amount - The amount of points to debit
   * @param queryRunner - The query runner for transaction management
   * @throws HttpException if user has insufficient points
   */
  private async debitPoints(userId: string, merchantId: string, amount: number, queryRunner: any) {
    const points = await queryRunner.manager.findOne(Point, {
      where: {
        userId,
        merchantId,
      },
    });

    if (!points || points.balance < amount) {
      throw new HttpException('Insufficient points', HttpStatus.BAD_REQUEST);
    }

    points.balance -= amount;
    await queryRunner.manager.save(points);
  }
} 