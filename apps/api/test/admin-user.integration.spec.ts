import { Test } from '@nestjs/testing';
import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AdminUserController } from '../src/controllers/admin/user.controller';
import { AuthService } from '../src/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../src/entities/user.entity';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';

describe('AdminUserController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let currentUser: any;

  // Mock data
  const mockSuperAdmin = { id: '1', email: 'superadmin@example.com', role: UserRole.SUPER_ADMIN };
  const mockAdmin = { id: '2', email: 'admin@example.com', role: UserRole.ADMIN };
  const mockCustomer = { id: '3', email: 'customer@example.com', role: UserRole.CUSTOMER };

  // Mock guards
  class MockJwtAuthGuard {
    canActivate() {
      return true;
    }
  }

  class MockRolesGuard {
    constructor(private allowRoles = []) {}

    canActivate(context) {
      const req = context.switchToHttp().getRequest();
      // Set the current user from our test
      if (currentUser) {
        req.user = currentUser;
      }
      // Check if user object exists before trying to access its role property
      if (!req || !req.user || !req.user.role) {
        return false;
      }
      return this.allowRoles.includes(req.user.role);
    }
  }

  beforeAll(async () => {
    // Create mock AuthService
    const mockAuthService = {
      registerAdmin: jest.fn().mockImplementation((user, dto) => {
        if (user.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException('Only super admins can register admins');
        }
        return Promise.resolve({
          id: '4',
          email: dto.email,
          name: dto.name,
          role: UserRole.ADMIN,
        });
      }),
      registerMerchant: jest.fn().mockImplementation((user, dto) => {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException('Only admins and super admins can register merchants');
        }
        return Promise.resolve({
          id: '5',
          email: dto.email,
          name: dto.name,
          role: UserRole.MERCHANT,
          metadata: dto.metadata,
        });
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(new MockRolesGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    // Get service instances
    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/admin/users/register-admin (POST)', () => {
    it('should register a new admin when called by super admin', async () => {
      // Set the current user for this test
      currentUser = mockSuperAdmin;

      const adminDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        name: 'New Admin',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users/register-admin')
        .send(adminDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.email).toBe(adminDto.email);
      expect(response.body.name).toBe(adminDto.name);
      expect(response.body.role).toBe(UserRole.ADMIN);
      expect(authService.registerAdmin).toHaveBeenCalledWith(mockSuperAdmin, adminDto);
    });

    it('should reject admin registration when called by admin', async () => {
      // Set the current user for this test
      currentUser = mockAdmin;

      jest
        .spyOn(authService, 'registerAdmin')
        .mockRejectedValueOnce(new ForbiddenException('Only super admins can register admins'));

      const adminDto = {
        email: 'anotherAdmin@example.com',
        password: 'password123',
        name: 'Another Admin',
      };

      await request(app.getHttpServer())
        .post('/admin/users/register-admin')
        .send(adminDto)
        .expect(403);
    });
  });

  describe('/admin/users/register-merchant (POST)', () => {
    it('should register a new merchant when called by admin', async () => {
      // Set the current user for this test
      currentUser = mockAdmin;

      const merchantDto = {
        email: 'merchant@example.com',
        password: 'password123',
        name: 'Merchant Business',
        metadata: {
          businessType: 'Retail',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .send(merchantDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.email).toBe(merchantDto.email);
      expect(response.body.name).toBe(merchantDto.name);
      expect(response.body.role).toBe(UserRole.MERCHANT);
      expect(response.body.metadata).toEqual(merchantDto.metadata);
      expect(authService.registerMerchant).toHaveBeenCalledWith(mockAdmin, merchantDto);
    });

    it('should register a new merchant when called by super admin', async () => {
      // Set the current user for this test
      currentUser = mockSuperAdmin;

      const merchantDto = {
        email: 'merchant2@example.com',
        password: 'password123',
        name: 'Another Merchant',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .send(merchantDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.email).toBe(merchantDto.email);
      expect(response.body.name).toBe(merchantDto.name);
      expect(response.body.role).toBe(UserRole.MERCHANT);
      expect(authService.registerMerchant).toHaveBeenCalledWith(mockSuperAdmin, merchantDto);
    });

    it('should reject merchant registration when called by customer', async () => {
      // Set the current user for this test
      currentUser = mockCustomer;

      jest
        .spyOn(authService, 'registerMerchant')
        .mockRejectedValueOnce(
          new ForbiddenException('Only admins and super admins can register merchants'),
        );

      const merchantDto = {
        email: 'merchant3@example.com',
        password: 'password123',
        name: 'Yet Another Merchant',
      };

      await request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .send(merchantDto)
        .expect(403);
    });
  });
});
