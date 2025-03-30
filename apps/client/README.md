# EZPG Payment Integration - Frontend

This is the frontend application for the EZPG payment integration, built with Next.js.

## Getting Started

### Development

```bash
# From the project root
yarn dev

# Or just this package
yarn workspace app dev
```

### Building

```bash
# From the project root
yarn build

# Or just this package
yarn workspace app build
```

## Features

- User authentication (login/register)
- View point balance
- View virtual account details
- Request withdrawals
- View transaction history

## Structure

- `src/pages` - Next.js pages
- `src/components` - Reusable UI components
- `src/hooks` - Custom React hooks
- `src/services` - API service integrations
- `src/utils` - Utility functions
- `src/styles` - Global styles and Tailwind configuration
- `public` - Static assets

## Environment Variables

Set the following environment variables to configure the frontend:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
``` 