import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SupportTicketService } from '../services/support-ticket.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { TicketPriority, TicketStatus } from '../entities/support-ticket.entity';

@Controller('support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  async createTicket(
    @Request() req,
    @Body() data: { title: string; description: string; priority?: TicketPriority },
  ) {
    return await this.supportTicketService.createTicket({
      ...data,
      userId: req.user.id,
    });
  }

  @Get('my-tickets')
  @Roles(UserRole.CUSTOMER)
  async getMyTickets(@Request() req) {
    return await this.supportTicketService.getTicketsByUserId(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER)
  async getTicket(@Param('id') id: string) {
    return await this.supportTicketService.getTicket(id);
  }

  @Get('merchant/:merchantId')
  @Roles(UserRole.MERCHANT)
  async getMerchantTickets(@Param('merchantId') merchantId: string) {
    return await this.supportTicketService.getTicketsByMerchantId(merchantId);
  }

  @Post(':id/status')
  @Roles(UserRole.ADMIN)
  async updateTicketStatus(@Param('id') id: string, @Body() data: { status: TicketStatus }) {
    return await this.supportTicketService.updateTicketStatus(id, data.status);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  async assignTicket(@Param('id') id: string, @Body() data: { assignedToId: string }) {
    return await this.supportTicketService.assignTicket(id, data.assignedToId);
  }

  @Post(':id/comments')
  @Roles(UserRole.CUSTOMER)
  async addComment(@Request() req, @Param('id') id: string, @Body() data: { content: string }) {
    return await this.supportTicketService.addComment({
      ticketId: id,
      userId: req.user.id,
      content: data.content,
    });
  }

  @Get(':id/comments')
  @Roles(UserRole.CUSTOMER)
  async getTicketComments(@Param('id') id: string) {
    return await this.supportTicketService.getTicketComments(id);
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  async searchTickets(
    @Query()
    query: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedToId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return await this.supportTicketService.searchTickets(query);
  }
}
