.PHONY: help install dev build start stop clean lint format setup db-generate db-push db-migrate db-studio db-seed

# Default target
help:
	@echo "Subscribly - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup        - Copy .env.example to .env.local for first-time setup"
	@echo "  make install      - Install npm dependencies"
	@echo "  make db-generate  - Generate Prisma Client"
	@echo "  make db-push      - Push Prisma schema to database (dev)"
	@echo "  make db-migrate   - Create and run production migration"
	@echo "  make db-seed      - Seed database with dummy data"
	@echo "  make db-studio    - Open Prisma Studio (database GUI)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make stop         - Stop running server"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run ESLint"
	@echo "  make format       - Run Prettier"
	@echo "  make clean        - Remove node_modules, .next, and build artifacts"
	@echo ""
	@echo "Note: All commands run in the src/ directory"
	@echo ""

# First-time setup: copy environment variables template
setup:
	@echo "Setting up environment variables..."
	@if [ ! -f src/.env.local ]; then \
		cp src/.env.example src/.env.local; \
		echo "✓ Created src/.env.local from .env.example"; \
		echo ""; \
		echo "Next steps:"; \
		echo "  1. Edit src/.env.local and configure:"; \
		echo "     - DATABASE_URL (PostgreSQL connection string)"; \
		echo "     - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"; \
		echo "  2. Ensure PostgreSQL is running locally"; \
		echo "  3. Run 'make install' to install dependencies"; \
		echo "  4. Run 'make db-push' to create database tables"; \
		echo "  5. Run 'make dev' to start the development server"; \
	else \
		echo "⚠ src/.env.local already exists. Skipping..."; \
	fi

# Install dependencies
install:
	@echo "Installing dependencies..."
	@cd src && npm install
	@echo "✓ Dependencies installed"

# Generate Prisma Client
db-generate:
	@echo "Generating Prisma Client..."
	@cd src && npx prisma generate
	@echo "✓ Prisma Client generated"

# Push schema to database (development only)
db-push:
	@echo "Pushing Prisma schema to database..."
	@cd src && npx prisma db push
	@echo "✓ Database schema updated"

# Create and run migration (production)
db-migrate:
	@echo "Creating database migration..."
	@cd src && npx prisma migrate deploy
	@echo "✓ Migration completed"

# Seed database with dummy data
db-seed:
	@echo "Seeding database with dummy data..."
	@cd src && npx prisma db seed
	@echo "✓ Database seeded"

# Open Prisma Studio
db-studio:
	@echo "Opening Prisma Studio..."
	@cd src && npx prisma studio

# Start development server
dev:
	@echo "Starting development server..."
	@echo "Server will be available at http://localhost:3000"
	@cd src && npm run dev

# Build for production
build:
	@echo "Building for production..."
	@cd src && npm run build
	@echo "✓ Build complete"

# Start production server
start:
	@echo "Starting production server..."
	@cd src && npm run start

# Stop any running dev or production server
stop:
	@echo "Stopping all Node.js servers..."
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" || echo ""
	@echo "✓ All servers stopped"
	@echo "Note: This stops all Node.js processes. Restart any other needed Node apps."

# Clean build artifacts and dependencies
clean:
	@echo "Cleaning build artifacts..."
	@cd src && rm -rf node_modules .next out .turbo
	@echo "✓ Cleaned"

# Run linter
lint:
	@echo "Running ESLint..."
	@cd src && npm run lint

# Run Prettier (if configured)
format:
	@echo "Running Prettier..."
	@cd src && npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "✓ Code formatted"

# Development helpers
.PHONY: install-all check-env init-db

# Complete first-time setup
install-all: setup install db-generate db-push
	@echo "✓ Installation complete! Run 'make dev' to start."

# Check if environment variables are set
check-env:
	@if [ ! -f src/.env.local ]; then \
		echo "❌ Error: src/.env.local not found"; \
		echo "Run 'make setup' first"; \
		exit 1; \
	fi
	@echo "✓ Environment variables configured"

# Initialize database (for first-time setup)
init-db: db-generate db-push
	@echo "✓ Database initialized"
