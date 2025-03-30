import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/entities/user.entity';
import { VirtualAccountProvider } from '../src/entities/virtual-account.entity';

describe('PointController (e2e)', () => {
  let app: INestApplication;
  let customerToken: string;
  let merchantToken: string;
  let merchantId: string;
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

    // Get merchant token and ID
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'merchant@example.com',
      password: 'password123',
    });

    merchantToken = response.body.accessToken;
    merchantId = response.body.user.id;

    // Create a virtual account
    const virtualAccountResponse = await request(app.getHttpServer())
      .post('/virtual-accounts')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        merchantId,
        provider: VirtualAccountProvider.EZPG,
        bankCd: 'BANK_ABC',
        accountNo: '1234567890',
        accountName: 'Test Customer',
        fixYn: 'Y',
        depositAmt: 100000,
        currency: 'KRW',
      });

    virtualAccountId = virtualAccountResponse.body.id;

    // Create a deposit transaction to add points
    await request(app.getHttpServer())
      .post('/transactions/deposit')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        virtualAccountId,
        amount: 100000,
        currency: 'KRW',
        moid: Date.now().toString(),
        providerTransactionId: Date.now().toString(),
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Point Management', () => {
    it('/points/balance (GET)', () => {
      return request(app.getHttpServer())
        .get(`/points/balance?merchantId=${merchantId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('balance');
          expect(res.body.balance).toBe(100000);
        });
    });

    it('/points/balance (GET) - Invalid merchant', () => {
      return request(app.getHttpServer())
        .get('/points/balance?merchantId=non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('/points/balance (GET) - Unauthorized', () => {
      return request(app.getHttpServer())
        .get(`/points/balance?merchantId=${merchantId}`)
        .expect(401);
    });

    it('/points/history (GET)', () => {
      return request(app.getHttpServer())
        .get('/points/history')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('balance');
          expect(res.body[0]).toHaveProperty('createdAt');
          expect(res.body[0]).toHaveProperty('updatedAt');
        });
    });

    it('/points/history (GET) - Unauthorized', () => {
      return request(app.getHttpServer()).get('/points/history').expect(401);
    });

    it('/points/merchant/:merchantId (GET) - Success', () => {
      return request(app.getHttpServer())
        .get(`/points/merchant/${merchantId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/points/merchant/:merchantId (GET) - Unauthorized', () => {
      return request(app.getHttpServer()).get(`/points/merchant/${merchantId}`).expect(401);
    });

    it('/points/merchant/:merchantId (GET) - Not Found', () => {
      return request(app.getHttpServer())
        .get('/points/merchant/non-existent-id')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(404);
    });
  });
});
