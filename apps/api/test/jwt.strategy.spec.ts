import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { PrismaService } from '../src/services/prisma.service';
import { UserRole, AccountStatus } from '../src/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
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

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    describe('with Prisma (USE_PRISMA=true)', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key) => {
          if (key === 'USE_PRISMA') return 'true';
          if (key === 'JWT_SECRET') return 'test-secret';
          return null;
        });
      });

      it('should return user data when token is valid', async () => {
        const payload = {
          sub: 'user-id',
          email: 'test@example.com',
          role: UserRole.CUSTOMER,
        };

        const mockUser = {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.CUSTOMER,
          status: AccountStatus.ACTIVE,
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

        const result = await strategy.validate(payload);

        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-id' },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            name: true,
          },
        });

        expect(result).toEqual(mockUser);
      });

      it('should throw UnauthorizedException when user is not found', async () => {
        const payload = {
          sub: 'nonexistent-id',
          email: 'nonexistent@example.com',
          role: UserRole.CUSTOMER,
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

        await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);

        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'nonexistent-id' },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            name: true,
          },
        });
      });
    });

    describe('with TypeORM (USE_PRISMA=false)', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key) => {
          if (key === 'USE_PRISMA') return 'false';
          if (key === 'JWT_SECRET') return 'test-secret';
          return null;
        });
      });

      it('should return payload data for TypeORM to handle', async () => {
        const payload = {
          sub: 'user-id',
          email: 'test@example.com',
          role: UserRole.CUSTOMER,
        };

        const result = await strategy.validate(payload);

        // It should not call Prisma
        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
        
        // It should return the payload data for TypeORM to handle
        expect(result).toEqual({
          id: 'user-id',
          email: 'test@example.com',
          role: UserRole.CUSTOMER,
        });
      });
    });

    it('should throw UnauthorizedException when an error occurs', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      jest.spyOn(configService, 'get').mockReturnValue('true');
      jest.spyOn(prismaService.user, 'findUnique').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 