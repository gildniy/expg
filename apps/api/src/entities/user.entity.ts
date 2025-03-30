import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VirtualAccount } from './virtual-account.entity';
import { Transaction } from './transaction.entity';
import { Point } from './point.entity';

/**
 * Enum defining user roles in the system with different permission levels
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Enum defining possible account statuses
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Entity representing user accounts in the system
 * Stores authentication info, personal details, and role-based permissions
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  /**
   * JSON column to store additional user metadata
   * Particularly useful for merchant-specific information
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VirtualAccount, (virtualAccount) => virtualAccount.user)
  virtualAccounts: VirtualAccount[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Point, (point) => point.user)
  points: Point[];
}
