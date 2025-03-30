import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VirtualAccountProvider } from '../entities/virtual-account.entity';

/**
 * Data Transfer Object for creating a new virtual account
 * Contains all required fields for virtual account creation in both
 * the EZPG system and local database
 */
export class CreateVirtualAccountDto {
  @ApiProperty({
    description: 'Merchant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  merchantId: string;

  @ApiProperty({
    description: 'Virtual account provider',
    enum: VirtualAccountProvider,
    example: VirtualAccountProvider.EZPG,
  })
  @IsEnum(VirtualAccountProvider)
  provider: VirtualAccountProvider;

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

  @ApiProperty({
    description: 'Whether the account is fixed',
    example: 'Y',
  })
  @IsString()
  fixYn: string;

  @ApiProperty({
    description: 'Deposit amount',
    example: 100000,
  })
  @IsNumber()
  depositAmt: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KRW',
  })
  @IsString()
  currency: string;
}

/**
 * Data Transfer Object for updating a virtual account's status
 * Used when changing the state of an existing virtual account
 */
export class UpdateVirtualAccountStatusDto {
  @ApiProperty({
    description: 'New status for the virtual account',
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
  })
  @IsString()
  status: string;
}

/**
 * Data Transfer Object for querying virtual accounts
 * Contains optional filter parameters to retrieve specific virtual accounts
 */
export class VirtualAccountQueryDto {
  @ApiProperty({
    description: 'Merchant ID to filter by',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty({
    description: 'Provider to filter by',
    required: false,
    enum: VirtualAccountProvider,
    example: VirtualAccountProvider.EZPG,
  })
  @IsOptional()
  @IsEnum(VirtualAccountProvider)
  provider?: VirtualAccountProvider;
}
