export enum VirtualAccountProvider {
    EZPG = 'EZPG',
    DAESUN = 'DAESUN',
  }
  
  export enum VirtualAccountStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    EXPIRED = 'EXPIRED',
  }
  
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
  
  export enum PointTransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    TRANSFER = 'TRANSFER',
  }
  
  export interface VirtualAccount {
    id: string;
    userId: string;
    merchantId: string;
    provider: VirtualAccountProvider;
    bankCd: string;
    accountNo: string;
    accountName: string;
    fixYn: string;
    depositAmt: number;
    currency: string;
    status: VirtualAccountStatus;
    providerTransactionId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Transaction {
    id: string;
    userId: string;
    merchantId: string;
    virtualAccountId?: string;
    amount: number;
    fee: number;
    transactionType: TransactionType;
    status: TransactionStatus;
    moid?: string;
    providerTransactionId?: string;
    bankTransactionId?: string;
    providerResponseCode?: string;
    providerResponseMsg?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Point {
    id: string;
    userId: string;
    type: PointTransactionType;
    amount: number;
    description: string;
    merchantId: string;
    createdAt: Date;
    updatedAt: Date;
  }