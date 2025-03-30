import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/entities/user.entity';

describe('SupportTicketController (e2e)', () => {
  let app: INestApplication;
  let customerToken: string;
  let merchantToken: string;
  let customerId: string;
  let merchantId: string;
  let ticketId: string;

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
    customerId = customerResponse.body.user.id;

    // Create a merchant user
    const merchantResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'merchant@example.com',
      password: 'password123',
      name: 'Test Merchant',
      role: UserRole.MERCHANT,
    });

    merchantToken = merchantResponse.body.access_token;
    merchantId = merchantResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Support Ticket Management', () => {
    it('/support-tickets (POST)', () => {
      return request(app.getHttpServer())
        .post('/support-tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Test Ticket',
          description: 'This is a test support ticket',
          priority: 'MEDIUM',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Ticket');
          expect(res.body.description).toBe('This is a test support ticket');
          expect(res.body.priority).toBe('MEDIUM');
          expect(res.body.status).toBe('OPEN');
          expect(res.body.userId).toBe(customerId);
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
          ticketId = res.body.id;
        });
    });

    it('/support-tickets (POST) - Unauthorized', () => {
      return request(app.getHttpServer())
        .post('/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'This is a test support ticket',
          priority: 'MEDIUM',
        })
        .expect(401);
    });

    it('/support-tickets/:id (GET)', () => {
      return request(app.getHttpServer())
        .get(`/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Ticket');
          expect(res.body.description).toBe('This is a test support ticket');
          expect(res.body.priority).toBe('MEDIUM');
          expect(res.body.status).toBe('OPEN');
          expect(res.body.userId).toBe(customerId);
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
        });
    });

    it('/support-tickets/:id (GET) - Not Found', () => {
      return request(app.getHttpServer())
        .get('/support-tickets/non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('/support-tickets/:id (GET) - Unauthorized', () => {
      return request(app.getHttpServer()).get(`/support-tickets/${ticketId}`).expect(401);
    });

    it('/support-tickets (GET)', () => {
      return request(app.getHttpServer())
        .get('/support-tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('title');
          expect(res.body[0]).toHaveProperty('description');
          expect(res.body[0]).toHaveProperty('priority');
          expect(res.body[0]).toHaveProperty('status');
          expect(res.body[0]).toHaveProperty('userId');
          expect(res.body[0]).toHaveProperty('createdAt');
          expect(res.body[0]).toHaveProperty('updatedAt');
        });
    });

    it('/support-tickets/:id/status (PATCH)', () => {
      return request(app.getHttpServer())
        .patch(`/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('IN_PROGRESS');
        });
    });

    it('/support-tickets/:id/status (PATCH) - Unauthorized', () => {
      return request(app.getHttpServer())
        .patch(`/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(403);
    });

    it('/support-tickets/:id/comments (POST)', () => {
      return request(app.getHttpServer())
        .post(`/support-tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('This is a test comment');
          expect(res.body.ticketId).toBe(ticketId);
          expect(res.body.userId).toBe(merchantId);
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
        });
    });

    it('/support-tickets/:id/comments (POST) - Unauthorized', () => {
      return request(app.getHttpServer())
        .post(`/support-tickets/${ticketId}/comments`)
        .send({
          content: 'This is a test comment',
        })
        .expect(401);
    });

    it('/support-tickets/:id/comments (GET)', () => {
      return request(app.getHttpServer())
        .get(`/support-tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('content');
          expect(res.body[0]).toHaveProperty('ticketId');
          expect(res.body[0]).toHaveProperty('userId');
          expect(res.body[0]).toHaveProperty('createdAt');
          expect(res.body[0]).toHaveProperty('updatedAt');
        });
    });
  });
});
