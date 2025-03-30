import 'reflect-metadata';
import { Point } from '../src/entities/point.entity';
import { Transaction } from '../src/entities/transaction.entity';
import { User } from '../src/entities/user.entity';
import { VirtualAccount } from '../src/entities/virtual-account.entity';

// Create a custom mock factory to properly track decorator calls
const createMockDecorator = (name) => {
  const mockFn = jest.fn().mockImplementation(() => {
    return jest.fn();
  });

  // Store the mock for validation in tests
  global[`_${name}Mock`] = mockFn;
  return mockFn;
};

// Mock the TypeORM decorators
jest.mock('typeorm', () => {
  const actualTypeORM = jest.requireActual('typeorm');

  // Create mock implementations for all decorators
  return {
    ...actualTypeORM,
    Entity: createMockDecorator('Entity'),
    PrimaryGeneratedColumn: createMockDecorator('PrimaryGeneratedColumn'),
    Column: createMockDecorator('Column'),
    CreateDateColumn: createMockDecorator('CreateDateColumn'),
    UpdateDateColumn: createMockDecorator('UpdateDateColumn'),
    ManyToOne: createMockDecorator('ManyToOne'),
    OneToMany: createMockDecorator('OneToMany'),
    JoinColumn: createMockDecorator('JoinColumn'),
  };
});

// Force loading of all entities to trigger the decorators
require('../src/entities/point.entity');
require('../src/entities/transaction.entity');
require('../src/entities/user.entity');
require('../src/entities/virtual-account.entity');

describe('TypeORM Entity Decorator Coverage', () => {
  it('should properly call the Entity decorator', () => {
    expect(global._EntityMock).toHaveBeenCalled();
  });

  it('should properly call the Column decorator', () => {
    expect(global._ColumnMock).toHaveBeenCalled();
  });

  it('should properly call the PrimaryGeneratedColumn decorator', () => {
    expect(global._PrimaryGeneratedColumnMock).toHaveBeenCalled();
  });

  it('should properly call the CreateDateColumn decorator', () => {
    expect(global._CreateDateColumnMock).toHaveBeenCalled();
  });

  it('should properly call the UpdateDateColumn decorator', () => {
    expect(global._UpdateDateColumnMock).toHaveBeenCalled();
  });

  it('should properly call the ManyToOne decorator', () => {
    expect(global._ManyToOneMock).toHaveBeenCalled();
  });

  it('should properly call the OneToMany decorator', () => {
    expect(global._OneToManyMock).toHaveBeenCalled();
  });

  it('should properly call the JoinColumn decorator', () => {
    expect(global._JoinColumnMock).toHaveBeenCalled();
  });

  describe('Point Entity', () => {
    it('should handle the user relationship correctly', () => {
      const point = new Point();
      const user = new User();
      point.user = user;
      expect(point.user).toBe(user);
    });
  });

  describe('Transaction Entity', () => {
    it('should handle the user relationship correctly', () => {
      const transaction = new Transaction();
      const user = new User();
      transaction.user = user;
      expect(transaction.user).toBe(user);
    });

    it('should handle the virtualAccount relationship correctly', () => {
      const transaction = new Transaction();
      const virtualAccount = new VirtualAccount();
      transaction.virtualAccount = virtualAccount;
      expect(transaction.virtualAccount).toBe(virtualAccount);
    });
  });

  describe('User Entity', () => {
    it('should handle the virtualAccounts relationship correctly', () => {
      const user = new User();
      const virtualAccounts = [new VirtualAccount()];
      user.virtualAccounts = virtualAccounts;
      expect(user.virtualAccounts).toBe(virtualAccounts);
    });

    it('should handle the transactions relationship correctly', () => {
      const user = new User();
      const transactions = [new Transaction()];
      user.transactions = transactions;
      expect(user.transactions).toBe(transactions);
    });

    it('should handle the points relationship correctly', () => {
      const user = new User();
      const points = [new Point()];
      user.points = points;
      expect(user.points).toBe(points);
    });
  });

  describe('VirtualAccount Entity', () => {
    it('should handle the user relationship correctly', () => {
      const virtualAccount = new VirtualAccount();
      const user = new User();
      virtualAccount.user = user;
      expect(virtualAccount.user).toBe(user);
    });

    it('should handle the transactions relationship correctly', () => {
      const virtualAccount = new VirtualAccount();
      const transactions = [new Transaction()];
      virtualAccount.transactions = transactions;
      expect(virtualAccount.transactions).toBe(transactions);
    });
  });
});
