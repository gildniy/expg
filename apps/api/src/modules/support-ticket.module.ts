import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from '../entities/support-ticket.entity';
import { TicketComment } from '../entities/ticket-comment.entity';
import { SupportTicketService } from '../services/support-ticket.service';
import { SupportTicketController } from '../controllers/support-ticket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, TicketComment])],
  providers: [SupportTicketService],
  controllers: [SupportTicketController],
  exports: [SupportTicketService],
})
export class SupportTicketModule {}
