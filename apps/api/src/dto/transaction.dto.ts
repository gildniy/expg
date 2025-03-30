import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '../entities/transaction.entity';

/**
 * Data Transfer Object for creating a deposit transaction
 * Contains all required fields to create a new deposit in the system
 */
export class CreateDepositDto {
  @ApiProperty({
    description: 'Virtual account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  virtualAccountId: string;

  @ApiProperty({
    description: 'Deposit amount',
    example: 100000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KRW',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Merchant order ID',
    example: 'ORDER123456',
  })
  @IsString()
  moid: string;

  @ApiProperty({
    description: 'Provider transaction ID',
    example: 'TRANS123456',
  })
  @IsString()
  providerTransactionId: string;
}

/**
 * Data Transfer Object for creating a withdrawal transaction
 * Contains all required fields to process a withdrawal from a user's account
 */
export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Virtual account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  virtualAccountId: string;

  @ApiProperty({
    description: 'Withdrawal amount',
    example: 50000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KRW',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Bank code',
    example: 'BANK_ABC',
  })
  @IsString()
  bankCd: string;

  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
  })
  @IsString()
  accountNo: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'John Doe',
  })
  @IsString()
  accountName: string;
}

/**
 * Data Transfer Object for updating a transaction's status
 * Used for changing the status of an existing transaction
 */
export class UpdateTransactionStatusDto {
  @ApiProperty({
    description: 'New transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}

/**
 * Data Transfer Object for querying transactions
 * Contains optional filter parameters to retrieve specific transactions
 */
export class TransactionQueryDto {
  @ApiProperty({
    description: 'Transaction type to filter by',
    required: false,
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    description: 'Transaction status to filter by',
    required: false,
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Virtual account ID to filter by',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  virtualAccountId?: string;
}
