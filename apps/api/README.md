# EZPG API

The EZPG API is a powerful and scalable backend service built with NestJS, designed to handle virtual account management, payments, and user authentication.

## Features

- **Authentication**: Secure JWT-based authentication with role-based access control
- **Virtual Accounts**: Create and manage virtual accounts for receiving payments
- **Transactions**: Process and track financial transactions
- **Points System**: Manage user reward/point system
- **Admin Portal**: Administrative functionality for user management
- **Dual ORM Support**: Seamless switching between TypeORM and Prisma
- **Supabase Integration**: Connect to Supabase using database URLs

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM or Prisma
- **Cloud Database**: Supabase support
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Validation**: Class-validator and class-transformer
- **Testing**: Jest with 100% test coverage

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL or Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ezpg.git
cd ezpg/apps/api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Database Setup
   
   a. For TypeORM (default):
   ```bash
   # Update .env with database credentials or URL
   # Set USE_PRISMA=false
   npm run migration:run
   ```
   
   b. For Prisma with local PostgreSQL:
   ```bash
   # Update .env with DATABASE_URL
   # Set USE_PRISMA=true
   npx prisma generate
   npx prisma migrate dev
   ```
   
   c. For Prisma with Supabase:
   ```bash
   # Update .env with DATABASE_URL and DIRECT_URL from Supabase
   # Set USE_PRISMA=true
   # Configure SUPABASE_URL and SUPABASE_ANON_KEY
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server
```bash
npm run start:dev
```

## Database Configuration

### Using Database URLs

You can configure the database connection using a single URL instead of individual parameters:

```
# .env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Supabase Configuration

For Supabase integration, add the following to your .env file:

```
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
USE_PRISMA=true
```

### Switching between ORMs

The application supports both TypeORM and Prisma. Set the `USE_PRISMA` environment variable to switch:

```
# For TypeORM
USE_PRISMA=false

# For Prisma
USE_PRISMA=true
```

## API Documentation

API documentation is available at `/api/docs` when the server is running (using Swagger).

### Key Endpoints

- **Authentication**
  - `POST /auth/login`: User login
  - `POST /auth/register`: User registration
  - `GET /auth/profile`: Get authenticated user profile

- **Virtual Accounts**
  - `GET /virtual-accounts`: Get all virtual accounts for the user
  - `POST /virtual-accounts`: Create a new virtual account
  - `GET /virtual-accounts/:id`: Get a virtual account by ID

- **Transactions**
  - `GET /transactions`: Get all transactions for the user
  - `POST /transactions`: Create a new transaction
  - `GET /transactions/:id`: Get a transaction by ID

- **Points**
  - `GET /points`: Get point balance and history
  - `POST /points`: Award points to a user

- **Admin**
  - `GET /admin/users`: Get all users (admin only)
  - `PATCH /admin/users/:id`: Update user details (admin only)

## Authentication

The API uses JWT-based authentication with Passport.js. Two strategies are available:

- **Local Strategy**: For username/password login
- **JWT Strategy**: For token-based authentication

Role-based access control is implemented using guards and decorators.

## Testing

The project has comprehensive test coverage to ensure reliability and stability.

### Running Tests

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
apps/api/
├── src/                  # Source code
│   ├── controllers/      # API controllers
│   ├── auth/             # Authentication strategies, guards, and decorators
│   ├── dto/              # Data Transfer Objects
│   ├── entities/         # TypeORM entities
│   ├── guards/           # Authentication guards
│   ├── services/         # Business logic
│   └── main.ts           # Application entry point
├── prisma/               # Prisma schema and migrations
├── test/                 # Test files
├── dist/                 # Compiled output
└── README.md             # This file
```

## Development Guides

### Creating a New Endpoint

1. Create DTO(s) in the `src/dto` directory
2. Create or update an entity in `src/entities` if needed
3. Update Prisma schema if using Prisma
4. Implement business logic in a service
5. Create a controller to expose the API
6. Add appropriate tests

### Database Migrations

TypeORM migrations:
```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert  # Revert the last migration
```

Prisma migrations:
```bash
npx prisma migrate dev --name migration_name
npx prisma migrate deploy  # For production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add or update tests (maintain 100% coverage)
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 