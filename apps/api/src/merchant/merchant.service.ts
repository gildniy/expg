import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {PrismaService} from '@/prisma/prisma.service';
import {ProcessWithdrawalDto, VirtualAccountDto} from './dto/merchant.dto';
import {firstValueFrom} from 'rxjs';

// Custom error class for EZPG API errors
export class EzpgApiError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'EzpgApiError';
    }
}

@Injectable()
export class MerchantService {
    private readonly logger = new Logger(MerchantService.name);
    private readonly ezpgApiBaseUrl: string;
    private readonly merchantId: string;
    private readonly merchantKey: string;

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) {
        this.ezpgApiBaseUrl = process.env.EZPG_API_BASE_URL || 'https://api.ez-pg.com';
        this.merchantId = process.env.EZPG_MERCHANT_ID || '';
        this.merchantKey = process.env.EZPG_MERCHANT_KEY || '';

        if (!this.merchantId || !this.merchantKey) {
            this.logger.error('EZPG_MERCHANT_ID and EZPG_MERCHANT_KEY must be set in environment variables');
        }
    }

    async processWithdrawal(withdrawalDto: ProcessWithdrawalDto) {
        const {moid, amount, bankCode, accountNumber, accountHolderName} = withdrawalDto;

        // Prepare the API request
        const requestData = {
            mid: this.merchantId,
            meky: this.merchantKey,
            moid,
            withAmt: amount.toString(),
            bankCd: bankCode,
            withAccntNo: accountNumber,
            withAccntNm: accountHolderName,
            withType: '03', // Fast transfer (check EZPG docs for correct value)
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.ezpgApiBaseUrl}/merWithdrawApi`, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            const result = response.data;

            if (result.resultCd !== '0000') {
                throw new EzpgApiError(
                    `EZPG withdrawal API error: ${result.resultMsg}`,
                    result.resultCd
                );
            }

            this.logger.log(`Withdrawal processed successfully. EZPG Reference: ${result.natvTrNo}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Error calling EZPG withdrawal API: ${error?.message || 'Unknown error'}`, error?.stack);

            if (error instanceof EzpgApiError) {
                throw error;
            }

            throw new HttpException(
                'Failed to process withdrawal request',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }

    async registerVirtualAccount(accountDto: VirtualAccountDto) {
        const {email} = accountDto;

        try {
            // Check if user exists
            const user = await this.prisma.user.findUnique({
                where: {email},
                include: {virtualAccount: true},
            });

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            if (user.virtualAccount) {
                throw new HttpException(
                    'User already has a virtual account assigned',
                    HttpStatus.CONFLICT,
                );
            }

            // Generate a unique virtual account number
            const accountNumber = await this.generateUniqueAccountNumber();

            // Get bank details from configuration
            const bankCode = process.env.DEFAULT_BANK_CODE || '001';
            const bankName = process.env.DEFAULT_BANK_NAME || 'Default Bank';

            // Create reference ID (could be generated via EZPG API in real implementation)
            const ezpgReferenceId = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // Check if virtual account number is already in use
            const existingAccount = await this.prisma.virtualAccount.findUnique({
                where: {accountNumber},
            });

            if (existingAccount) {
                throw new HttpException(
                    'Virtual account number already in use',
                    HttpStatus.CONFLICT,
                );
            }

            // Create virtual account
            const virtualAccount = await this.prisma.virtualAccount.create({
                data: {
                    userId: user.id,
                    accountNumber,
                    bankCode,
                    bankName,
                    ezpgReferenceId,
                    status: 'ACTIVE',
                },
            });

            return virtualAccount;
        } catch (error: any) {
            this.logger.error(`Error registering virtual account: ${error?.message || 'Unknown error'}`, error?.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                'Failed to register virtual account',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Helper method to generate a unique account number
    private async generateUniqueAccountNumber(): Promise<string> {
        const prefix = process.env.VIRTUAL_ACCOUNT_PREFIX || '9999';
        let isUnique = false;
        let accountNumber = '';

        while (!isUnique) {
            // Generate a random 10-digit number with prefix
            const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            accountNumber = `${prefix}${randomSuffix}`;

            // Check if it's unique
            const existing = await this.prisma.virtualAccount.findUnique({
                where: {accountNumber},
            });

            if (!existing) {
                isUnique = true;
            }
        }

        return accountNumber;
    }

    async searchTransaction(merchantOrderId: string) {
        try {
            const requestData = {
                mid: this.merchantId,
                meky: this.merchantKey,
                moid: merchantOrderId,
            };

            const response = await firstValueFrom(
                this.httpService.post(`${this.ezpgApiBaseUrl}/searchTransApi`, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            return response.data;
        } catch (error: any) {
            this.logger.error(`Error searching transaction: ${error?.message || 'Unknown error'}`, error?.stack);
            throw new HttpException(
                'Failed to search transaction',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }
}
