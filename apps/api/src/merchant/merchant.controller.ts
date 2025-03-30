import {Body, Controller, Get, Param, Post, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {MerchantService} from './merchant.service';
import {JwtAuthGuard} from '@/auth/guards/jwt-auth.guard';
import {RolesGuard} from '@/auth/guards/roles.guard';
import {Roles} from '@/auth/decorators/roles.decorator';
import {Role} from '@prisma/client';
import {TransactionResponseDto, VirtualAccountDto, VirtualAccountResponseDto} from './dto/merchant.dto';
import {
    BadRequestResponseDto,
    ConflictResponseDto,
    ForbiddenResponseDto,
    NotFoundResponseDto,
    UnauthorizedResponseDto
} from '@/common';

@ApiTags('merchant')
@Controller('merchant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT, Role.ADMIN)
@ApiBearerAuth()
export class MerchantController {
    constructor(private readonly merchantService: MerchantService) {
    }

    @Post('virtual-accounts')
    @ApiOperation({summary: 'Register a virtual account for a user'})
    @ApiResponse({status: 201, description: 'Virtual account created successfully', type: VirtualAccountResponseDto})
    @ApiResponse({status: 400, description: 'Bad request', type: BadRequestResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 403, description: 'Forbidden - Not a merchant', type: ForbiddenResponseDto})
    @ApiResponse({status: 409, description: 'Conflict - Account already exists', type: ConflictResponseDto})
    async registerVirtualAccount(@Body() accountDto: VirtualAccountDto) {
        return this.merchantService.registerVirtualAccount(accountDto);
    }

    @Get('transactions/:moid')
    @ApiOperation({summary: 'Search for a transaction by merchant order ID'})
    @ApiResponse({status: 200, description: 'Returns transaction information', type: TransactionResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 403, description: 'Forbidden - Not a merchant', type: ForbiddenResponseDto})
    @ApiResponse({status: 404, description: 'Transaction not found', type: NotFoundResponseDto})
    async searchTransaction(@Param('moid') moid: string) {
        return this.merchantService.searchTransaction(moid);
    }
}
