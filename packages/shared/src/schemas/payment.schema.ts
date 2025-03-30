import { z } from 'zod';
import {
  TransactionStatus,
  TransactionType,
  VirtualAccountProvider,
  VirtualAccountStatus,
  PointTransactionType,
} from '../types/payment';

export const virtualAccountSchema = z.object({
  provider: z.nativeEnum(VirtualAccountProvider),
  bankCd: z.string(),
  accountNo: z.string().optional(),
  accountName: z.string(),
  fixYn: z.string().default('Y'),
  depositAmt: z.number().min(0),
  currency: z.string().default('KRW'),
});

export const transactionSchema = z.object({
  virtualAccountId: z.string().uuid().optional(),
  amount: z.number().positive(),
  transactionType: z.nativeEnum(TransactionType),
  moid: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});