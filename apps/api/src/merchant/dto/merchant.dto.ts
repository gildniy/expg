import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsNumber, IsOptional, IsString, Min} from 'class-validator';

export class ProcessWithdrawalDto {
    @ApiProperty({example: 'ORDER12345', description: 'Unique merchant order ID'})
    @IsString()
    @IsNotEmpty()
    moid: string;

    @ApiProperty({example: 5000, description: 'Amount to withdraw in the smallest currency unit'})
    @IsNumber()
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
    accountHolderName: string;

    @ApiProperty({description: 'Transaction ID in our system'})
    @IsString()
    @IsNotEmpty()
    transactionId: string;
}

export class VirtualAccountDto {
    @ApiProperty({example: 'user@example.com', description: 'Email of the user to create a virtual account for'})
    @IsString()
    @IsNotEmpty()
    email: string;
}

export class VirtualAccountResponseDto {
    @ApiProperty({example: '123'})
    id: string;
    
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
    
    @ApiProperty({example: 'ORDER12345'})
    merchantOrderId: string;
    
    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    createdAt: string;
    
    @ApiProperty({example: '12345', required: false})
    referenceId?: string;
    
    @ApiProperty({required: false})
    metadata?: Record<string, any>;
}
