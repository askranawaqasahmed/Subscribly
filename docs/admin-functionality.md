# Admin Functionality Documentation

This document describes the super admin features added to Subscribly.

## Overview

The application now supports role-based access control with two user roles:
- **USER**: Regular users with standard access to subscriptions, payments, and invoices
- **SUPER_ADMIN**: Administrators with additional privileges to manage all users

## Features

### 1. User Roles & Account Status

#### User Roles
- `USER`: Default role assigned to all new registrations
- `SUPER_ADMIN`: Admin role with elevated privileges

#### Account Status
- `isActive: true`: User can log in and access the application
- `isActive: false`: User account is deactivated and cannot log in

### 2. Super Admin Dashboard

Super admins have access to a User Management dashboard at `/admin/users` that displays:
- Full list of all registered users
- User details: name, email, phone, role, status
- Join date for each user
- Activate/Deactivate controls

### 3. User Management Features

Super admins can:
- View all users in the system
- Activate inactive user accounts
- Deactivate active user accounts
- See user roles and join dates

### 4. Security Features

- Inactive users are blocked from logging in (checked during authentication)
- Super admins cannot deactivate their own accounts (prevents lockout)
- All admin API routes check for SUPER_ADMIN role
- Session includes user role for authorization checks

## Technical Implementation

### Database Schema Changes

Added to `User` model in Prisma schema:

```prisma
model User {
  // ... existing fields
  role                  UserRole            @default(USER)
  isActive              Boolean             @default(true) @map("is_active")
  // ... rest of fields
}

enum UserRole {
  USER
  SUPER_ADMIN
}
```

### Authentication Updates

**File**: `src/lib/auth.ts`

- Added check for `isActive` status during login
- Throws error if user account is deactivated
- Role information added to JWT and session

**File**: `src/types/next-auth.d.ts`

- Extended NextAuth types to include `role` in session and JWT

### API Routes

#### GET `/api/admin/users`
- **Auth**: Super Admin only
- **Returns**: Array of all users with selected fields
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "User Name",
      "phoneNumber": "+1234567890",
      "role": "USER",
      "isActive": true,
      "emailVerified": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```

#### PATCH `/api/admin/users/:id`
- **Auth**: Super Admin only
- **Body**: `{ "isActive": boolean }`
- **Returns**: Updated user object
- **Validation**: Prevents super admin from deactivating their own account

### UI Components

#### Admin Users Page
**File**: `src/app/(dashboard)/admin/users/page.tsx`

- Client component with real-time user management
- Table display with user information
- Activate/Deactivate buttons with loading states
- Toast notifications for success/error feedback

#### Sidebar Navigation
**File**: `src/components/layout/sidebar.tsx`

- Shows "Admin" section only for SUPER_ADMIN users
- Adds "User Management" link to admin section

#### Mobile Navigation
**File**: `src/components/layout/mobile-nav.tsx`

- Shows "Users" tab only for SUPER_ADMIN users
- Adapts mobile navigation based on user role

### Database Seeding

**File**: `src/prisma/seed.ts`

Seeds the database with dummy users for testing:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| superadmin@subscribly.com | admin123 | SUPER_ADMIN | Active |
| user1@subscribly.com | user123 | USER | Active |
| user2@subscribly.com | user123 | USER | Active |

**Run with**: `make db-seed` or `npx prisma db seed`

## Usage

### For Developers

1. **Seed dummy users**:
   ```bash
   make db-seed
   ```

2. **Login as super admin**:
   - Email: `superadmin@subscribly.com`
   - Password: `admin123`

3. **Access admin panel**:
   - Navigate to `/admin/users`
   - Or click "User Management" in sidebar

### For Super Admins

1. Login with super admin credentials
2. Access "User Management" from the sidebar
3. View all registered users
4. Click "Deactivate" to disable a user account
5. Click "Activate" to re-enable a deactivated account

### For Regular Users

- Users cannot see or access admin features
- Deactivated users will see an error message when trying to login:
  > "Your account has been deactivated. Please contact support."

## Security Considerations

1. **Role Verification**: All admin routes verify SUPER_ADMIN role on every request
2. **Session Security**: Role stored in JWT, verified server-side
3. **Self-Protection**: Super admins cannot deactivate themselves
4. **Login Prevention**: Inactive users blocked at authentication level
5. **Error Messages**: Generic messages to prevent information disclosure

## Future Enhancements

Potential improvements for admin functionality:

- [ ] User search and filtering
- [ ] Pagination for large user lists
- [ ] User activity logs
- [ ] Bulk user operations
- [ ] Role management (add more roles)
- [ ] Email notifications for account status changes
- [ ] Admin activity audit trail
- [ ] Password reset by admin
- [ ] User impersonation for support

## Testing

### Manual Testing Checklist

- [ ] Super admin can view all users
- [ ] Super admin can deactivate a user
- [ ] Deactivated user cannot login
- [ ] Super admin can reactivate a user
- [ ] Reactivated user can login again
- [ ] Super admin cannot deactivate themselves
- [ ] Regular users cannot access admin routes
- [ ] Admin link appears only for super admins
- [ ] Mobile navigation shows admin tab for super admins

### Test Accounts

Use seeded accounts for testing:
- **Super Admin**: superadmin@subscribly.com / admin123
- **Regular User**: user1@subscribly.com / user123
- **Regular User**: user2@subscribly.com / user123

## Troubleshooting

### Issue: Cannot access admin panel

**Solution**: Verify user has SUPER_ADMIN role in database:
```sql
SELECT email, role FROM "User" WHERE email = 'your-email@example.com';
```

### Issue: Seed command fails

**Solution**: Ensure database connection is working:
```bash
make db-push
```

### Issue: User still can login after deactivation

**Solution**: Clear browser cache and NextAuth session, then try again

## Related Files

- `src/prisma/schema.prisma` - Database schema with roles
- `src/lib/auth.ts` - Authentication with role checking
- `src/app/api/admin/users/route.ts` - List users API
- `src/app/api/admin/users/[id]/route.ts` - Update user API
- `src/app/(dashboard)/admin/users/page.tsx` - Admin UI
- `src/components/layout/sidebar.tsx` - Sidebar with admin section
- `src/components/layout/mobile-nav.tsx` - Mobile nav with admin tab
- `src/prisma/seed.ts` - Database seeding script
