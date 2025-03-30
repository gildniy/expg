import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { SupportTicket } from './support-ticket.entity';

@Entity('ticket_comments')
export class TicketComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SupportTicket)
  ticket: SupportTicket;

  @Column()
  ticketId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
