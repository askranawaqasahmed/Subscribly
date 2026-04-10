# Subscribly

> Manage shared subscriptions, track payments, and generate invoices with ease

Subscribly is a modern, full-stack web application built with Next.js, Prisma, and PostgreSQL that helps you manage shared subscriptions (Netflix, Spotify, etc.), track member payments, calculate accumulated pending amounts, and generate professional invoices.

## Features

- **Subscription Management**: Create and manage subscriptions with flexible payment splitting (equal or individual amounts)
- **Member Management**: Add members to subscriptions, track their payment status
- **Payment Tracking**: Monitor all payments with accumulated pending calculations
- **Invoice Generation**: Create and send professional invoices via email for unpaid amounts
- **Dashboard**: Clean, intuitive interface showing owned and subscribed subscriptions
- **Authentication**: Secure user authentication with NextAuth.js and bcrypt password hashing
- **User Management (Admin)**: Super admin can view all users and activate/deactivate accounts
- **Role-Based Access**: Support for USER and SUPER_ADMIN roles with protected routes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode**: Full support for light and dark themes

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Local development + Railway for production)
- **ORM**: [Prisma](https://www.prisma.io/) (Type-safe database access)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/) (JWT-based sessions)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: npm
- **Deployment**: [Vercel](https://vercel.com/) (frontend) + [Railway](https://railway.app/) (PostgreSQL)

## Architecture

```mermaid
flowchart LR
    User[User] --> NextJS[Next.js App]
    NextJS --> API[API Routes]
    NextJS --> Pages[Pages / UI]
    API --> Services[Service Layer]
    Services --> Prisma[Prisma ORM]
    Prisma --> PostgreSQL[(PostgreSQL)]
    NextJS --> NextAuth[NextAuth.js]
    Pages --> Components[UI Components]
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher (installed locally)
- **Git**
- **Make** (optional, but recommended for automation)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Subscribly.git
cd Subscribly
```

### 2. First-Time Setup

If you have Make installed:

```bash
make setup
```

Or manually:

```bash
cp src/.env.example src/.env.local
```

### 3. Configure Environment Variables

Edit `src/.env.local` and configure the following:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/subscribly"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Create PostgreSQL Database

```bash
# Create database (if it doesn't exist)
psql -U postgres -c "CREATE DATABASE subscribly;"
```

### 5. Install Dependencies & Initialize Database

```bash
make install-all
```

This will:
- Install npm dependencies
- Generate Prisma Client
- Push database schema to PostgreSQL

Or run commands individually:

```bash
# Install dependencies
make install

# Generate Prisma Client
make db-generate

# Push schema to database
make db-push
```

### 6. Seed Database with Dummy Data (Optional)

To quickly test the application, you can seed the database with dummy users:

```bash
make db-seed
```

This creates:
- **Super Admin**: `superadmin@subscribly.com` / `admin123`
- **User 1**: `user1@subscribly.com` / `user123`
- **User 2**: `user2@subscribly.com` / `user123`

### 7. Start Development Server

```bash
make dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 8. Login or Create Your Account

**Option 1: Use dummy account (if seeded)**
- Login with `superadmin@subscribly.com` / `admin123` for full admin access
- Login with `user1@subscribly.com` / `user123` for regular user access

**Option 2: Create new account**
1. Navigate to [http://localhost:3000/register](http://localhost:3000/register)
2. Fill in your details and create an account
3. You'll be automatically logged in and redirected to the dashboard

## Make Commands Reference

| Command | Description |
|---------|-------------|
| `make help` | Display all available commands |
| `make setup` | Copy `.env.example` to `.env.local` (first-time setup) |
| `make install` | Install npm dependencies |
| `make install-all` | Complete setup (setup + install + db init) |
| `make db-generate` | Generate Prisma Client |
| `make db-push` | Push Prisma schema to database (dev) |
| `make db-migrate` | Create and run production migration |
| `make db-seed` | Seed database with dummy users |
| `make db-studio` | Open Prisma Studio (database GUI) |
| `make dev` | Start development server at http://localhost:3000 |
| `make build` | Build for production |
| `make start` | Start production server |
| `make stop` | Stop running dev or production server |
| `make clean` | Remove `node_modules`, `.next`, and build artifacts |
| `make lint` | Run ESLint |
| `make format` | Run Prettier to format code |

## Project Structure

```
Subscribly/
├── docs/
│   ├── initialplan.md          # Complete implementation plan
│   ├── requirements.md         # Feature specifications
│   └── migration-guide.md      # Database migration guide
├── src/                        # Next.js application
│   ├── app/
│   │   ├── (auth)/             # Authentication pages (login, register)
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── api/                # REST API routes
│   │   │   └── auth/           # NextAuth.js endpoints
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (redirects)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components (sidebar, header)
│   │   ├── subscriptions/      # Subscription-specific components
│   │   ├── payments/           # Payment-specific components
│   │   └── invoices/           # Invoice-specific components
│   ├── lib/
│   │   ├── auth.ts             # NextAuth.js configuration
│   │   ├── prisma.ts           # Prisma client instance
│   │   ├── services/           # Business logic layer
│   │   ├── types/              # TypeScript types and DTOs
│   │   ├── utils.ts            # Utility functions
│   │   └── constants.ts        # App constants
│   ├── prisma/
│   │   └── schema.prisma       # Prisma database schema
│   ├── types/
│   │   └── next-auth.d.ts      # NextAuth type definitions
│   ├── .env.example            # Environment variables template
│   ├── .env.local              # Local environment (gitignored)
│   ├── middleware.ts           # Next.js middleware (auth)
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   └── package.json            # Dependencies
├── Makefile                    # Automation commands
├── LICENSE                     # Project license
└── README.md                   # This file
```

## Database Schema

The application uses Prisma with PostgreSQL. Key tables:

- **users** - User accounts with authentication
- **accounts** - OAuth accounts (NextAuth)
- **sessions** - User sessions (NextAuth)
- **subscriptions** - Subscription services (Netflix, Spotify, etc.)
- **user_subscriptions** - Junction table for subscription members
- **payments** - Payment records per member per cycle
- **invoices** - Generated invoices for unpaid amounts

View the complete schema in `src/prisma/schema.prisma`.

### Database Management

```bash
# View database in GUI
make db-studio

# Push schema changes (dev)
make db-push

# Create migration (production)
cd src && npx prisma migrate dev --name migration_name

# Deploy migrations (production)
make db-migrate
```

## API Reference

All API routes are located in `src/app/api/` and return JSON responses.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth.js endpoints (login, callback, etc.) |

### Subscriptions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscriptions` | List user's subscriptions (owned + member) | Yes |
| POST | `/api/subscriptions` | Create new subscription | Yes |
| GET | `/api/subscriptions/:id` | Get subscription details | Yes |
| PUT | `/api/subscriptions/:id` | Update subscription (owner only) | Yes |
| DELETE | `/api/subscriptions/:id` | Delete subscription (owner only) | Yes |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payments` | List user's payments | Yes |
| POST | `/api/payments` | Create payment record | Yes |
| POST | `/api/payments/:id/mark-paid` | Mark payment as paid (owner only) | Yes |

### Invoices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/invoices` | List user's invoices | Yes |
| POST | `/api/invoices` | Generate invoice | Yes |

### Admin (Super Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | List all users in the system | Super Admin |
| PATCH | `/api/admin/users/:id` | Activate/deactivate user account | Super Admin |

**Note**: Admin endpoints check for `SUPER_ADMIN` role. Inactive users cannot log in.

## Deployment

### Deploy to Railway (Database)

1. Create a new project on [Railway](https://railway.app/)
2. Add a PostgreSQL service
3. Copy the `DATABASE_URL` from Railway
4. Update your production environment variables

### Deploy to Vercel (Application)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "New Project" and import your repository
4. Configure environment variables:
   - `DATABASE_URL` (from Railway)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your production URL)
5. Deploy!

### Run Migrations in Production

```bash
# Set DATABASE_URL to your Railway database
export DATABASE_URL="your-railway-database-url"

# Run migrations
cd src && npx prisma migrate deploy
```

## Development

### Running the Development Server

```bash
make dev
```

The development server includes:
- Hot module replacement
- TypeScript type checking
- ESLint linting
- Automatic page reloading

### Building for Production

```bash
make build
make start
```

### Linting and Formatting

```bash
# Run ESLint
make lint

# Format code with Prettier
make format
```

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

1. Check if the issue already exists
2. Use the issue template
3. Provide detailed reproduction steps
4. Include screenshots if applicable

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `make lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation for new features
- Add tests for new functionality
- Keep PRs focused and small

## Roadmap

- [x] **Core Features**: Subscription management, payments, invoices
- [x] **Authentication**: NextAuth.js with credentials provider
- [x] **Database**: Prisma + PostgreSQL
- [ ] **Payment Integration**: Integrate Stripe/PayPal for direct payments
- [ ] **Email Service**: Replace placeholder with Resend/SendGrid
- [ ] **Background Jobs**: Automated invoice generation
- [ ] **Mobile App**: Flutter mobile application (consumes same API)
- [ ] **Notifications**: In-app and email notification system
- [ ] **Analytics**: Dashboard with payment trends and insights
- [ ] **Multi-currency**: Support for different currencies
- [ ] **Recurring Payments**: Automatic payment scheduling

## FAQ

### Q: Do I need to install PostgreSQL?

A: Yes, for local development. You can also use Railway's PostgreSQL for both development and production.

### Q: How do I reset my database?

A: Run `cd src && npx prisma db push --force-reset` (WARNING: This deletes all data!)

### Q: How do I view my database?

A: Run `make db-studio` to open Prisma Studio, a GUI for your database.

### Q: Can I use a different database?

A: Prisma supports MySQL, SQLite, MongoDB, and others. Update the `datasource` in `schema.prisma`.

### Q: Are payments actually processed?

A: Currently, payment tracking is manual. Payment integration is planned for a future release.

## Troubleshooting

### Database Connection Errors

- Ensure PostgreSQL is running: `pg_ctl status`
- Check DATABASE_URL in `.env.local`
- Verify database exists: `psql -U postgres -l`

### Prisma Client Errors

- Regenerate client: `make db-generate`
- Push schema: `make db-push`

### Authentication Issues

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your app URL
- Clear browser cookies and try again

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See `/docs` folder for detailed documentation
- **Issues**: [GitHub Issues](https://github.com/yourusername/Subscribly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Subscribly/discussions)

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Prisma](https://www.prisma.io/) for the excellent ORM
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Railway](https://railway.app/) for PostgreSQL hosting
- [Vercel](https://vercel.com/) for hosting and deployment

---

Built with ❤️ for the open-source community
