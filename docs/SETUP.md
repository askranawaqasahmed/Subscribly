# Subscribly - Complete Setup Guide

This guide will walk you through setting up Subscribly with Prisma, NextAuth.js, and PostgreSQL.

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ installed and running
- **Git**
- **Make** (recommended, or use npm commands directly)

## Step-by-Step Setup

### 1. Clone and Navigate to Project

```bash
git clone <your-repo-url>
cd Subscribly
```

### 2. Environment Setup

```bash
# Copy environment template
make setup
# Or manually: cp src/.env.example src/.env.local
```

### 3. Configure Environment Variables

Edit `src/.env.local`:

```env
# PostgreSQL Database URL
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/subscribly"

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Application URLs
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# In psql prompt:
CREATE DATABASE subscribly;
\q
```

Or with createdb:
```bash
createdb -U postgres subscribly
```

### 5. Install Dependencies and Initialize Database

```bash
# Complete installation (recommended)
make install-all

# This runs:
# - npm install
# - prisma generate
# - prisma db push
```

Or run commands separately:

```bash
# Install Node packages
make install

# Generate Prisma Client
make db-generate

# Create database tables
make db-push
```

### 6. Verify Database Setup

```bash
# Open Prisma Studio to view your database
make db-studio
```

This opens a web interface at http://localhost:5555 where you can see all your tables.

### 7. Start Development Server

```bash
make dev
```

Visit http://localhost:3000

### 8. Create Your First User

1. Go to http://localhost:3000/register
2. Fill in:
   - Full Name
   - Email
   - Phone Number
   - Password (min 8 characters)
3. Click "Sign Up"
4. You'll be logged in automatically

## Troubleshooting

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (Windows)
# Start the PostgreSQL service from Services app
```

### Port 5432 Already in Use

**Solution**: PostgreSQL might be running on a different port. Check with:
```bash
psql -U postgres -c "SHOW port;"
```

Update your DATABASE_URL accordingly.

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
make db-generate
```

### Migration Errors

If you encounter schema sync issues:

```bash
cd src
npx prisma db push --force-reset
```

⚠️ **Warning**: This deletes all data!

## Development Workflow

### Making Database Changes

1. Edit `src/prisma/schema.prisma`
2. Push changes to database:
   ```bash
   make db-push  # For development
   ```
3. For production, create a migration:
   ```bash
   cd src
   npx prisma migrate dev --name describe_your_change
   ```

### Adding New Features

1. Create service in `src/lib/services/`
2. Add API route in `src/app/api/`
3. Create UI component in `src/components/`
4. Add page in `src/app/(dashboard)/`

### Testing Locally

```bash
# Run linter
make lint

# Format code
make format

# Build production version
make build
```

## Deployment

### Deploy Database to Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Copy the DATABASE_URL
5. Run migrations:
   ```bash
   DATABASE_URL="your-railway-url" npx prisma migrate deploy
   ```

### Deploy App to Vercel

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL` (from Railway)
   - `NEXTAUTH_SECRET` (generate new one)
   - `NEXTAUTH_URL` (your Vercel URL)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy!

## Common Make Commands

```bash
make help          # Show all commands
make dev           # Start dev server
make db-studio     # Open database GUI
make db-push       # Sync schema to database
make lint          # Run linter
make stop          # Stop running server
make clean         # Clean build artifacts
```

## Database Schema Overview

Key tables created:

- `users` - User accounts with hashed passwords
- `accounts` - OAuth provider accounts (NextAuth)
- `sessions` - Active user sessions
- `subscriptions` - Subscription services
- `user_subscriptions` - Subscription memberships
- `payments` - Payment records
- `invoices` - Generated invoices

View the complete schema: `src/prisma/schema.prisma`

## Next Steps

1. ✅ Setup complete!
2. Create your first subscription
3. Add members
4. Track payments
5. Generate invoices

## Need Help?

- 📖 See [README.md](../README.md) for full documentation
- 🐛 Report issues on GitHub
- 💬 Check [docs/requirements.md](requirements.md) for features

## Quick Reference

### Database Commands
```bash
make db-generate   # Generate Prisma Client
make db-push       # Push schema (dev)
make db-studio     # Open GUI
```

### Development Commands
```bash
make dev           # Start server
make build         # Production build
make lint          # Check code
```

### PostgreSQL Commands
```bash
psql -U postgres subscribly          # Connect to database
\dt                                  # List tables
\d users                            # Describe users table
\q                                  # Quit
```

---

Happy coding! 🚀
