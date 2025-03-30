import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketPriority, TicketStatus } from '../entities/support-ticket.entity';
import { TicketComment } from '../entities/ticket-comment.entity';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(TicketComment)
    private commentRepository: Repository<TicketComment>,
  ) {}

  async createTicket(data: {
    userId?: string;
    merchantId?: string;
    title: string;
    description: string;
    priority?: TicketPriority;
  }) {
    const ticket = this.ticketRepository.create({
      ...data,
      priority: data.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
    });

    return await this.ticketRepository.save(ticket);
  }

  async getTicket(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new HttpException('Ticket not found', HttpStatus.NOT_FOUND);
    }

    return ticket;
  }

  async getTicketsByUserId(userId: string) {
    return await this.ticketRepository.find({
      where: { userId },
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTicketsByMerchantId(merchantId: string) {
    return await this.ticketRepository.find({
      where: { merchantId },
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.getTicket(id);
    ticket.status = status;

    if (status === TicketStatus.RESOLVED) {
      ticket.resolvedAt = new Date();
    }

    return await this.ticketRepository.save(ticket);
  }

  async assignTicket(id: string, assignedToId: string) {
    const ticket = await this.getTicket(id);
    ticket.assignedToId = assignedToId;
    ticket.status = TicketStatus.IN_PROGRESS;
    return await this.ticketRepository.save(ticket);
  }

  async addComment(data: { ticketId: string; userId: string; content: string }) {
    const ticket = await this.getTicket(data.ticketId);

    const comment = this.commentRepository.create({
      ...data,
      ticket,
    });

    return await this.commentRepository.save(comment);
  }

  async getTicketComments(ticketId: string) {
    return await this.commentRepository.find({
      where: { ticketId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async searchTickets(query: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo');

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }

    if (query.assignedToId) {
      qb.andWhere('ticket.assignedToId = :assignedToId', { assignedToId: query.assignedToId });
    }

    if (query.startDate) {
      qb.andWhere('ticket.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('ticket.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('ticket.createdAt', 'DESC');

    return await qb.getMany();
  }
}
