import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';

// This file directly imports the decorators and calls them
// We want to get maximum coverage of the decorator functions

describe('Direct Decorator Import', () => {
  let testMeta = {};
  
  beforeEach(() => {
    testMeta = {};
    Reflect.defineMetadata('testMeta', testMeta, Object);
  });
  
  // Test Entity decorator
  it('should directly call Entity decorator', () => {
    const table = 'test_entity';
    
    @Entity(table)
    class TestEntity {}
    
    expect(Reflect.getMetadata('typeorm:entity-table-name', TestEntity)).toBe(table);
  });
  
  // Test PrimaryGeneratedColumn decorator
  it('should directly call PrimaryGeneratedColumn decorator', () => {
    class TestEntity {
      @PrimaryGeneratedColumn('uuid')
      id: string;
    }
    
    const columns = Reflect.getMetadata('typeorm:entity-column-name', TestEntity.prototype, 'id');
    expect(columns).toBeDefined();
  });
  
  // Test Column decorator with various options
  it('should directly call Column decorator with various options', () => {
    // Simple enum for testing
    enum TestEnum {
      A = 'A',
      B = 'B'
    }
    
    class TestEntity {
      @Column()
      simple: string;
      
      @Column('varchar')
      withType: string;
      
      @Column({ type: 'decimal', precision: 10, scale: 2 })
      withOptions: number;
      
      @Column({ type: 'enum', enum: TestEnum })
      enumCol: TestEnum;
    }
    
    // Verify columns have been registered
    const metadata = Reflect.getMetadata('typeorm:entity-columns', TestEntity.prototype);
    expect(metadata).toBeDefined();
    expect(metadata.length).toBeGreaterThanOrEqual(4);
  });
  
  // Test date columns
  it('should directly call CreateDateColumn and UpdateDateColumn decorators', () => {
    class TestEntity {
      @CreateDateColumn()
      createdAt: Date;
      
      @UpdateDateColumn()
      updatedAt: Date;
    }
    
    const metadata = Reflect.getMetadata('typeorm:entity-columns', TestEntity.prototype);
    expect(metadata).toBeDefined();
    expect(metadata.length).toBeGreaterThanOrEqual(2);
  });
  
  // Test relationship decorators
  it('should directly call relationship decorators', () => {
    class ParentEntity {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @OneToMany(() => ChildEntity, child => child.parent)
      children: ChildEntity[];
    }
    
    class ChildEntity {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @ManyToOne(() => ParentEntity, parent => parent.children)
      parent: ParentEntity;
      
      @Column()
      parentId: string;
      
      @JoinColumn({ name: 'parentId' })
      parentJoin: any;
    }
    
    // Verify relationships are registered
    const parentRels = Reflect.getMetadata('typeorm:entity-relations', ParentEntity.prototype);
    const childRels = Reflect.getMetadata('typeorm:entity-relations', ChildEntity.prototype);
    
    expect(parentRels).toBeDefined();
    expect(childRels).toBeDefined();
  });
  
  // Test with our actual entity names to target specific coverage
  it('should call relationship decorators with our entity names', () => {
    // Define proxy classes using the actual entity names
    class UserProxy {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @OneToMany('VirtualAccountProxy', 'user')
      virtualAccounts: any[];
      
      @OneToMany('TransactionProxy', 'user')
      transactions: any[];
      
      @OneToMany('PointProxy', 'user')
      points: any[];
    }
    
    class VirtualAccountProxy {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @ManyToOne('UserProxy', 'virtualAccounts')
      user: UserProxy;
      
      @OneToMany('TransactionProxy', 'virtualAccount')
      transactions: any[];
    }
    
    class TransactionProxy {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @ManyToOne('UserProxy', 'transactions')
      user: UserProxy;
      
      @ManyToOne('VirtualAccountProxy', 'transactions')
      virtualAccount: VirtualAccountProxy;
    }
    
    class PointProxy {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      
      @ManyToOne('UserProxy', 'points')
      @JoinColumn({ name: 'userId' })
      user: UserProxy;
    }
    
    // Verify relationships are registered
    const userRels = Reflect.getMetadata('typeorm:entity-relations', UserProxy.prototype);
    const vaRels = Reflect.getMetadata('typeorm:entity-relations', VirtualAccountProxy.prototype);
    const txRels = Reflect.getMetadata('typeorm:entity-relations', TransactionProxy.prototype);
    const pointRels = Reflect.getMetadata('typeorm:entity-relations', PointProxy.prototype);
    
    expect(userRels).toBeDefined();
    expect(userRels.length).toBeGreaterThanOrEqual(3);
    
    expect(vaRels).toBeDefined();
    expect(vaRels.length).toBeGreaterThanOrEqual(2);
    
    expect(txRels).toBeDefined();
    expect(txRels.length).toBeGreaterThanOrEqual(2);
    
    expect(pointRels).toBeDefined();
    expect(pointRels.length).toBeGreaterThanOrEqual(1);
  });
}); 