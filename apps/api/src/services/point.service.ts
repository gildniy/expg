import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from '../entities/point.entity';
import { PointBalanceDto, PointHistoryQueryDto, PointTransactionDto } from '../dto/point.dto';

/**
 * Service responsible for managing user points
 * Handles point balance queries, point transactions, and transaction history
 */
@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
  ) {}

  /**
   * Retrieves the current point balance for a user
   * Calculates the balance by summing all deposit and withdrawal transactions
   *
   * @param userId - The ID of the user to check balance for
   * @returns Object containing the current point balance
   */
  async getBalance(userId: string): Promise<PointBalanceDto> {
    const points = await this.pointRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const balance = points.reduce((acc, point) => {
      if (point.type === 'DEPOSIT') {
        return acc + Number(point.amount);
      } else if (point.type === 'WITHDRAWAL') {
        return acc - Number(point.amount);
      }
      return acc;
    }, 0);

    return { balance };
  }

  /**
   * Creates a new point transaction for a user
   * Can be either a deposit (adding points) or withdrawal (removing points)
   *
   * @param userId - The ID of the user for the transaction
   * @param transactionDto - Object containing transaction details
   * @returns The created point transaction
   */
  async createTransaction(
    userId: string,
    transactionDto: PointTransactionDto,
  ): Promise<PointTransactionDto> {
    const point = this.pointRepository.create({
      userId,
      ...transactionDto,
    });

    await this.pointRepository.save(point);
    return transactionDto;
  }

  /**
   * Retrieves point transaction history for a user
   * Can be filtered by merchant ID and transaction type
   *
   * @param userId - The ID of the user to get history for
   * @param query - Object containing filter criteria
   * @returns Array of point transactions matching the criteria
   */
  async getHistory(userId: string, query: PointHistoryQueryDto): Promise<PointTransactionDto[]> {
    const where: any = { userId };

    if (query.merchantId) {
      where.merchantId = query.merchantId;
    }

    if (query.type) {
      where.type = query.type;
    }

    const points = await this.pointRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return points.map((point) => ({
      type: point.type,
      amount: Number(point.amount),
      description: point.description,
      merchantId: point.merchantId,
    }));
  }
}
