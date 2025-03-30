import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateDepositDto,
  CreateWithdrawalDto,
  TransactionQueryDto,
  UpdateTransactionStatusDto,
} from '../dto/transaction.dto';
import { Transaction } from '../entities/transaction.entity';

/**
 * Controller responsible for managing transaction-related endpoints
 * Handles deposits, withdrawals, and transaction queries with role-based access control
 */
@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Creates a new deposit transaction
   * Available only to users with CUSTOMER role
   *
   * @param createDepositDto - DTO containing deposit transaction details
   * @returns The created transaction entity
   */
  @Post('deposit')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new deposit transaction' })
  @ApiResponse({ status: 201, description: 'Deposit transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual account not found' })
  async createDeposit(
    @Body() createDepositDto: CreateDepositDto,
    @Request() req,
  ): Promise<Transaction> {
    // Add user ID and merchant ID from the authenticated user
    return await this.transactionService.createDeposit({
      ...createDepositDto,
      userId: req.user.id,
      merchantId: req.user.merchantId,
    });
  }

  /**
   * Creates a new withdrawal transaction
   * Available only to users with CUSTOMER role
   *
   * @param createWithdrawalDto - DTO containing withdrawal transaction details
   * @returns The created transaction entity
   */
  @Post('withdraw')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new withdrawal transaction' })
  @ApiResponse({ status: 201, description: 'Withdrawal transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient points' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual account not found' })
  async createWithdrawal(
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @Request() req,
  ): Promise<Transaction> {
    // Add user ID and merchant ID from the authenticated user
    return await this.transactionService.createWithdrawal({
      ...createWithdrawalDto,
      userId: req.user.id,
      merchantId: req.user.merchantId,
    });
  }

  /**
   * Retrieves all transactions belonging to the authenticated user
   * Available only to users with CUSTOMER role
   *
   * @param req - The request object containing authenticated user information
   * @returns Array of transactions associated with the user
   */
  @Get('my-transactions')
  @Roles(UserRole.CUSTOMER)
  async getMyTransactions(@Request() req) {
    return await this.transactionService.getTransactionsByUserId(req.user.id);
  }

  /**
   * Retrieves a specific transaction by its ID
   * Available to users with CUSTOMER or MERCHANT roles
   *
   * @param id - The ID of the transaction to retrieve
   * @returns The requested transaction entity
   */
  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTransaction(@Param('id') id: string): Promise<Transaction> {
    return await this.transactionService.getTransaction(id);
  }

  /**
   * Retrieves all transactions associated with a specific merchant
   * Available only to users with MERCHANT role
   *
   * @param merchantId - The ID of the merchant to retrieve transactions for
   * @returns Array of transactions for the specified merchant
   */
  @Get('merchant/:merchantId')
  @Roles(UserRole.MERCHANT)
  async getMerchantTransactions(@Param('merchantId') merchantId: string) {
    return await this.transactionService.getTransactionsByMerchantId(merchantId);
  }

  /**
   * Retrieves all transactions based on query parameters
   * Available to users with CUSTOMER or MERCHANT roles
   *
   * @param query - Object containing filter criteria for transactions
   * @returns Array of transactions matching the criteria
   */
  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get all transactions with optional filters' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTransactions(@Query() query: TransactionQueryDto): Promise<Transaction[]> {
    return await this.transactionService.getTransactions(query);
  }

  /**
   * Updates the status of a transaction
   * Available only to users with MERCHANT role
   *
   * @param id - The ID of the transaction to update
   * @param updateTransactionStatusDto - DTO containing the new status
   * @returns The updated transaction entity
   */
  @Post(':id/status')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status updated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body() updateTransactionStatusDto: UpdateTransactionStatusDto,
  ): Promise<Transaction> {
    return await this.transactionService.updateTransactionStatus(
      id,
      updateTransactionStatusDto.status,
    );
  }
}
