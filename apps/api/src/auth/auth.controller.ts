import {Body, Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {
    AdminResponseDto,
    LoginDto,
    LoginResponseDto,
    MerchantResponseDto,
    RegisterDto,
    RegisterResponseDto,
    UserProfileDto
} from './dto/auth.dto';
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {RolesGuard} from './guards/roles.guard';
import {Roles} from './decorators/roles.decorator';
import {Role} from '@prisma/client';
import {
    ConflictResponseDto,
    ForbiddenResponseDto,
    UnauthorizedResponseDto
} from '@/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('register')
    @ApiOperation({summary: 'Register a new customer account'})
    @ApiResponse({status: 201, description: 'User registered successfully', type: RegisterResponseDto})
    @ApiResponse({status: 409, description: 'Email already in use', type: ConflictResponseDto})
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto, Role.CUSTOMER);
    }

    @Post('register/merchant')
    @ApiOperation({summary: 'Register a new merchant account'})
    @ApiResponse({status: 201, description: 'Merchant registered successfully', type: RegisterResponseDto})
    @ApiResponse({status: 409, description: 'Email already in use', type: ConflictResponseDto})
    registerMerchant(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto, Role.MERCHANT);
    }

    @Post('login')
    @ApiOperation({summary: 'Login to get JWT token'})
    @ApiResponse({status: 200, description: 'Login successful', type: LoginResponseDto})
    @ApiResponse({status: 401, description: 'Invalid credentials', type: UnauthorizedResponseDto})
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get current user profile'})
    @ApiResponse({status: 200, description: 'User profile retrieved successfully', type: UserProfileDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Admin only endpoint'})
    @ApiResponse({status: 200, description: 'Admin access successful', type: AdminResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 403, description: 'Forbidden - Not an admin', type: ForbiddenResponseDto})
    adminOnly() {
        return {message: 'Admin access successful'};
    }

    @Get('merchant')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.MERCHANT, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Merchant only endpoint'})
    @ApiResponse({status: 200, description: 'Merchant access successful', type: MerchantResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized', type: UnauthorizedResponseDto})
    @ApiResponse({status: 403, description: 'Forbidden - Not a merchant', type: ForbiddenResponseDto})
    merchantOnly() {
        return {message: 'Merchant access successful'};
    }
}
