import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { VirtualAccount } from './virtual-account.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  FEE = 'fee',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSING = 'processing',
  REFUNDED = 'refunded',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column()
  userId: string;

  @Column()
  merchantId: string;

  @ManyToOne(() => VirtualAccount, (virtualAccount) => virtualAccount.transactions)
  virtualAccount: VirtualAccount;

  @Column({ nullable: true })
  virtualAccountId: string;

  @Column('decimal', { precision: 12, scale: 0 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 0, default: 0 })
  fee: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  moid: string;

  @Column({ nullable: true })
  providerTransactionId: string;

  @Column({ nullable: true })
  bankTransactionId: string;

  @Column({ nullable: true })
  providerResponseCode: string;

  @Column({ nullable: true })
  providerResponseMsg: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
