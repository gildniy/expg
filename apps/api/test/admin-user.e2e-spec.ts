import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('AdminUserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let superAdminToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    userRepository = moduleFixture.get(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Clean the database
    await userRepository.delete({});

    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword', 10);

    // Create a super admin
    const superAdmin = userRepository.create({
      email: 'super-admin@test.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    });
    await userRepository.save(superAdmin);

    // Create an admin
    const admin = userRepository.create({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);

    // Generate tokens
    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
  });

  afterAll(async () => {
    // Clean up
    await userRepository.delete({});
    await app.close();
  });

  describe('/admin/users/register-admin (POST)', () => {
    it('should allow super admin to register a new admin', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'new-admin@test.com',
          password: 'password123',
          name: 'New Admin User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.email).toBe('new-admin@test.com');
          expect(res.body.name).toBe('New Admin User');
          expect(res.body.role).toBe(UserRole.ADMIN);
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should not allow admin to register a new admin', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'another-admin@test.com',
          password: 'password123',
          name: 'Another Admin',
        })
        .expect(403);
    });

    it('should validate admin registration input', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          // Missing required fields
          email: 'invalid@test.com',
        })
        .expect(400);
    });
  });

  describe('/admin/users/register-merchant (POST)', () => {
    it('should allow super admin to register a new merchant', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'merchant1@test.com',
          password: 'password123',
          name: 'Merchant Business 1',
          metadata: {
            businessType: 'Retail',
            taxId: '123-45-6789',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.email).toBe('merchant1@test.com');
          expect(res.body.name).toBe('Merchant Business 1');
          expect(res.body.role).toBe(UserRole.MERCHANT);
          expect(res.body.metadata).toBeDefined();
          expect(res.body.metadata.businessType).toBe('Retail');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should allow admin to register a new merchant', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'merchant2@test.com',
          password: 'password123',
          name: 'Merchant Business 2',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.email).toBe('merchant2@test.com');
          expect(res.body.name).toBe('Merchant Business 2');
          expect(res.body.role).toBe(UserRole.MERCHANT);
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should validate merchant registration input', () => {
      return request(app.getHttpServer())
        .post('/admin/users/register-merchant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
          email: 'invalid@test.com',
        })
        .expect(400);
    });
  });
});
