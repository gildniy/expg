# EZPG Service API Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication & Security](#authentication--security)
3. [Setup & Installation](#setup--installation)
4. [REST API Endpoints](#rest-api-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Transaction Handling](#transaction-handling)
8. [Testing](#testing)
9. [Deployment](#deployment)

## Introduction

This API provides a comprehensive interface for managing virtual accounts, transactions, points, and support tickets through the EZPG service. The API is available in REST format. All monetary values are handled in KRW (Korean Won) currency.

### Base URLs
- Development: `http://localhost:3000`
- Production: `https://api.your-domain.com`

## Authentication & Security

### API Key Authentication
All requests must include an API key in the header:
```
X-API-Key: your_api_key_here
```

### JWT Authentication
For user-specific endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

### CORS Configuration
The API supports CORS with configurable origins. Default allowed origins:
- Development: `http://localhost:3000`
- Production: `https://your-frontend-domain.com`

## Setup & Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run start:dev
```

## REST API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Virtual Accounts

#### Create Virtual Account
```http
POST /virtual-accounts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "merchantId": "merchant_123",
  "fixYn": "Y",
  "depositAmt": 100000,
  "currency": "KRW"
}
```

#### Get Virtual Account
```http
GET /virtual-accounts/:id
Authorization: Bearer <jwt_token>
```

#### List Virtual Accounts
```http
GET /virtual-accounts
Authorization: Bearer <jwt_token>
```

### Transactions

#### Create Deposit
```http
POST /transactions/deposit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "virtualAccountId": "va_123",
  "amount": 100000,
  "currency": "KRW",
  "moid": "unique_order_id",
  "providerTransactionId": "provider_tx_id"
}
```

#### Create Withdrawal
```http
POST /transactions/withdraw
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 100000,
  "currency": "KRW",
  "bankCd": "BANK_ABC",
  "accountNo": "1234567890",
  "accountName": "John Doe"
}
```

#### Get Transaction
```http
GET /transactions/:id
Authorization: Bearer <jwt_token>
```

#### List Transactions
```http
GET /transactions
Authorization: Bearer <jwt_token>
```

### Points

#### Get Points Balance
```http
GET /points/balance?merchantId=merchant_123&currency=KRW
Authorization: Bearer <jwt_token>
```

#### Get Points History
```http
GET /points/history
Authorization: Bearer <jwt_token>
```

### Support Tickets

#### Create Ticket
```http
POST /support-tickets
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Technical Issue",
  "description": "Detailed description of the issue",
  "priority": "MEDIUM"
}
```

#### Get Ticket
```http
GET /support-tickets/:id
Authorization: Bearer <jwt_token>
```

#### List Tickets
```http
GET /support-tickets
Authorization: Bearer <jwt_token>
```

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting with the following defaults:
- 100 requests per minute per IP address
- Configurable through environment variables:
  - `RATE_LIMIT_TTL`: Time window in milliseconds
  - `RATE_LIMIT_MAX`: Maximum requests per time window

## Transaction Handling

The API implements database transactions for critical operations to ensure data consistency:

### Virtual Account Operations
- Creating virtual accounts (atomic operation with EZPG API call)
- All monetary values are in KRW

### Transaction Operations
- Deposits (atomic operation with point credit)
- Withdrawals (atomic operation with point debit and EZPG API call)
- All transaction amounts are in KRW

### Error Scenarios
- If any part of a transaction fails, all changes are rolled back
- Failed transactions are marked with appropriate status and error details
- Network issues with external services (EZPG) are handled gracefully

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start:prod
```

### Environment Variables

Required environment variables for production:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `API_KEY`: API key for authentication
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `EZPG_API_KEY`: EZPG service API key
- `EZPG_API_URL`: EZPG service API URL

## Support

For support, please create a ticket through the support ticket system or contact the development team. 