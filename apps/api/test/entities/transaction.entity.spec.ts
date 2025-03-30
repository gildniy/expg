import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../../src/entities/transaction.entity';
import { User } from '../../src/entities/user.entity';
import { VirtualAccount } from '../../src/entities/virtual-account.entity';

describe('Transaction Entity', () => {
  it('should create a transaction instance', () => {
    const transaction = new Transaction();
    expect(transaction).toBeDefined();
  });

  it('should set and get properties correctly', () => {
    const transaction = new Transaction();
    transaction.id = '1';
    transaction.userId = '123';
    transaction.merchantId = 'merchant123';
    transaction.virtualAccountId = 'va123';
    transaction.amount = 100;
    transaction.fee = 10;
    transaction.transactionType = TransactionType.DEPOSIT;
    transaction.status = TransactionStatus.COMPLETED;
    transaction.moid = 'moid123';
    transaction.providerTransactionId = 'ptid123';
    transaction.bankTransactionId = 'btid123';
    transaction.providerResponseCode = '00';
    transaction.providerResponseMsg = 'Success';
    transaction.metadata = { key: 'value' };
    transaction.createdAt = new Date();
    transaction.updatedAt = new Date();

    expect(transaction.id).toBe('1');
    expect(transaction.userId).toBe('123');
    expect(transaction.merchantId).toBe('merchant123');
    expect(transaction.virtualAccountId).toBe('va123');
    expect(transaction.amount).toBe(100);
    expect(transaction.fee).toBe(10);
    expect(transaction.transactionType).toBe(TransactionType.DEPOSIT);
    expect(transaction.status).toBe(TransactionStatus.COMPLETED);
    expect(transaction.moid).toBe('moid123');
    expect(transaction.providerTransactionId).toBe('ptid123');
    expect(transaction.bankTransactionId).toBe('btid123');
    expect(transaction.providerResponseCode).toBe('00');
    expect(transaction.providerResponseMsg).toBe('Success');
    expect(transaction.metadata).toEqual({ key: 'value' });
    expect(transaction.createdAt).toBeInstanceOf(Date);
    expect(transaction.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle the user relationship correctly', () => {
    const transaction = new Transaction();
    const user = new User();
    user.id = 'user123';

    // Test the relationship setter and getter (line 32)
    transaction.user = user;
    expect(transaction.user).toBe(user);
    expect(transaction.user.id).toBe('user123');

    // Test with undefined
    const emptyTransaction = new Transaction();
    expect(emptyTransaction.user).toBeUndefined();
  });

  it('should handle the virtualAccount relationship correctly', () => {
    const transaction = new Transaction();
    const virtualAccount = new VirtualAccount();
    virtualAccount.id = 'va123';

    // Test the relationship setter and getter (line 41)
    transaction.virtualAccount = virtualAccount;
    expect(transaction.virtualAccount).toBe(virtualAccount);
    expect(transaction.virtualAccount.id).toBe('va123');

    // Test with undefined
    const emptyTransaction = new Transaction();
    expect(emptyTransaction.virtualAccount).toBeUndefined();
  });

  it('should handle all transaction types', () => {
    expect(TransactionType.DEPOSIT).toBe('deposit');
    expect(TransactionType.WITHDRAWAL).toBe('withdrawal');
    expect(TransactionType.TRANSFER).toBe('transfer');
    expect(TransactionType.FEE).toBe('fee');
  });

  it('should handle all transaction statuses', () => {
    expect(TransactionStatus.PENDING).toBe('pending');
    expect(TransactionStatus.COMPLETED).toBe('completed');
    expect(TransactionStatus.FAILED).toBe('failed');
    expect(TransactionStatus.PROCESSING).toBe('processing');
    expect(TransactionStatus.REFUNDED).toBe('refunded');
  });
});
