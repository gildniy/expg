import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from '../src/auth/strategies/local.strategy';
import { AuthService } from '../src/services/auth.service';
import { PrismaService } from '../src/services/prisma.service';
import { UserRole, AccountStatus } from '../src/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    describe('with TypeORM (USE_PRISMA=false)', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockReturnValue('false');
      });

      it('should return user data when credentials are valid', async () => {
        const mockUser = {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.CUSTOMER,
          phone: null,
          status: AccountStatus.ACTIVE,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          virtualAccounts: [],
          transactions: [],
          points: []
        };

        jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

        const result = await strategy.validate('test@example.com', 'valid-password');

        expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'valid-password');
        expect(result).toEqual(mockUser);
      });

      it('should throw UnauthorizedException when credentials are invalid', async () => {
        jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

        await expect(strategy.validate('test@example.com', 'invalid-password')).rejects.toThrow(
          UnauthorizedException,
        );

        expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'invalid-password');
      });
    });

    describe('with Prisma (USE_PRISMA=true)', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockReturnValue('true');
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      });

      it('should return user data when credentials are valid', async () => {
        const mockUser = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          role: UserRole.CUSTOMER,
          status: AccountStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

        const result = await strategy.validate('test@example.com', 'valid-password');

        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        expect(bcrypt.compare).toHaveBeenCalledWith('valid-password', 'hashed-password');
        expect(result).toHaveProperty('id', 'user-id');
        expect(result).toHaveProperty('email', 'test@example.com');
        expect(result).not.toHaveProperty('password');
      });

      it('should throw UnauthorizedException when user is not found', async () => {
        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

        await expect(strategy.validate('nonexistent@example.com', 'any-password')).rejects.toThrow(
          UnauthorizedException,
        );

        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'nonexistent@example.com' },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });

      it('should throw UnauthorizedException when password is invalid', async () => {
        const mockUser = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          role: UserRole.CUSTOMER,
          status: AccountStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(false));

        await expect(strategy.validate('test@example.com', 'invalid-password')).rejects.toThrow(
          UnauthorizedException,
        );

        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        
        expect(bcrypt.compare).toHaveBeenCalledWith('invalid-password', 'hashed-password');
      });
    });
  });
}); 