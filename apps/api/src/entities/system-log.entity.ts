import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
