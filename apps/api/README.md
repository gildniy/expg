# EZPG API

This is the backend API for the EZPG Virtual Account service. It provides endpoints for managing virtual accounts, transactions, points, and support tickets.

## Features

- User Authentication and Authorization
- Virtual Account Management
- Transaction Processing
- Point System
- Support Ticket System
- Role-based Access Control

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v12 or later)
- EZPG Service API Key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ezpg.git
cd ezpg/apps/api
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```bash
createdb ezpg
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Documentation

The API documentation is available at `http://localhost:3000/api` when running the application.

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e
```

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/       # Business logic
├── entities/       # Database models
├── modules/        # Feature modules
├── guards/         # Authentication guards
├── decorators/     # Custom decorators
├── strategies/     # Passport strategies
└── main.ts         # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Admin User Management

The EZPG API now includes role-based user management with a hierarchy of roles:

- **SUPER_ADMIN**: Highest level role with full system access, including admin management
- **ADMIN**: System administrators who can manage merchants and general system operations
- **MERCHANT**: Business users who provide services through the platform
- **CUSTOMER**: Regular users who use the platform services

### Getting Started with Admin Access

#### Setting Up the Super Admin

Before you can use the admin functionality, you need to create a Super Admin user. This can be done using the provided seed script:

1. Configure Super Admin credentials in your environment variables (optional):
   ```
   SUPER_ADMIN_EMAIL=your-email@example.com
   SUPER_ADMIN_PASSWORD=securePassword123
   SUPER_ADMIN_NAME=Your Name
   ```

2. Run the seed script to create the Super Admin user:
   ```
   npm run seed:db
   ```

   If you don't provide custom environment variables, a default Super Admin will be created with:
   - Email: super-admin@example.com
   - Password: superAdminPassword123
   - Name: Super Admin

#### Managing Admins and Merchants

Once you have a Super Admin account, you can:

1. **Register New Admins** (Super Admin only):
   ```
   POST /admin/users/register-admin
   {
     "email": "admin@example.com",
     "password": "securePassword123",
     "name": "Admin User",
     "phone": "+1234567890" (optional)
   }
   ```

2. **Register New Merchants** (Admin or Super Admin):
   ```
   POST /admin/users/register-merchant
   {
     "email": "merchant@example.com",
     "password": "securePassword123",
     "name": "Merchant Business",
     "phone": "+1234567890" (optional),
     "metadata": {
       "businessType": "Retail",
       "taxId": "123-45-6789"
     } (optional)
   }
   ```

### Authentication

All admin endpoints require a valid JWT token with the appropriate role. To authenticate:

1. Login with your admin credentials:
   ```
   POST /auth/login
   {
     "email": "your-admin-email@example.com",
     "password": "yourPassword"
   }
   ```

2. Use the returned access token in the Authorization header for all admin requests:
   ```
   Authorization: Bearer your-access-token
   ```

### Security Considerations

- Always use strong passwords for admin and super admin accounts
- Regularly rotate admin passwords
- Use HTTPS for all API communication
- Consider implementing additional security measures like IP restrictions or multi-factor authentication for admin accounts 