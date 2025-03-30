import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { RegisterAdminDto, RegisterMerchantDto } from '../../dto/auth.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Controller handling admin user management operations
 * Provides endpoints for registering admins and merchants
 */
@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new admin user (Super Admin only)
   *
   * @param req - Request object containing the authenticated user
   * @param registerAdminDto - DTO with admin registration information
   * @returns The newly created admin user without password
   */
  @Post('register-admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new admin (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Super Admin role' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerAdmin(@Request() req, @Body() registerAdminDto: RegisterAdminDto) {
    return await this.authService.registerAdmin(req.user, registerAdminDto);
  }

  /**
   * Registers a new merchant user (Admin or Super Admin)
   *
   * @param req - Request object containing the authenticated user
   * @param registerMerchantDto - DTO with merchant registration information
   * @returns The newly created merchant user without password
   */
  @Post('register-merchant')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new merchant (Admin or Super Admin)' })
  @ApiResponse({ status: 201, description: 'Merchant successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Admin or Super Admin role' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerMerchant(@Request() req, @Body() registerMerchantDto: RegisterMerchantDto) {
    return await this.authService.registerMerchant(req.user, registerMerchantDto);
  }
}
