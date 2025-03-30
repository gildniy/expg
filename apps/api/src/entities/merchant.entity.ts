import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  businessName: string;

  @Column({ unique: true })
  mid: string;

  @Column()
  meky: string;

  @Column({ nullable: true })
  orgC: string;

  @Column({ nullable: true })
  businessRegNumber: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
