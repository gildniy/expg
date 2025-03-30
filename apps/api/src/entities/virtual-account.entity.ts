import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

export enum VirtualAccountProvider {
  EZPG = 'EZPG',
  DAESUN = 'DAESUN',
}

export enum VirtualAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

@Entity('virtual_accounts')
export class VirtualAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.virtualAccounts)
  user: User;

  @Column()
  userId: string;

  @Column()
  merchantId: string;

  @Column({
    type: 'enum',
    enum: VirtualAccountProvider,
    default: VirtualAccountProvider.EZPG,
  })
  provider: VirtualAccountProvider;

  @Column()
  bankCd: string;

  @Column()
  accountNo: string;

  @Column()
  accountName: string;

  @Column()
  fixYn: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmt: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: VirtualAccountStatus,
    default: VirtualAccountStatus.ACTIVE,
  })
  status: VirtualAccountStatus;

  @Column({ nullable: true })
  providerTransactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.virtualAccount)
  transactions: Transaction[];
}
