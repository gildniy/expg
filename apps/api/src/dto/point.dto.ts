import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PointTransactionType } from '@/entities/point.entity';

export class PointBalanceDto {
  @ApiProperty({
    description: 'Current point balance',
    example: 100000,
  })
  @IsNumber()
  balance: number;
}

export class PointTransactionDto {
  @ApiProperty({
    description: 'Transaction type',
    enum: PointTransactionType,
    example: PointTransactionType.DEPOSIT,
  })
  @IsEnum(PointTransactionType)
  type: PointTransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 10000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Deposit from virtual account',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Merchant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  merchantId: string;
}

export class PointHistoryQueryDto {
  @ApiProperty({
    description: 'Merchant ID to filter by',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty({
    description: 'Transaction type to filter by',
    required: false,
    enum: PointTransactionType,
    example: PointTransactionType.DEPOSIT,
  })
  @IsOptional()
  @IsEnum(PointTransactionType)
  type?: PointTransactionType;
}
