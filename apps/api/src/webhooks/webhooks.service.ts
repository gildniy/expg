import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import {PrismaService} from '@/prisma/prisma.service';
import {EzpgDepositNotificationDto, EzpgWithdrawalNotificationDto} from './dto/webhook.dto';
import {Prisma, PrismaClient, TransactionStatus, TransactionType} from '@prisma/client';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(private prisma: PrismaService) {
    }

    async handleDepositNotification(notification: EzpgDepositNotificationDto): Promise<string> {
        this.logger.log(`Received deposit notification: ${JSON.stringify(notification)}`);

        // Validate the merchant ID
        if (notification.mid !== process.env.EZPG_MERCHANT_ID) {
            this.logger.error(`Invalid merchant ID: ${notification.mid}`);
            throw new BadRequestException('Invalid merchant ID');
        }

        // Find the virtual account
        const virtualAccount = await this.prisma.virtualAccount.findUnique({
            where: {accountNumber: notification.vacctNo},
            include: {user: true},
        });

        if (!virtualAccount) {
            this.logger.error(`Virtual account not found: ${notification.vacctNo}`);
            throw new BadRequestException('Virtual account not found');
        }

        const userId = virtualAccount.userId;
        const amount = parseInt(notification.amt, 10);

        // Check for duplicate transaction
        const existingTransactions = await (this.prisma as unknown as PrismaClient).transaction.findMany({
            where: {
                referenceId: notification.trNo,
                type: TransactionType.DEPOSIT,
            },
            take: 1
        });

        if (existingTransactions.length > 0) {
            this.logger.warn(`Duplicate deposit notification: ${notification.trNo}`);
            return '0000'; // Return success to avoid EZPG retrying
        }

        // Begin transaction to update points and create transaction record
        try {
            await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Create transaction record
                await tx.transaction.create({
                    data: {
                        userId,
                        type: TransactionType.DEPOSIT,
                        status: TransactionStatus.COMPLETED,
                        amount,
                        pointsChange: amount, // 1:1 conversion for simplicity
                        description: `Deposit from ${notification.depositNm || 'bank transfer'}`,
                        referenceId: notification.trNo,
                        metadata: notification as any,
                    },
                });

                // Update point balance
                await tx.pointBalance.update({
                    where: {userId},
                    data: {
                        balance: {
                            increment: amount,
                        },
                    },
                });
            });

            this.logger.log(`Successfully processed deposit for user ${userId}, amount: ${amount}`);
            return '0000'; // Success
        } catch (error: any) {
            this.logger.error(`Error processing deposit: ${error?.message || 'Unknown error'}`, error?.stack);
            throw error;
        }
    }

    async handleWithdrawalNotification(notification: EzpgWithdrawalNotificationDto): Promise<string> {
        this.logger.log(`Received withdrawal notification: ${JSON.stringify(notification)}`);

        // Validate the merchant ID
        if (notification.mid !== process.env.EZPG_MERCHANT_ID) {
            this.logger.error(`Invalid merchant ID: ${notification.mid}`);
            throw new BadRequestException('Invalid merchant ID');
        }

        // Find the original withdrawal transaction by referenceId
        const originalTransactions = await (this.prisma as unknown as PrismaClient).transaction.findMany({
            where: {
                referenceId: notification.natvTrNo,
                type: TransactionType.WITHDRAWAL_REQUEST,
            },
            include: {user: true},
            take: 1
        });

        const originalTransaction = originalTransactions[0];
        if (!originalTransaction) {
            this.logger.error(`Original withdrawal transaction not found: ${notification.natvTrNo}`);
            throw new BadRequestException('Original withdrawal transaction not found');
        }

        const userId = originalTransaction.userId;
        const isSuccess = notification.resultCd === '0000';
        const newStatus = isSuccess ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;

        // Check if this notification was already processed
        const completedType = isSuccess ? TransactionType.WITHDRAWAL_COMPLETED : TransactionType.WITHDRAWAL_FAILED;
        const existingNotificationTransactions = await (this.prisma as unknown as PrismaClient).transaction.findMany({
            where: {
                referenceId: notification.natvTrNo,
                type: completedType,
            },
            take: 1
        });

        if (existingNotificationTransactions.length > 0) {
            this.logger.warn(`Duplicate withdrawal notification: ${notification.natvTrNo}`);
            return '0000'; // Return success to avoid EZPG retrying
        }

        // Begin transaction to update transaction status and create notification record
        try {
            await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Update original transaction status
                await tx.transaction.update({
                    where: {id: originalTransaction.id},
                    data: {status: newStatus},
                });

                // Create a new transaction record for the completion/failure notification
                await tx.transaction.create({
                    data: {
                        userId,
                        type: completedType,
                        status: TransactionStatus.COMPLETED, // The notification processing is completed
                        amount: parseInt(notification.amt, 10),
                        pointsChange: 0, // Points were already deducted during the request phase
                        description: `Withdrawal ${isSuccess ? 'completed' : 'failed'}: ${notification.resultMsg}`,
                        referenceId: notification.natvTrNo,
                        metadata: notification as any,
                    },
                });

                // If withdrawal failed, revert the points deduction
                if (!isSuccess) {
                    // Convert Decimal to number and handle the sign change
                    const pointsChangeAmount = Number(originalTransaction.pointsChange);
                    const pointsToRevert = Math.abs(pointsChangeAmount); // Get absolute value of points change

                    await tx.pointBalance.update({
                        where: {userId},
                        data: {
                            balance: {
                                increment: pointsToRevert,
                            },
                        },
                    });

                    this.logger.log(`Reverted ${pointsToRevert} points for user ${userId} due to failed withdrawal`);
                }
            });

            this.logger.log(`Successfully processed withdrawal notification for user ${userId}, success: ${isSuccess}`);
            return '0000'; // Success
        } catch (error: any) {
            this.logger.error(`Error processing withdrawal notification: ${error?.message || 'Unknown error'}`, error?.stack);
            throw error;
        }
    }
}
