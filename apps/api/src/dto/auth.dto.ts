import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

/**
 * Data Transfer Object for user registration
 * Contains all the required fields to create a new user account
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

/**
 * Data Transfer Object for admin registration by super admins
 * Contains fields required for creating new admin accounts
 */
export class RegisterAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password (minimum 6 characters)',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Admin full name',
    example: 'Admin User',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Admin phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

/**
 * Data Transfer Object for merchant registration by admins
 * Contains fields required for creating new merchant accounts
 */
export class RegisterMerchantDto {
  @ApiProperty({
    description: 'Merchant email address',
    example: 'merchant@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Merchant password (minimum 6 characters)',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Merchant business name',
    example: 'ABC Merchant Inc.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Merchant phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    description: 'Additional merchant details',
    example: { businessType: 'Retail', taxId: '123-45-6789' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data Transfer Object for user login
 * Contains the credentials needed to authenticate a user
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  password: string;
}

/**
 * Data Transfer Object for changing a user's password
 * Contains both the current password for verification and the new password
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'newPassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
