import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class EzpgDepositNotificationDto {
    @ApiProperty({description: 'Merchant ID'})
    @IsString()
    @IsNotEmpty()
    mid: string;

    @ApiProperty({description: 'Virtual account number'})
    @IsString()
    @IsNotEmpty()
    vacctNo: string;

    @ApiProperty({description: 'Bank code'})
    @IsString()
    @IsNotEmpty()
    bankCd: string;

    @ApiProperty({description: 'Amount deposited'})
    @IsString()  // EZPG might send it as string
    @IsNotEmpty()
    amt: string;

    @ApiProperty({description: 'Deposit date (YYYYMMDD)'})
    @IsString()
    @IsNotEmpty()
    depositDt: string;

    @ApiProperty({description: 'Deposit time (HHmmss)'})
    @IsString()
    @IsNotEmpty()
    depositTm: string;

    @ApiProperty({description: 'Transaction number'})
    @IsString()
    @IsNotEmpty()
    trNo: string;

    @ApiProperty({description: 'Customer name or reference'})
    @IsString()
    @IsOptional()
    depositNm?: string;

    @ApiProperty({description: 'Bank transaction ID'})
    @IsString()
    @IsOptional()
    bankTrId?: string;
}

export class EzpgWithdrawalNotificationDto {
    @ApiProperty({description: 'Merchant ID'})
    @IsString()
    @IsNotEmpty()
    mid: string;

    @ApiProperty({description: 'EZPG Native transaction number'})
    @IsString()
    @IsNotEmpty()
    natvTrNo: string;

    @ApiProperty({description: 'Merchant order ID (original request ID)'})
    @IsString()
    @IsNotEmpty()
    moid: string;

    @ApiProperty({description: 'Result code (0000 for success)'})
    @IsString()
    @IsNotEmpty()
    resultCd: string;

    @ApiProperty({description: 'Result message'})
    @IsString()
    @IsNotEmpty()
    resultMsg: string;

    @ApiProperty({description: 'Amount transferred'})
    @IsString()
    @IsNotEmpty()
    amt: string;

    @ApiProperty({description: 'Bank code'})
    @IsString()
    @IsNotEmpty()
    bankCd: string;

    @ApiProperty({description: 'Account number'})
    @IsString()
    @IsNotEmpty()
    accntNo: string;

    @ApiProperty({description: 'Account holder name'})
    @IsString()
    @IsNotEmpty()
    accntNm: string;

    @ApiProperty({description: 'Transaction date (YYYYMMDD)'})
    @IsString()
    @IsNotEmpty()
    trDt: string;

    @ApiProperty({description: 'Transaction time (HHmmss)'})
    @IsString()
    @IsNotEmpty()
    trTm: string;

    @ApiProperty({description: 'Bank transaction ID'})
    @IsString()
    @IsOptional()
    bankTrId?: string;
}
