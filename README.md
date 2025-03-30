 # EZPG Monorepo

This is a monorepo for the EZPG (Easy Payment Gateway) project, containing both the API and client applications.

## What's Inside?

This monorepo uses [Turborepo](https://turbo.build/repo) and contains:

- `apps/api`: A [NestJS](https://nestjs.com/) API with Prisma ORM
- `apps/client`: A [Next.js](https://nextjs.org/) client application
- `packages/shared`: Shared TypeScript code, types, and utilities

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ezpg.git
cd ezpg
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

4. Set up the database with Prisma (recommended)
```bash
cd apps/api && npm run db:generate
npm run db:migrate
```

Alternatively, if you need to use TypeORM:
```bash
# Change USE_PRISMA=false in your .env file
cd apps/api && npm run db:typeorm:run
```

### Development

Run the entire project in development mode:
```bash
npm run dev
```

This will start both the API server and Next.js client in parallel.

- API will be available at http://localhost:3001
- Client will be available at http://localhost:3000

To open Prisma Studio for database management:
```bash
cd apps/api && npm run db:studio
```

You can also run each app individually:
```bash
# API only
npm run dev --filter=api

# Client only
npm run dev --filter=client
```

### Building for Production

```bash
npm run build
```

## Testing

```bash
# Run tests for all packages and apps
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests for a specific project
npm test --filter=api
```

## Project Structure

```
.
├── apps
│   ├── api                 # NestJS API application
│   │   ├── prisma          # Prisma schema and migrations
│   │   └── src             # API source code
│   └── client              # Next.js client application
├── packages
│   └── shared              # Shared code between applications
├── .env.example            # Example environment variables
├── package.json            # Root package.json
└── turbo.json              # Turborepo configuration
```

## Database Management

We use Prisma as our primary ORM for its type safety and developer experience. Here are some common commands:

```bash
# Generate Prisma client after schema changes
npm run db:generate --filter=api

# Create a new migration
npm run db:migrate --filter=api

# Push schema changes directly to database (dev only)
npm run db:push --filter=api

# Reset database (caution: deletes all data)
npm run db:reset --filter=api

# Open Prisma Studio UI
npm run db:studio --filter=api
```

## Features

- **Authentication**: JWT-based authentication with Passport.js
- **Virtual Accounts**: Create and manage virtual accounts for receiving payments
- **Transactions**: Process and track financial transactions
- **Points System**: Manage user reward/point system
- **Admin Portal**: Administrative functionality for user management
- **TypeORM/Prisma Support**: Flexible ORM choice with Prisma as default
- **Supabase Integration**: Connect to Supabase using database URLs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.