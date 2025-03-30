import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/entities/user.entity';

describe('VirtualAccountController (e2e)', () => {
  let app: INestApplication;
  let customerToken: string;
  let merchantToken: string;
  let virtualAccountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a customer user
    const customerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'customer@example.com',
      password: 'password123',
      name: 'Test Customer',
      role: UserRole.CUSTOMER,
    });

    customerToken = customerResponse.body.access_token;

    // Create a merchant user
    const merchantResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'merchant@example.com',
      password: 'password123',
      name: 'Test Merchant',
      role: UserRole.MERCHANT,
    });

    merchantToken = merchantResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/virtual-accounts (POST)', () => {
    it('should create a virtual account', () => {
      return request(app.getHttpServer())
        .post('/virtual-accounts')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bankCd: 'BANK_ABC',
          accountName: 'Test Account',
          depositAmt: 100000,
          currency: 'KRW',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('bankCd', 'BANK_ABC');
          expect(res.body).toHaveProperty('accountName', 'Test Account');
          expect(res.body).toHaveProperty('depositAmt', 100000);
          expect(res.body).toHaveProperty('currency', 'KRW');
          virtualAccountId = res.body.id;
        });
    });

    it('should not create virtual account without auth', () => {
      return request(app.getHttpServer())
        .post('/virtual-accounts')
        .send({
          bankCd: 'BANK_ABC',
          accountName: 'Test Account',
          depositAmt: 100000,
          currency: 'KRW',
        })
        .expect(401);
    });
  });

  describe('/virtual-accounts/:id (GET)', () => {
    it('should get virtual account by id', () => {
      return request(app.getHttpServer())
        .get(`/virtual-accounts/${virtualAccountId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', virtualAccountId);
          expect(res.body).toHaveProperty('bankCd', 'BANK_ABC');
          expect(res.body).toHaveProperty('accountName', 'Test Account');
        });
    });

    it('should not get non-existent virtual account', () => {
      return request(app.getHttpServer())
        .get('/virtual-accounts/non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('/virtual-accounts (GET)', () => {
    it('should get list of virtual accounts', () => {
      return request(app.getHttpServer())
        .get('/virtual-accounts')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('bankCd');
          expect(res.body[0]).toHaveProperty('accountName');
        });
    });
  });

  describe('/virtual-accounts/:id/status (PATCH)', () => {
    it('should update virtual account status', () => {
      return request(app.getHttpServer())
        .patch(`/virtual-accounts/${virtualAccountId}/status`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', virtualAccountId);
          expect(res.body).toHaveProperty('status', 'INACTIVE');
        });
    });

    it('should not update status without merchant auth', () => {
      return request(app.getHttpServer())
        .patch(`/virtual-accounts/${virtualAccountId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(403);
    });
  });
});
