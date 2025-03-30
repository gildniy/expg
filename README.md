# EZPG Payment Integration

[English](README.md) | [한국어](README.ko.md)

This project integrates with the EZPG payment gateway to provide virtual account deposits and withdrawals for a points-based system.

## Project Structure

This is a Turborepo-based monorepo with the standard directory structure:

- **apps/** - Application directories
  - **api** - NestJS backend that handles the EZPG integration, webhook processing, and business logic
  - **client** - Next.js frontend for customer and merchant interfaces
- **packages/** - Shared libraries and utilities that can be imported by applications

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new customer account
  - Request: email, password, name(optional)
  - Response: id, email, name, role

- `POST /api/v1/auth/register/merchant` - Register a new merchant account
  - Request: email, password, name(optional)
  - Response: id, email, name, role

- `POST /api/v1/auth/login` - Login to get JWT token
  - Request: email, password
  - Response: access_token, user details

- `GET /api/v1/auth/me` - Get current user profile
  - Response: id, email, name, role, createdAt

- `GET /api/v1/auth/admin` - Admin only endpoint
  - Response: Admin access confirmation

- `GET /api/v1/auth/merchant` - Merchant only endpoint
  - Response: Merchant access confirmation

### Customer Endpoints
- `GET /api/v1/customer/points` - Get current point balance
  - Response: balance, updatedAt

- `GET /api/v1/customer/virtual-account` - Get virtual account details
  - Response: accountNumber, bankName, accountHolderName, createdAt

- `GET /api/v1/customer/transactions` - Get transaction history
  - Query Parameters: types[], statuses[], startDate, endDate, limit, offset
  - Response: transactions[], pagination details

- `POST /api/v1/customer/withdrawals/request` - Request a withdrawal
  - Request: amount, bankCode, accountNumber, accountHolder, description(optional)
  - Response: transactionId, status, message

### Merchant Endpoints
- `POST /api/v1/merchant/virtual-accounts` - Register a virtual account for a user
  - Request: email
  - Response: accountNumber, bankName, accountHolderName, createdAt

- `GET /api/v1/merchant/transactions/:moid` - Search for a transaction
  - Path Parameter: moid (Merchant Order ID)
  - Response: transaction details

### Webhook Endpoints
- `POST /api/v1/webhooks/ezpg/deposit-notification` - Handle deposit notifications
  - Request: mid, vacctNo, bankCd, amt, depositDt, depositTm, trNo, depositNm(optional), bankTrId(optional)
  - Response: "0000" for success, "9999" for failure

- `POST /api/v1/webhooks/ezpg/withdrawal-notification` - Handle withdrawal notifications
  - Request: mid, natvTrNo, moid, resultCd, resultMsg, amt, bankCd, accntNo, accntNm, trDt, trTm, bankTrId(optional)
  - Response: "0000" for success, "9999" for failure

### Health Check
- `GET /api/v1/health` - API health check endpoint
  - Response: status, message, timestamp, version

## Getting Started

### Prerequisites

- Node.js 16+ and Yarn
- PostgreSQL database
- EZPG merchant account and API credentials

### Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Copy the `.env.example` to `.env` and update the environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `yarn dev`

The API will be available at `http://localhost:3001/api/v1` and the Swagger documentation at `http://localhost:3001/api/v1/docs`.

## Using the Monorepo

```bash
# Development - run all workspaces
yarn dev

# Build all applications
yarn build

# Start all applications in production mode
yarn start

# Run lint across all workspaces
yarn lint

# Run tests
yarn test
yarn test:e2e

# Work with a specific workspace
yarn workspace @ezpg/api dev
yarn workspace @ezpg/client build
```

## Environment Variables

Make sure to set the following environment variables:

```
# Database
DATABASE_URL=postgresql://...

# EZPG Integration
EZPG_MERCHANT_ID=your-ezpg-merchant-id
EZPG_MERCHANT_KEY=your-ezpg-merchant-key
EZPG_API_BASE_URL=https://api.ez-pg.com

# JWT Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=1h

# API Settings
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## API Documentation

The API is fully documented using Swagger/OpenAPI. You can access the interactive documentation at:
- Development: `http://localhost:3001/api/v1/docs`
- Production: `https://your-domain.com/api/v1/docs`

### Error Handling

The API uses standardized error responses:

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}
```

Common HTTP status codes:
- 400: Bad Request - Invalid input
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 409: Conflict - Resource conflict
- 500: Internal Server Error - Server-side error

## Testing

The project includes comprehensive test coverage:

### Unit Tests
- Controllers and Services are tested in isolation
- Mock implementations for external dependencies
- Run with `yarn test`

### Integration Tests
- Tests database interactions using Prisma
- Transaction handling and rollbacks
- Run with `yarn test:integration`

### E2E Tests
- Full API endpoint testing
- Webhook processing validation
- Run with `yarn test:e2e`

## EZPG Integration

### Deposit Flow

1. Virtual account is assigned to a customer
2. Customer deposits funds to the virtual account
3. EZPG sends a deposit notification to our webhook
4. System updates the customer's point balance

### Withdrawal Flow

1. Customer requests a withdrawal with their bank details
2. Points are deducted and a withdrawal request is sent to EZPG
3. EZPG processes the bank transfer
4. EZPG sends a withdrawal completion notification
5. System updates the transaction status

## Adding New Applications

To add a new application to the monorepo:

1. Create a new directory under `apps/`
2. Initialize the application with appropriate package.json
3. Configure the application in turbo.json pipeline

To add a shared package:

1. Create a new directory under `packages/`
2. Initialize the package with appropriate package.json
3. Add it as a dependency in the applications that need it

## License

This project is proprietary and confidential. 
