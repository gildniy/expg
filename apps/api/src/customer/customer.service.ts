import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '@/prisma/prisma.service';
import {TransactionFilterDto, WithdrawalRequestDto} from './dto/customer.dto';
import {TransactionType, TransactionStatus} from '@prisma/client';
import {MerchantService} from '@/merchant/merchant.service';
import {v4 as uuidv4} from 'uuid';

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    constructor(
        private prisma: PrismaService,
        private merchantService: MerchantService,
    ) {
    }

    async getPointBalance(userId: string) {
        const pointBalance = await this.prisma.pointBalance.findUnique({
            where: {userId},
        });

        if (!pointBalance) {
            throw new NotFoundException('Point balance not found');
        }

        return pointBalance;
    }

    async getVirtualAccount(userId: string) {
        const virtualAccount = await this.prisma.virtualAccount.findUnique({
            where: {userId},
        });

        if (!virtualAccount) {
            throw new NotFoundException('Virtual account not found');
        }

        return virtualAccount;
    }

    async getTransactionHistory(userId: string, filter: TransactionFilterDto) {
        const {
            types,
            statuses,
            startDate,
            endDate,
            limit = 20,
            offset = 0,
        } = filter;

        const where: any = {userId};

        if (types && types.length > 0) {
            where.type = {in: types};
        }

        if (statuses && statuses.length > 0) {
            where.status = {in: statuses};
        }

        if (startDate) {
            where.createdAt = {gte: new Date(startDate)};
        }

        if (endDate) {
            where.createdAt = {
                ...where.createdAt,
                lte: new Date(endDate),
            };
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            skip: offset,
            take: limit,
        });

        const total = await this.prisma.transaction.count({where});

        return {
            transactions,
            pagination: {
                total,
                limit,
                offset,
            },
        };
    }

    async requestWithdrawal(userId: string, withdrawalDto: WithdrawalRequestDto) {
        const {amount, bankCode, accountNumber, accountHolder, description} = withdrawalDto;

        // Check if user has sufficient balance
        const pointBalance = await this.prisma.pointBalance.findUnique({
            where: {userId},
        });

        if (!pointBalance) {
            throw new NotFoundException('Point balance not found');
        }

        // Convert Decimal to number for comparison
        const balanceAmount = Number(pointBalance.balance);
        if (balanceAmount < amount) {
            throw new BadRequestException('Insufficient point balance');
        }

        // Generate a unique reference ID for this request
        const merchantOrderId = `WD-${uuidv4().split('-')[0]}`;

        try {
            // Step 1: Begin transaction for withdrawing points from user account
            const withdrawalTransaction = await this.prisma.$transaction(async (tx) => {
                // Create withdrawal request record
                const request = await tx.withdrawalRequest.create({
                    data: {
                        userId,
                        amount,
                        bankCode,
                        accountNumber,
                        accountHolder,
                    },
                });

                // Create transaction record
                const transaction = await tx.transaction.create({
                    data: {
                        userId,
                        type: TransactionType.WITHDRAWAL_REQUEST,
                        status: TransactionStatus.PENDING,
                        amount,
                        pointsChange: -amount, // Negative to indicate deduction
                        description: description || 'Point withdrawal request',
                        referenceId: merchantOrderId,
                    },
                });

                // Update withdrawal request with transaction ID
                await tx.withdrawalRequest.update({
                    where: {id: request.id},
                    data: {transactionId: transaction.id},
                });

                // Deduct points from balance
                await tx.pointBalance.update({
                    where: {userId},
                    data: {
                        balance: {
                            decrement: amount,
                        },
                    },
                });

                return transaction;
            });

            // Step 2: Call EZPG withdrawal API
            const withdrawalResult = await this.merchantService.processWithdrawal({
                moid: merchantOrderId,
                amount,
                bankCode,
                accountNumber,
                accountHolderName: accountHolder,
                transactionId: withdrawalTransaction.id,
            });

            // Step 3: Update transaction with EZPG response
            await this.prisma.transaction.update({
                where: {id: withdrawalTransaction.id},
                data: {
                    referenceId: withdrawalResult.natvTrNo,
                    status: TransactionStatus.PROCESSING,
                    metadata: withdrawalResult as any,
                },
            });

            return {
                transactionId: withdrawalTransaction.id,
                status: TransactionStatus.PROCESSING,
                message: 'Withdrawal request is being processed',
                ezpgReferenceId: withdrawalResult.natvTrNo,
            };
        } catch (error: any) {
            this.logger.error(`Error processing withdrawal request: ${error.message}`, error.stack);

            // If EZPG call failed, we still want to keep the transaction but mark it as failed
            if (error.name === 'EzpgApiError') {
                try {
                    // Update transaction status to failed
                    await this.prisma.transaction.update({
                        where: {id: merchantOrderId},
                        data: {
                            status: TransactionStatus.FAILED,
                            description: `${description || 'Withdrawal request'} - Failed: ${error.message}`,
                        },
                    });

                    // Revert the points deduction
                    await this.prisma.pointBalance.update({
                        where: {userId},
                        data: {
                            balance: {
                                increment: amount,
                            },
                        },
                    });
                } catch (updateError: any) {
                    this.logger.error(
                        `Failed to update transaction status after EZPG error: ${updateError.message}`,
                        updateError.stack,
                    );
                }
            }

            throw error;
        }
    }
}
