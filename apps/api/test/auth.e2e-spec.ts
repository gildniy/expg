import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', 'Test User');
          expect(res.body).toHaveProperty('role', 'CUSTOMER');
          expect(res.body).toHaveProperty('status', 'ACTIVE');
        });
    });

    it('should not register with existing email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Email already exists');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          authToken = res.body.accessToken;
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });
  });

  describe('/auth/me (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', 'Test User');
        });
    });

    it('should not get profile without token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('/auth/change-password (POST)', () => {
    it('should change password with valid old password', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(200);
    });

    it('should not change password with invalid old password', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid old password');
        });
    });
  });
});
