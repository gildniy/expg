import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min} from 'class-validator';

export class WithdrawalRequestDto {
    @ApiProperty({example: 5000, description: 'Amount of points to withdraw'})
    @IsNumber()
    @Min(1000) // Minimum withdrawal amount (adjust as needed)
    @IsNotEmpty()
    amount: number;

    @ApiProperty({example: '004', description: 'Bank code'})
    @IsString()
    @IsNotEmpty()
    bankCode: string;

    @ApiProperty({example: '1234567890', description: 'Bank account number'})
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiProperty({example: 'John Doe', description: 'Bank account holder name'})
    @IsString()
    @IsNotEmpty()
    accountHolder: string;

    @ApiProperty({example: 'Withdrawal request', description: 'Optional description'})
    @IsString()
    @IsOptional()
    description?: string;
}

export class TransactionFilterDto {
    @ApiProperty({
        required: false,
        enum: ['DEPOSIT', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_FAILED', 'POINTS_ADJUSTMENT']
    })
    @IsEnum(['DEPOSIT', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_FAILED', 'POINTS_ADJUSTMENT'], {each: true})
    @IsOptional()
    types?: string[];

    @ApiProperty({required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']})
    @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'], {each: true})
    @IsOptional()
    statuses?: string[];

    @ApiProperty({required: false, example: '2023-01-01'})
    @IsString()
    @IsOptional()
    startDate?: string;

    @ApiProperty({required: false, example: '2023-12-31'})
    @IsString()
    @IsOptional()
    endDate?: string;

    @ApiProperty({required: false, example: 10})
    @IsNumber()
    @IsOptional()
    limit?: number;

    @ApiProperty({required: false, example: 0})
    @IsNumber()
    @IsOptional()
    offset?: number;
}

export class PointBalanceResponseDto {
    @ApiProperty({example: 5000})
    balance: number;
    
    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    updatedAt: string;
}

export class VirtualAccountResponseDto {
    @ApiProperty({example: '1234567890'})
    accountNumber: string;
    
    @ApiProperty({example: 'Some Bank'})
    bankName: string;
    
    @ApiProperty({example: 'John Doe'})
    accountHolderName: string;
    
    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    createdAt: string;
}

export class TransactionResponseDto {
    @ApiProperty({example: '123'})
    id: string;
    
    @ApiProperty({example: 'DEPOSIT'})
    type: string;
    
    @ApiProperty({example: 'COMPLETED'})
    status: string;
    
    @ApiProperty({example: 5000})
    amount: number;
    
    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    createdAt: string;
    
    @ApiProperty({example: '12345', required: false})
    referenceId?: string;
    
    @ApiProperty({required: false})
    metadata?: Record<string, any>;
}

export class TransactionsResponseDto {
    @ApiProperty({type: [TransactionResponseDto]})
    transactions: TransactionResponseDto[];
    
    @ApiProperty({example: 10})
    total: number;
}

export class WithdrawalResponseDto {
    @ApiProperty({example: '123'})
    id: string;
    
    @ApiProperty({example: 'WITHDRAWAL_REQUEST'})
    type: string;
    
    @ApiProperty({example: 'PENDING'})
    status: string;
    
    @ApiProperty({example: 5000})
    amount: number;
    
    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    createdAt: string;
}
