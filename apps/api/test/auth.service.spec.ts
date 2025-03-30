import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountStatus, User, UserRole } from '../src/entities/user.entity';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../src/dto/auth.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository;
  let jwtService;

  // Create full User objects for testing
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    phone: null,
    role: UserRole.CUSTOMER,
    status: AccountStatus.ACTIVE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    virtualAccounts: [],
    transactions: [],
    points: [],
  };

  const mockAdmin: User = {
    id: '2',
    email: 'admin@example.com',
    password: 'hashedPassword',
    name: 'Admin User',
    phone: null,
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    virtualAccounts: [],
    transactions: [],
    points: [],
  };

  const mockSuperAdmin: User = {
    id: '3',
    email: 'superadmin@example.com',
    password: 'hashedPassword',
    name: 'Super Admin User',
    phone: null,
    role: UserRole.SUPER_ADMIN,
    status: AccountStatus.ACTIVE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    virtualAccounts: [],
    transactions: [],
    points: [],
  };

  const mockMerchant: User = {
    id: '4',
    email: 'merchant@example.com',
    password: 'hashedPassword',
    name: 'Merchant User',
    phone: null,
    role: UserRole.MERCHANT,
    status: AccountStatus.ACTIVE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    virtualAccounts: [],
    transactions: [],
    points: [],
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation(() => 'jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: UserRole.CUSTOMER,
      };

      const createdUser: User = {
        id: '5',
        email: registerDto.email,
        password: 'hashedPassword',
        name: registerDto.name,
        role: UserRole.CUSTOMER,
        phone: null,
        status: AccountStatus.ACTIVE,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        virtualAccounts: [],
        transactions: [],
        points: [],
      };

      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      // Expected result (user without password)
      const { password, ...expectedUser } = createdUser;

      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        name: registerDto.name,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('registerAdmin', () => {
    it('should register a new admin when called by a super admin', async () => {
      const registerAdminDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        name: 'New Admin',
        phone: '1234567890',
      };

      const createdAdmin: User = {
        id: '6',
        email: registerAdminDto.email,
        password: 'hashedPassword',
        name: registerAdminDto.name,
        phone: registerAdminDto.phone,
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        virtualAccounts: [],
        transactions: [],
        points: [],
      };

      userRepository.create.mockReturnValue(createdAdmin);
      userRepository.save.mockResolvedValue(createdAdmin);

      const result = await service.registerAdmin(mockSuperAdmin, registerAdminDto);

      // Expected result (user without password)
      const { password, ...expectedAdmin } = createdAdmin;

      expect(result).toEqual(expectedAdmin);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerAdminDto.email,
        password: 'hashedPassword',
        name: registerAdminDto.name,
        phone: registerAdminDto.phone,
        role: UserRole.ADMIN,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerAdminDto.password, 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-super admin tries to register an admin', async () => {
      const registerAdminDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        name: 'New Admin',
      };

      await expect(service.registerAdmin(mockAdmin, registerAdminDto)).rejects.toThrow(
        ForbiddenException,
      );

      // These expectations should be checked after the rejection
      // so we know bcrypt.hash wasn't called after the exception was thrown
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('registerMerchant', () => {
    it('should register a new merchant when called by an admin', async () => {
      const registerMerchantDto = {
        email: 'newmerchant@example.com',
        password: 'password123',
        name: 'New Merchant',
        phone: '1234567890',
        metadata: { businessType: 'Retail' },
      };

      const createdMerchant: User = {
        id: '7',
        email: registerMerchantDto.email,
        password: 'hashedPassword',
        name: registerMerchantDto.name,
        phone: registerMerchantDto.phone,
        role: UserRole.MERCHANT,
        status: AccountStatus.ACTIVE,
        metadata: registerMerchantDto.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        virtualAccounts: [],
        transactions: [],
        points: [],
      };

      userRepository.create.mockReturnValue(createdMerchant);
      userRepository.save.mockResolvedValue(createdMerchant);

      const result = await service.registerMerchant(mockAdmin, registerMerchantDto);

      // Expected result (user without password)
      const { password, ...expectedMerchant } = createdMerchant;

      expect(result).toEqual(expectedMerchant);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerMerchantDto.email,
        password: 'hashedPassword',
        name: registerMerchantDto.name,
        phone: registerMerchantDto.phone,
        role: UserRole.MERCHANT,
        metadata: registerMerchantDto.metadata,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerMerchantDto.password, 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should register a new merchant when called by a super admin', async () => {
      const registerMerchantDto = {
        email: 'newmerchant@example.com',
        password: 'password123',
        name: 'New Merchant',
      };

      const createdMerchant: User = {
        id: '7',
        email: registerMerchantDto.email,
        password: 'hashedPassword',
        name: registerMerchantDto.name,
        phone: null,
        role: UserRole.MERCHANT,
        status: AccountStatus.ACTIVE,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        virtualAccounts: [],
        transactions: [],
        points: [],
      };

      userRepository.create.mockReturnValue(createdMerchant);
      userRepository.save.mockResolvedValue(createdMerchant);

      const result = await service.registerMerchant(mockSuperAdmin, registerMerchantDto);

      // Expected result (user without password)
      const { password, ...expectedMerchant } = createdMerchant;

      expect(result).toEqual(expectedMerchant);
      expect(userRepository.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when customer tries to register a merchant', async () => {
      const registerMerchantDto = {
        email: 'newmerchant@example.com',
        password: 'password123',
        name: 'New Merchant',
      };

      await expect(service.registerMerchant(mockUser, registerMerchantDto)).rejects.toThrow(
        ForbiddenException,
      );

      // These expectations should be checked after the rejection
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      // For login, we only check the essential properties that are expected
      // in the response, not the full user object
      expect(result).toHaveProperty('accessToken', 'jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', mockUser.id);
      expect(result.user).toHaveProperty('email', mockUser.email);
      expect(result.user).toHaveProperty('name', mockUser.name);
      expect(result.user).toHaveProperty('role', mockUser.role);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: expect.arrayContaining([
          'id',
          'email',
          'password',
          'name',
          'phone',
          'role',
          'status',
          'createdAt',
          'updatedAt',
        ]),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashedPassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      // Since findOne returns null, we shouldn't call compare or sign
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashedPassword');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      // We verify that the important properties are present, not the exact object
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('name', mockUser.name);
      expect(result).toHaveProperty('role', mockUser.role);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should change the user password when current password is valid', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedOldPassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.changePassword(mockUser.id, changePasswordDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.arrayContaining([
          'id',
          'email',
          'password',
          'name',
          'phone',
          'role',
          'status',
          'createdAt',
          'updatedAt',
        ]),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        'hashedOldPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'hashedPassword',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent-id', changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );

      // Since findOne returns null, we shouldn't call compare or hash
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is invalid', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      };

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedOldPassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(mockUser.id, changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        'hashedOldPassword',
      );

      // Since compare returns false, we shouldn't call hash or update
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('excludePassword', () => {
    it('should exclude the password from the user object', () => {
      const userWithPassword = {
        ...mockUser,
      };

      // @ts-ignore - This is a hack to access the private method
      const result = service['excludePassword'](userWithPassword);

      expect(result).not.toHaveProperty('password');
      // Check that essential properties are present instead of exact object
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('name', mockUser.name);
      expect(result).toHaveProperty('role', mockUser.role);
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      };
      
      userRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.validateUser('test@example.com', 'valid-password');
      
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
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
      
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-password', 'hashed-password');
      expect(result).toBeDefined();
      expect(Object.prototype.hasOwnProperty.call(result, 'password')).toBeFalsy();
      expect(result.id).toBe('user-id');
      expect(result.email).toBe('test@example.com');
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      
      const result = await service.validateUser('nonexistent@example.com', 'any-password');
      
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
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
      
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      };
      
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(false));
      
      const result = await service.validateUser('test@example.com', 'invalid-password');
      
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
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
      
      expect(bcrypt.compare).toHaveBeenCalledWith('invalid-password', 'hashed-password');
      expect(result).toBeNull();
    });
  });
});
