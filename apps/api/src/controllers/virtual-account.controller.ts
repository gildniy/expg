import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { VirtualAccountService } from '../services/virtual-account.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VirtualAccount } from '../entities/virtual-account.entity';
import { UpdateVirtualAccountStatusDto, VirtualAccountQueryDto } from '../dto/virtual-account.dto';

/**
 * Controller responsible for managing virtual account endpoints
 * Handles creation, retrieval, and status updates of virtual accounts
 * Uses role-based access control for endpoint security
 */
@ApiTags('Virtual Accounts')
@Controller('virtual-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VirtualAccountController {
  constructor(private readonly virtualAccountService: VirtualAccountService) {}

  /**
   * Creates a new virtual account for the authenticated user
   * Available only to users with CUSTOMER role
   *
   * @param req - The request object containing the authenticated user information
   * @param data - Object containing merchant ID and virtual account configuration
   * @returns The created virtual account entity
   */
  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new virtual account' })
  @ApiResponse({ status: 201, description: 'Virtual account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createVirtualAccount(
    @Request() req,
    @Body() data: { merchantId: string; fixYn: 'Y' | 'N'; depositAmt?: number },
  ) {
    return await this.virtualAccountService.createVirtualAccount(req.user, data.merchantId, {
      fixYn: data.fixYn,
      depositAmt: data.depositAmt,
    });
  }

  /**
   * Retrieves all virtual accounts belonging to the authenticated user
   * Available only to users with CUSTOMER role
   *
   * @param req - The request object containing the authenticated user information
   * @returns Array of virtual accounts associated with the user
   */
  @Get('my-accounts')
  @Roles(UserRole.CUSTOMER)
  async getMyVirtualAccounts(@Request() req) {
    return await this.virtualAccountService.getVirtualAccountsByUserId(req.user.id);
  }

  /**
   * Retrieves a specific virtual account by its ID
   * Available to users with CUSTOMER or MERCHANT roles
   *
   * @param id - The ID of the virtual account to retrieve
   * @returns The requested virtual account entity
   */
  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get virtual account by ID' })
  @ApiResponse({ status: 200, description: 'Virtual account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Virtual account not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getVirtualAccount(@Param('id') id: string) {
    return await this.virtualAccountService.getVirtualAccount(id);
  }

  /**
   * Retrieves all virtual accounts associated with a specific merchant
   * Available only to users with MERCHANT role
   *
   * @param merchantId - The ID of the merchant to retrieve virtual accounts for
   * @returns Array of virtual accounts for the specified merchant
   */
  @Get('merchant/:merchantId')
  @Roles(UserRole.MERCHANT)
  async getMerchantVirtualAccounts(@Param('merchantId') merchantId: string) {
    return await this.virtualAccountService.getVirtualAccountsByMerchantId(merchantId);
  }

  /**
   * Deactivates a virtual account
   * Available only to users with CUSTOMER role
   *
   * @param id - The ID of the virtual account to deactivate
   * @returns The updated virtual account entity
   */
  @Post(':id/deactivate')
  @Roles(UserRole.CUSTOMER)
  async deactivateVirtualAccount(@Param('id') id: string) {
    return await this.virtualAccountService.deactivateVirtualAccount(id);
  }

  /**
   * Activates a virtual account
   * Available only to users with CUSTOMER role
   *
   * @param id - The ID of the virtual account to activate
   * @returns The updated virtual account entity
   */
  @Post(':id/activate')
  @Roles(UserRole.CUSTOMER)
  async activateVirtualAccount(@Param('id') id: string) {
    return await this.virtualAccountService.activateVirtualAccount(id);
  }

  /**
   * Retrieves all virtual accounts based on query parameters
   * Available to users with CUSTOMER or MERCHANT roles
   *
   * @param query - Object containing filter criteria for virtual accounts
   * @returns Array of virtual accounts matching the criteria
   */
  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get all virtual accounts with optional filters' })
  @ApiResponse({ status: 200, description: 'Virtual accounts retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getVirtualAccounts(@Query() query: VirtualAccountQueryDto): Promise<VirtualAccount[]> {
    return await this.virtualAccountService.getVirtualAccounts(query);
  }

  /**
   * Updates the status of a virtual account
   * Available only to users with MERCHANT role
   *
   * @param id - The ID of the virtual account to update
   * @param updateVirtualAccountStatusDto - DTO containing the new status
   * @returns The updated virtual account entity
   */
  @Post(':id/status')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update virtual account status' })
  @ApiResponse({ status: 200, description: 'Virtual account status updated successfully' })
  @ApiResponse({ status: 404, description: 'Virtual account not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateVirtualAccountStatus(
    @Param('id') id: string,
    @Body() updateVirtualAccountStatusDto: UpdateVirtualAccountStatusDto,
  ): Promise<VirtualAccount> {
    return await this.virtualAccountService.updateVirtualAccountStatus(
      id,
      updateVirtualAccountStatusDto.status,
    );
  }
}
