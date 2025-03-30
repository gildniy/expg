import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/entities/user.entity';
import { TransactionStatus, TransactionType } from '../src/entities/transaction.entity';
import { VirtualAccountProvider } from '../src/entities/virtual-account.entity';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let customerToken: string;
  let merchantToken: string;
  let merchantId: string;
  let virtualAccountId: string;
  let transactionId: string;

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

    // Create a test transaction
    const transactionResponse = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        amount: 1000,
        currency: 'USD',
        type: TransactionType.DEPOSIT,
      });

    transactionId = transactionResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Transaction Management', () => {
    it('/transactions/deposit (POST)', () => {
      return request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          virtualAccountId,
          amount: 100000,
          currency: 'KRW',
          moid: Date.now().toString(),
          providerTransactionId: Date.now().toString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.transactionType).toBe(TransactionType.DEPOSIT);
          expect(res.body.amount).toBe(100000);
          expect(res.body.currency).toBe('KRW');
          expect(res.body.status).toBe(TransactionStatus.COMPLETED);
          transactionId = res.body.id;
        });
    });

    it('/transactions/deposit (POST) - Invalid virtual account', () => {
      return request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          virtualAccountId: 'non-existent-id',
          amount: 100000,
          currency: 'KRW',
          moid: Date.now().toString(),
          providerTransactionId: Date.now().toString(),
        })
        .expect(404);
    });

    it('/transactions/withdraw (POST)', () => {
      return request(app.getHttpServer())
        .post('/transactions/withdraw')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          amount: 50000,
          currency: 'KRW',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test Customer',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.transactionType).toBe(TransactionType.WITHDRAWAL);
          expect(res.body.amount).toBe(50000);
          expect(res.body.currency).toBe('KRW');
          expect(res.body.status).toBe(TransactionStatus.PENDING);
        });
    });

    it('/transactions/withdraw (POST) - Insufficient points', () => {
      return request(app.getHttpServer())
        .post('/transactions/withdraw')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          amount: 1000000,
          currency: 'KRW',
          bankCd: 'BANK_ABC',
          accountNo: '1234567890',
          accountName: 'Test Customer',
        })
        .expect(400);
    });

    it('/transactions/:id (GET) - Success', () => {
      return request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('amount');
          expect(res.body).toHaveProperty('currency');
          expect(res.body).toHaveProperty('type');
        });
    });

    it('/transactions/:id (GET) - Unauthorized', () => {
      return request(app.getHttpServer()).get(`/transactions/${transactionId}`).expect(401);
    });

    it('/transactions/:id (GET) - Not Found', () => {
      return request(app.getHttpServer())
        .get('/transactions/non-existent-id')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(404);
    });

    it('/transactions (GET)', () => {
      return request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('transactionType');
          expect(res.body[0]).toHaveProperty('amount');
          expect(res.body[0]).toHaveProperty('currency');
          expect(res.body[0]).toHaveProperty('status');
        });
    });

    it('/transactions/:id/status (PATCH)', () => {
      return request(app.getHttpServer())
        .patch(`/transactions/${transactionId}/status`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          status: TransactionStatus.COMPLETED,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
          expect(res.body.status).toBe(TransactionStatus.COMPLETED);
        });
    });

    it('/transactions/:id/status (PATCH) - Unauthorized', () => {
      return request(app.getHttpServer())
        .patch(`/transactions/${transactionId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: TransactionStatus.COMPLETED,
        })
        .expect(403);
    });
  });
});
