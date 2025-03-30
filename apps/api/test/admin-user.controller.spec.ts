import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from '../src/controllers/admin/user.controller';
import { AuthService } from '../src/services/auth.service';
import { RegisterAdminDto, RegisterMerchantDto } from '../src/dto/auth.dto';
import { UserRole } from '../src/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let authService: AuthService;

  // Mock data
  const mockSuperAdmin = { id: '1', role: UserRole.SUPER_ADMIN };
  const mockAdmin = { id: '2', role: UserRole.ADMIN };
  const mockAdminDto: RegisterAdminDto = {
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
  };
  const mockMerchantDto: RegisterMerchantDto = {
    email: 'merchant@example.com',
    password: 'password123',
    name: 'Merchant Business',
    metadata: { businessType: 'Retail' },
  };

  // Expected responses
  const mockNewAdmin = {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };
  const mockNewMerchant = {
    id: '4',
    email: 'merchant@example.com',
    name: 'Merchant Business',
    role: UserRole.MERCHANT,
    metadata: { businessType: 'Retail' },
  };

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            registerAdmin: jest.fn().mockImplementation((user, adminDto) => {
              if (user.role !== UserRole.SUPER_ADMIN) {
                throw new ForbiddenException('Only super admins can register admins');
              }
              return Promise.resolve(mockNewAdmin);
            }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            registerMerchant: jest.fn().mockImplementation((user, merchantDto) => {
              if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
                throw new ForbiddenException('Only admins can register merchants');
              }
              return Promise.resolve(mockNewMerchant);
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('registerAdmin', () => {
    it('should allow super admin to register a new admin', async () => {
      const req = { user: mockSuperAdmin };
      const result = await controller.registerAdmin(req, mockAdminDto);

      expect(authService.registerAdmin).toHaveBeenCalledWith(mockSuperAdmin, mockAdminDto);
      expect(result).toEqual(mockNewAdmin);
    });

    it('should throw ForbiddenException when non-super admin tries to register admin', async () => {
      const req = { user: mockAdmin };

      await expect(controller.registerAdmin(req, mockAdminDto)).rejects.toThrow(ForbiddenException);

      expect(authService.registerAdmin).toHaveBeenCalledWith(mockAdmin, mockAdminDto);
    });
  });

  describe('registerMerchant', () => {
    it('should allow super admin to register a new merchant', async () => {
      const req = { user: mockSuperAdmin };
      const result = await controller.registerMerchant(req, mockMerchantDto);

      expect(authService.registerMerchant).toHaveBeenCalledWith(mockSuperAdmin, mockMerchantDto);
      expect(result).toEqual(mockNewMerchant);
    });

    it('should allow admin to register a new merchant', async () => {
      const req = { user: mockAdmin };
      const result = await controller.registerMerchant(req, mockMerchantDto);

      expect(authService.registerMerchant).toHaveBeenCalledWith(mockAdmin, mockMerchantDto);
      expect(result).toEqual(mockNewMerchant);
    });

    it('should throw ForbiddenException when non-admin tries to register merchant', async () => {
      const mockCustomer = { id: '5', role: UserRole.CUSTOMER };
      const req = { user: mockCustomer };

      jest
        .spyOn(authService, 'registerMerchant')
        .mockRejectedValueOnce(new ForbiddenException('Only admins can register merchants'));

      await expect(controller.registerMerchant(req, mockMerchantDto)).rejects.toThrow(
        ForbiddenException,
      );

      expect(authService.registerMerchant).toHaveBeenCalledWith(mockCustomer, mockMerchantDto);
    });
  });
});
