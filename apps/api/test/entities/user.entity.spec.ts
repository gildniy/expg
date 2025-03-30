import { AccountStatus, User, UserRole } from '../../src/entities/user.entity';
import { VirtualAccount } from '../../src/entities/virtual-account.entity';
import { Transaction } from '../../src/entities/transaction.entity';
import { Point } from '../../src/entities/point.entity';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const user = new User();
    expect(user).toBeDefined();
  });

  it('should set and get properties correctly', () => {
    const user = new User();
    user.id = '1';
    user.email = 'test@example.com';
    user.password = 'hashedpassword';
    user.name = 'Test User';
    user.phone = '1234567890';
    user.role = UserRole.CUSTOMER;
    user.status = AccountStatus.ACTIVE;
    user.metadata = { key: 'value' };
    user.createdAt = new Date();
    user.updatedAt = new Date();

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('hashedpassword');
    expect(user.name).toBe('Test User');
    expect(user.phone).toBe('1234567890');
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.status).toBe(AccountStatus.ACTIVE);
    expect(user.metadata).toEqual({ key: 'value' });
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle the virtualAccounts relationship correctly', () => {
    const user = new User();
    const virtualAccount1 = new VirtualAccount();
    const virtualAccount2 = new VirtualAccount();
    virtualAccount1.id = 'va1';
    virtualAccount2.id = 'va2';

    // Test the relationship setter and getter (line 80)
    user.virtualAccounts = [virtualAccount1, virtualAccount2];
    expect(user.virtualAccounts).toHaveLength(2);
    expect(user.virtualAccounts[0].id).toBe('va1');
    expect(user.virtualAccounts[1].id).toBe('va2');

    // Test with undefined
    const emptyUser = new User();
    expect(emptyUser.virtualAccounts).toBeUndefined();
  });

  it('should handle the transactions relationship correctly', () => {
    const user = new User();
    const transaction1 = new Transaction();
    const transaction2 = new Transaction();
    transaction1.id = 'tx1';
    transaction2.id = 'tx2';

    // Test the relationship setter and getter (line 83)
    user.transactions = [transaction1, transaction2];
    expect(user.transactions).toHaveLength(2);
    expect(user.transactions[0].id).toBe('tx1');
    expect(user.transactions[1].id).toBe('tx2');

    // Test with undefined
    const emptyUser = new User();
    expect(emptyUser.transactions).toBeUndefined();
  });

  it('should handle the points relationship correctly', () => {
    const user = new User();
    const point1 = new Point();
    const point2 = new Point();
    point1.id = 'p1';
    point2.id = 'p2';

    // Test the relationship setter and getter (line 86)
    user.points = [point1, point2];
    expect(user.points).toHaveLength(2);
    expect(user.points[0].id).toBe('p1');
    expect(user.points[1].id).toBe('p2');

    // Test with undefined
    const emptyUser = new User();
    expect(emptyUser.points).toBeUndefined();
  });

  it('should handle all user roles', () => {
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');
    expect(UserRole.MERCHANT).toBe('MERCHANT');
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });

  it('should handle all account statuses', () => {
    expect(AccountStatus.ACTIVE).toBe('ACTIVE');
    expect(AccountStatus.INACTIVE).toBe('INACTIVE');
    expect(AccountStatus.SUSPENDED).toBe('SUSPENDED');
  });
});
