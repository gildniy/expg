import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterAdminDto,
  RegisterDto,
  RegisterMerchantDto,
} from '../dto/auth.dto';
import * as bcrypt from 'bcrypt';

/**
 * Service responsible for handling authentication related operations
 * including user registration, login, profile management, and password changes.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user in the system
   *
   * @param registerDto - Data transfer object containing user registration information
   * @returns A user object with the password field excluded
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, name } = registerDto;
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    const savedUser = await this.userRepository.save(user);
    return this.excludePassword(savedUser);
  }

  /**
   * Registers a new admin user in the system (Super Admin only)
   *
   * @param currentUser - The user performing the registration (must be SUPER_ADMIN)
   * @param registerAdminDto - Data transfer object containing admin registration information
   * @returns A user object with the password field excluded
   * @throws ForbiddenException if the current user is not a super admin
   */
  async registerAdmin(
    currentUser: User,
    registerAdminDto: RegisterAdminDto,
  ): Promise<Omit<User, 'password'>> {
    // Verify the user is a super admin
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can register new admins');
    }

    const { email, name, phone } = registerAdminDto;
    const hashedPassword = await bcrypt.hash(registerAdminDto.password, 10);

    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: UserRole.ADMIN,
    });

    const savedAdmin = await this.userRepository.save(admin);
    return this.excludePassword(savedAdmin);
  }

  /**
   * Registers a new merchant user in the system (Admin or Super Admin only)
   *
   * @param currentUser - The user performing the registration (must be ADMIN or SUPER_ADMIN)
   * @param registerMerchantDto - Data transfer object containing merchant registration information
   * @returns A user object with the password field excluded
   * @throws ForbiddenException if the current user is not an admin or super admin
   */
  async registerMerchant(
    currentUser: User,
    registerMerchantDto: RegisterMerchantDto,
  ): Promise<Omit<User, 'password'>> {
    // Verify the user is an admin or super admin
    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins and super admins can register merchants');
    }

    const { email, name, phone, metadata } = registerMerchantDto;
    const hashedPassword = await bcrypt.hash(registerMerchantDto.password, 10);

    const merchant = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: UserRole.MERCHANT,
      metadata,
    });

    const savedMerchant = await this.userRepository.save(merchant);
    return this.excludePassword(savedMerchant);
  }

  /**
   * Authenticates a user and generates an access token
   *
   * @param loginDto - Data transfer object containing user login credentials
   * @returns An object containing the JWT access token and user information
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { email } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'name',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: this.excludePassword(user) };
  }

  /**
   * Retrieves a user's profile by their ID
   *
   * @param userId - The ID of the user to retrieve
   * @returns User information with the password field excluded
   * @throws UnauthorizedException if the user is not found
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.excludePassword(user);
  }

  /**
   * Changes a user's password after verifying their current password
   *
   * @param userId - The ID of the user changing their password
   * @param changePasswordDto - DTO containing current and new password
   * @throws UnauthorizedException if the user is not found or current password is invalid
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'password',
        'name',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  /**
   * Utility method to exclude the password field from a user object
   *
   * @param user - The user object including the password
   * @returns A user object with the password field excluded
   */
  private excludePassword(user: User): Omit<User, 'password'> {
    const userWithoutPassword = { ...user };
    delete (userWithoutPassword as any).password;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}
