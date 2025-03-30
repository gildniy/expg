import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PointService } from '@/services/point.service';
import { PointBalanceDto, PointHistoryQueryDto, PointTransactionDto } from '@/dto/point.dto';
import { Request } from 'express';

/**
 * Controller responsible for handling point-related endpoints
 * Manages point balance queries, transactions, and transaction history
 * All endpoints require authentication
 */
@ApiTags('Points')
@Controller('points')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PointController {
  constructor(private readonly pointService: PointService) {}

  /**
   * Retrieves the current point balance for the authenticated user
   *
   * @param req - The request object containing the authenticated user information
   * @returns Object containing the current point balance
   */
  @Get('balance')
  @ApiOperation({ summary: 'Get current point balance' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current point balance',
    type: PointBalanceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Req() req: Request): Promise<PointBalanceDto> {
    return this.pointService.getBalance(req.user.id);
  }

  /**
   * Creates a new point transaction for the authenticated user
   *
   * @param req - The request object containing the authenticated user information
   * @param transactionDto - Object containing transaction details
   * @returns The created point transaction
   */
  @Post('transaction')
  @ApiOperation({ summary: 'Create a new point transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: PointTransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTransaction(
    @Req() req: Request,
    @Body() transactionDto: PointTransactionDto,
  ): Promise<PointTransactionDto> {
    return this.pointService.createTransaction(req.user.id, transactionDto);
  }

  /**
   * Retrieves point transaction history for the authenticated user
   * Can be filtered by merchant ID and transaction type
   *
   * @param req - The request object containing the authenticated user information
   * @param query - Object containing filter criteria
   * @returns Array of point transactions matching the criteria
   */
  @Get('history')
  @ApiOperation({ summary: 'Get point transaction history' })
  @ApiResponse({
    status: 200,
    description: 'Returns the point transaction history',
    type: [PointTransactionDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Req() req: Request,
    @Query() query: PointHistoryQueryDto,
  ): Promise<PointTransactionDto[]> {
    return this.pointService.getHistory(req.user.id, query);
  }
}
