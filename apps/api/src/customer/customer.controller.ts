import {Body, Controller, Get, Post, Query, Req, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {CustomerService} from './customer.service';
import {JwtAuthGuard} from '@/auth/guards/jwt-auth.guard';
import {RolesGuard} from '@/auth/guards/roles.guard';
import {Roles} from '@/auth/decorators/roles.decorator';
import {Role} from '@prisma/client';
import {
    PointBalanceResponseDto,
    TransactionFilterDto,
    TransactionsResponseDto,
    VirtualAccountResponseDto,
    WithdrawalRequestDto,
    WithdrawalResponseDto
} from './dto/customer.dto';
import {
    BadRequestResponseDto,
    NotFoundResponseDto,
    UnauthorizedResponseDto
} from '@/common';

@ApiTags('customer')
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@ApiBearerAuth()
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {
    }

    @Get('points')
    @ApiOperation({summary: 'Get current point balance'})
    @ApiResponse({status: 200, description: 'Returns the current points balance', type: PointBalanceResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 404, description: 'Point balance not found', type: NotFoundResponseDto})
    async getPointBalance(@Req() req: any) {
        return this.customerService.getPointBalance(req.user.id);
    }

    @Get('virtual-account')
    @ApiOperation({summary: 'Get virtual account details'})
    @ApiResponse({status: 200, description: 'Returns the virtual account details', type: VirtualAccountResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 404, description: 'Virtual account not found', type: NotFoundResponseDto})
    async getVirtualAccount(@Req() req: any) {
        return this.customerService.getVirtualAccount(req.user.id);
    }

    @Get('transactions')
    @ApiOperation({summary: 'Get transaction history'})
    @ApiResponse({status: 200, description: 'Returns transaction history', type: TransactionsResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    async getTransactions(@Req() req: any, @Query() filter: TransactionFilterDto) {
        return this.customerService.getTransactionHistory(req.user.id, filter);
    }

    @Post('withdrawals/request')
    @ApiOperation({summary: 'Request withdrawal of points'})
    @ApiResponse({status: 201, description: 'Withdrawal request created successfully', type: WithdrawalResponseDto})
    @ApiResponse({status: 400, description: 'Bad request - insufficient balance or invalid amount', type: BadRequestResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    async requestWithdrawal(@Req() req: any, @Body() withdrawalDto: WithdrawalRequestDto) {
        return this.customerService.requestWithdrawal(req.user.id, withdrawalDto);
    }
}
