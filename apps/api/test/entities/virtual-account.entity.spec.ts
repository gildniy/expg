import {
  VirtualAccount,
  VirtualAccountProvider,
  VirtualAccountStatus,
} from '../../src/entities/virtual-account.entity';
import { User } from '../../src/entities/user.entity';
import { Transaction } from '../../src/entities/transaction.entity';

describe('VirtualAccount Entity', () => {
  it('should create a virtual account instance', () => {
    const virtualAccount = new VirtualAccount();
    expect(virtualAccount).toBeDefined();
  });

  it('should set and get properties correctly', () => {
    const virtualAccount = new VirtualAccount();
    virtualAccount.id = '1';
    virtualAccount.userId = '123';
    virtualAccount.merchantId = 'merchant123';
    virtualAccount.provider = VirtualAccountProvider.EZPG;
    virtualAccount.bankCd = 'bank123';
    virtualAccount.accountNo = '1234567890';
    virtualAccount.accountName = 'Test Account';
    virtualAccount.fixYn = 'Y';
    virtualAccount.depositAmt = 100;
    virtualAccount.currency = 'USD';
    virtualAccount.status = VirtualAccountStatus.ACTIVE;
    virtualAccount.providerTransactionId = 'ptid123';
    virtualAccount.createdAt = new Date();
    virtualAccount.updatedAt = new Date();

    expect(virtualAccount.id).toBe('1');
    expect(virtualAccount.userId).toBe('123');
    expect(virtualAccount.merchantId).toBe('merchant123');
    expect(virtualAccount.provider).toBe(VirtualAccountProvider.EZPG);
    expect(virtualAccount.bankCd).toBe('bank123');
    expect(virtualAccount.accountNo).toBe('1234567890');
    expect(virtualAccount.accountName).toBe('Test Account');
    expect(virtualAccount.fixYn).toBe('Y');
    expect(virtualAccount.depositAmt).toBe(100);
    expect(virtualAccount.currency).toBe('USD');
    expect(virtualAccount.status).toBe(VirtualAccountStatus.ACTIVE);
    expect(virtualAccount.providerTransactionId).toBe('ptid123');
    expect(virtualAccount.createdAt).toBeInstanceOf(Date);
    expect(virtualAccount.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle the user relationship correctly', () => {
    const virtualAccount = new VirtualAccount();
    const user = new User();
    user.id = 'user123';

    // Test the relationship setter and getter (line 29)
    virtualAccount.user = user;
    expect(virtualAccount.user).toBe(user);
    expect(virtualAccount.user.id).toBe('user123');

    // Test with undefined
    const emptyVirtualAccount = new VirtualAccount();
    expect(emptyVirtualAccount.user).toBeUndefined();
  });

  it('should handle the transactions relationship correctly', () => {
    const virtualAccount = new VirtualAccount();
    const transaction1 = new Transaction();
    const transaction2 = new Transaction();
    transaction1.id = 'tx1';
    transaction2.id = 'tx2';

    // Test the relationship setter and getter (line 79)
    virtualAccount.transactions = [transaction1, transaction2];
    expect(virtualAccount.transactions).toHaveLength(2);
    expect(virtualAccount.transactions[0].id).toBe('tx1');
    expect(virtualAccount.transactions[1].id).toBe('tx2');

    // Test with undefined
    const emptyVirtualAccount = new VirtualAccount();
    expect(emptyVirtualAccount.transactions).toBeUndefined();
  });

  it('should handle all virtual account providers', () => {
    expect(VirtualAccountProvider.EZPG).toBe('EZPG');
    expect(VirtualAccountProvider.DAESUN).toBe('DAESUN');
  });

  it('should handle all virtual account statuses', () => {
    expect(VirtualAccountStatus.ACTIVE).toBe('ACTIVE');
    expect(VirtualAccountStatus.INACTIVE).toBe('INACTIVE');
    expect(VirtualAccountStatus.EXPIRED).toBe('EXPIRED');
  });
});
