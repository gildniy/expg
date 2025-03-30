import { Point, PointTransactionType } from '../../src/entities/point.entity';
import { User } from '../../src/entities/user.entity';

describe('Point Entity', () => {
  it('should create a point instance', () => {
    const point = new Point();
    expect(point).toBeDefined();
  });

  it('should set and get properties correctly', () => {
    const point = new Point();
    point.id = '1';
    point.userId = '123';
    point.type = PointTransactionType.DEPOSIT;
    point.amount = 100;
    point.description = 'Test deposit';
    point.merchantId = 'merchant123';
    point.createdAt = new Date();
    point.updatedAt = new Date();

    expect(point.id).toBe('1');
    expect(point.userId).toBe('123');
    expect(point.type).toBe(PointTransactionType.DEPOSIT);
    expect(point.amount).toBe(100);
    expect(point.description).toBe('Test deposit');
    expect(point.merchantId).toBe('merchant123');
    expect(point.createdAt).toBeInstanceOf(Date);
    expect(point.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle the user relationship correctly', () => {
    const point = new Point();
    const user = new User();
    user.id = 'user123';

    // Test the relationship setter and getter (line 26)
    point.user = user;
    expect(point.user).toBe(user);
    expect(point.user.id).toBe('user123');

    // Test with undefined
    const emptyPoint = new Point();
    expect(emptyPoint.user).toBeUndefined();
  });

  it('should handle all point transaction types', () => {
    expect(PointTransactionType.DEPOSIT).toBe('DEPOSIT');
    expect(PointTransactionType.WITHDRAWAL).toBe('WITHDRAWAL');
    expect(PointTransactionType.TRANSFER).toBe('TRANSFER');
  });
});
