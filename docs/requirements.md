# Subscribly - Feature Requirements

## Executive Summary

Subscribly is a subscription sharing platform that enables users to manage shared subscriptions (Netflix, Spotify, etc.), track member payments, calculate accumulated pending amounts, and generate invoices for unpaid payments. The platform uses a single-role user model where ownership is contextual rather than role-based.

---

## Core Principles

### 1. Single-Role User Model

- **No Admin/User distinction**: Every registered user has the same role ("User")
- **Contextual ownership**: A user becomes an "owner" by creating a subscription
- **Dual perspective**: A user can simultaneously:
  - Own multiple subscriptions (be the account holder)
  - Be a member of other users' subscriptions (share the cost)

### 2. Payment Philosophy

- **Transparency**: All members see payment status and history
- **Accountability**: Unpaid amounts accumulate and are clearly tracked
- **Flexibility**: Support both equal splits and individual amounts
- **Record-keeping**: Complete payment history with timestamps

### 3. Invoice System

- **Manual control**: Owners decide when to generate and send invoices
- **Accumulated amounts**: Invoices can cover multiple unpaid months
- **Professional format**: Clean, printable invoice layout
- **Email delivery**: Invoices sent directly to member's email
- **Future automation**: Background job to auto-generate invoices (planned)

---

## User Roles & Permissions

### User (Default Role)

**Every registered user can:**
- Create subscriptions (becomes owner of those subscriptions)
- Be added as a member to other users' subscriptions
- View all subscriptions they own or are a member of
- View their own payment history
- Edit their own profile information

### Subscription Owner

**Users who create a subscription can:**
- Edit subscription details (name, icon, description, total amount, payment type)
- Add/remove members
- Set member payment amounts (for individual split)
- Create payment records for each cycle
- Mark member payments as paid
- Generate invoices for unpaid amounts
- Send invoices via email
- View full member payment history
- Deactivate/reactivate subscription
- Delete subscription (if no unpaid amounts exist)

### Subscription Member

**Users who are added to a subscription can:**
- View subscription details (name, icon, description, total amount)
- View their own payment amount
- View their own payment history for that subscription
- View invoices issued to them
- See owner contact information
- Leave the subscription (if no unpaid amounts exist)

---

## Feature Specifications

### F1: User Registration & Authentication

#### F1.1: Registration

**Requirements:**
- User provides: email, password, full name, phone number
- Email must be unique across the system
- Password must meet security requirements (min 8 characters)
- Phone number is required for invoice generation
- Email verification optional (Supabase feature flag)

**Acceptance Criteria:**
- User can create account with valid credentials
- Duplicate email shows appropriate error message
- Weak password shows validation error
- Successful registration creates both auth.users and profiles records
- User is automatically logged in after registration

#### F1.2: Login

**Requirements:**
- User provides: email and password
- Session persists across browser closes (configurable)
- Failed login shows appropriate error message
- Support "Remember me" functionality

**Acceptance Criteria:**
- User can log in with valid credentials
- Invalid credentials show clear error message
- Session cookie is HTTP-only and secure
- User is redirected to dashboard after login

#### F1.3: Logout

**Requirements:**
- User can log out from any page
- Logout clears session completely
- User is redirected to login page after logout

**Acceptance Criteria:**
- Logout button accessible from all protected pages
- Session is terminated on server
- User cannot access protected routes after logout

---

### F2: Profile Management

#### F2.1: View Profile

**Requirements:**
- User can view their own profile information:
  - Full name
  - Email (not editable)
  - Phone number
  - Avatar URL (optional)
  - Account creation date

**Acceptance Criteria:**
- Profile page displays all user information
- Email is displayed but cannot be edited
- Creation date is formatted correctly

#### F2.2: Edit Profile

**Requirements:**
- User can edit: full name, phone number, avatar URL
- Changes are validated before saving
- Phone number format is validated

**Acceptance Criteria:**
- User can update editable fields
- Invalid phone number shows error
- Successful save shows confirmation message
- Changes are immediately reflected across the app

---

### F3: Subscription Management

#### F3.1: Create Subscription

**Requirements:**
- Owner provides:
  - Name (required, e.g., "Netflix Premium")
  - Icon (optional, emoji or URL)
  - Description (optional)
  - Total amount (required, must be > 0)
  - Payment type: "Equal" or "Individual"
  - Total members (if equal split)
- Initial members can be added during creation
- Owner is not counted as a member (doesn't pay)

**Acceptance Criteria:**
- User can create subscription with valid data
- Equal split requires total members count
- Individual split allows adding members with custom amounts
- Subscription appears in "My Subscriptions" view immediately
- First payment cycle is automatically created for all members

#### F3.2: View My Subscriptions

**Requirements:**
- Display all subscriptions where user is the owner (created_by = user.id)
- Show for each subscription:
  - Name, icon
  - Total amount
  - Payment type (equal/individual)
  - Number of members
  - Total accumulated pending amount (sum of unpaid)
  - Quick actions (view, edit, add member)

**Acceptance Criteria:**
- Dashboard shows "My Subscriptions" tab
- All owned subscriptions are listed
- Card/list view is clean and scannable
- Pending amounts are highlighted if > 0
- Empty state shown when user owns no subscriptions

#### F3.3: View Subscribed Subscriptions

**Requirements:**
- Display all subscriptions where user is a member
- Show for each subscription:
  - Name, icon
  - Owner name
  - My payment amount
  - My payment status (paid/unpaid for current cycle)
  - Last payment date

**Acceptance Criteria:**
- Dashboard shows "Subscribed Subscriptions" tab
- All memberships are listed
- User can click to view subscription details
- Unpaid status is clearly indicated
- Empty state shown when user is not a member of any subscription

#### F3.4: View Subscription Detail

**Requirements:**
- Display full subscription information:
  - Name, icon, description
  - Total amount, payment type
  - Owner information (if user is member)
  - Member list with:
    - Name, email, phone
    - Payment amount
    - Payment status (paid/unpaid)
    - Accumulated pending amount
    - Last payment date
  - Payment history (for owner: all members; for member: own history)
  - Quick actions based on role

**Acceptance Criteria:**
- Owner sees full member list with all payment details
- Member sees only their own payment details + summary
- Member table is sortable and filterable
- Owner can access actions: add member, generate invoice, mark payment as paid
- Member can see contact owner button

#### F3.5: Edit Subscription

**Requirements:**
- Owner can edit: name, icon, description, total amount
- Payment type cannot be changed after creation (requires complex recalculation)
- Changes to total amount affect future payment cycles, not past ones

**Acceptance Criteria:**
- Edit form is pre-populated with current data
- Owner can successfully save changes
- Non-owner attempting to edit gets 403 error
- Changes are immediately reflected

#### F3.6: Delete Subscription

**Requirements:**
- Owner can delete subscription only if:
  - No members have unpaid amounts
  - OR all members have been removed
- Soft delete (mark as is_active = false) is preferred
- Confirmation dialog required

**Acceptance Criteria:**
- Delete is prevented if unpaid amounts exist
- Confirmation dialog shows warning
- Successful delete removes subscription from lists
- Deleted subscription data is retained in database (soft delete)

---

### F4: Member Management

#### F4.1: Add Member to Subscription

**Requirements:**
- Owner can add members by email or user ID
- Member must be a registered user
- If payment type is "Equal", amount is auto-calculated: total / total_members
- If payment type is "Individual", owner sets custom amount
- Adding a member creates:
  - user_subscriptions record
  - payment record for current cycle

**Acceptance Criteria:**
- Owner can add valid user as member
- Email lookup finds existing users
- Invalid email shows "User not found" error
- Equal split automatically recalculates all member amounts
- Individual split requires amount input
- New member appears in member list immediately

#### F4.2: Remove Member from Subscription

**Requirements:**
- Owner can remove member only if:
  - Member has no unpaid amounts
  - OR owner accepts to forgive unpaid amounts
- Removing member marks user_subscription as is_active = false
- Past payment history is retained

**Acceptance Criteria:**
- Remove is prevented if unpaid amounts exist (with override option)
- Confirmation dialog shows unpaid amount if any
- Successful removal removes member from active list
- Historical data is preserved

#### F4.3: Update Member Amount (Individual Split)

**Requirements:**
- For "Individual" payment type only
- Owner can change member's payment amount
- Change applies to future payment cycles, not past
- Total of all member amounts can exceed or be less than subscription total

**Acceptance Criteria:**
- Owner can edit member amount inline or via dialog
- Amount must be > 0
- Change is saved and reflected immediately
- Next payment cycle uses new amount

---

### F5: Payment Tracking

#### F5.1: Create Payment Records

**Requirements:**
- Payment records are created per member per cycle (typically monthly)
- Payment record includes:
  - Member (user_subscription_id)
  - Amount (based on subscription payment type)
  - Expiry date (e.g., end of current month)
  - Status: is_paid = false by default
- Owner triggers payment creation (or automated job in future)

**Acceptance Criteria:**
- Owner can manually create payment records for all members
- Payment amount matches member's current subscription amount
- Expiry date is calculated correctly
- Payments appear in member payment history

#### F5.2: View Payment History

**Requirements:**
- **For Owner**: View all payments for all members of owned subscriptions
  - Filter by subscription, member, status (paid/unpaid), date range
  - Sort by date, amount, status
  - Export to CSV (future)
- **For Member**: View own payments across all subscriptions
  - Filter by subscription, status, date range

**Acceptance Criteria:**
- Payment history page shows relevant payments
- Filters work correctly
- Table is paginated (if many payments)
- Status is clearly indicated (paid in green, unpaid in red)
- Date formatting is consistent

#### F5.3: Mark Payment as Paid

**Requirements:**
- Owner can mark member payment as paid
- Sets is_paid = true and paid_on = current timestamp
- Confirmation dialog optional
- Cannot unmark once paid (prevents manipulation)

**Acceptance Criteria:**
- Owner sees "Mark as Paid" button for unpaid payments
- Clicking changes status immediately
- Paid_on timestamp is recorded
- Member sees updated status in their view
- Paid payments cannot be unmarked

#### F5.4: View Accumulated Pending

**Requirements:**
- Calculate accumulated unpaid amount per member:
  - Sum of all payments where is_paid = false
  - Group by member
  - Show months covered (e.g., "Jan 2026, Feb 2026, Mar 2026")
- Display in:
  - Subscription detail page (per subscription)
  - Pending report page (across all owned subscriptions)

**Acceptance Criteria:**
- Accumulated amount is calculated correctly
- Months list is formatted clearly
- Zero pending shows "All paid up" message
- Data refreshes after marking payment as paid

---

### F6: Invoice Management

#### F6.1: Generate Invoice

**Requirements:**
- Owner selects:
  - Subscription
  - Member (must have unpaid payments)
  - Which unpaid payments to include
- System generates invoice with:
  - Unique invoice ID
  - Subscription details
  - Member information (name, email, phone)
  - Amount breakdown by month
  - Total accumulated amount
  - Issue date
  - Status: "Generated"

**Acceptance Criteria:**
- Owner can access "Generate Invoice" from subscription detail or pending report
- Member list shows only members with unpaid amounts
- Owner can select specific months or "Select All"
- Invoice is created with all required information
- Invoice status is "Generated"
- Invoice appears in invoice list

#### F6.2: View Invoice

**Requirements:**
- Owner and recipient can view invoice details
- Display format:
  - Invoice header (Subscribly logo, invoice ID, date)
  - "Invoice To" section (member details)
  - "Invoice From" section (owner details)
  - Subscription information
  - Payment breakdown table (month, amount)
  - Total amount due (prominent)
  - Payment instructions (placeholder)
  - Footer (thank you message)
- Print-friendly layout (clean, no sidebar/nav)

**Acceptance Criteria:**
- Invoice page renders all information correctly
- Layout is print-ready (CSS print styles)
- Non-authorized users get 403 error
- Invoice ID is displayed prominently
- Date format is localized

#### F6.3: Send Invoice via Email

**Requirements:**
- Owner can send generated invoice to member via email
- Email includes:
  - Subject: "Invoice for [Subscription Name] - [Month(s)]"
  - Body: Professional email template with:
    - Greeting
    - Invoice summary
    - Total amount due
    - Link to view invoice online
    - Payment instructions
    - Owner contact information
  - Invoice PDF attachment (future)
- Sending updates invoice status to "Sent" and records sent_on timestamp

**Acceptance Criteria:**
- Send button is available for "Generated" invoices
- Clicking sends email successfully (or shows error)
- Email is sent to member's registered email address
- Invoice status updates to "Sent"
- Sent_on timestamp is recorded
- Member receives email (verified in testing)

#### F6.4: Mark Invoice as Paid

**Requirements:**
- Owner can mark invoice as paid after receiving payment
- Updates:
  - Invoice status to "Paid"
  - Paid_on timestamp
  - All associated payment records to is_paid = true
- Cannot be unmarked once paid

**Acceptance Criteria:**
- Owner sees "Mark as Paid" button for unpaid invoices
- Clicking updates invoice and payment statuses
- Paid_on timestamp is recorded
- Paid invoices show in different color/badge
- Accumulated pending amounts update accordingly

#### F6.5: Invoice List

**Requirements:**
- **For Owner**: View all invoices generated for owned subscriptions
  - Filter by subscription, member, status, date range
  - Sort by date, amount, status
- **For Member**: View invoices issued to them
  - Filter by subscription, status

**Acceptance Criteria:**
- Invoice list page shows relevant invoices
- Filters work correctly
- Table shows: invoice ID, subscription, member/owner, amount, status, date
- Clicking invoice opens detail view
- Status badges are color-coded

---

### F7: Reports

#### F7.1: Accumulated Pending Report

**Requirements:**
- Owner can view accumulated pending report for all owned subscriptions
- Display for each subscription:
  - Subscription name
  - Total pending amount
  - Member breakdown:
    - Member name, email, phone
    - Months unpaid (list)
    - Total accumulated amount
  - Quick actions: Generate Invoice, Contact Member
- Summary totals:
  - Total number of subscriptions with pending amounts
  - Total accumulated amount across all subscriptions

**Acceptance Criteria:**
- Report page shows all owned subscriptions
- Subscriptions with $0 pending can be hidden/shown via toggle
- Member breakdown is sortable by amount
- Totals are calculated correctly
- Report can be filtered by date range
- Export to CSV/PDF (future)

#### F7.2: Subscription Summary Report (Future)

**Requirements:**
- Show metrics per subscription:
  - Total revenue collected
  - Average payment time
  - Member retention rate
  - Pending vs paid ratio

---

### F8: Notifications (Future)

#### F8.1: Email Notifications

**Planned:**
- Payment due reminders (3 days before expiry)
- Payment overdue notifications
- Invoice generated notification
- Invoice sent notification
- Payment received confirmation
- New member added notification

#### F8.2: In-App Notifications

**Planned:**
- Bell icon with unread count
- Notification center with recent activities
- Mark as read/unread
- Notification preferences

---

### F9: Background Jobs (Future)

#### F9.1: Auto-Generate Invoices

**Requirements:**
- Run every 15 minutes (or configurable interval)
- Find all payments where:
  - expiry_date < now
  - is_paid = false
  - no existing invoice generated
- Auto-generate invoice for each expired payment
- Send invoice email automatically
- Log results for monitoring

#### F9.2: Payment Reminders

**Requirements:**
- Run daily
- Find payments expiring in 3 days
- Send reminder email to members
- Don't send if already reminded recently

---

## Non-Functional Requirements

### NFR1: Performance

- Page load time < 2 seconds
- API response time < 500ms (95th percentile)
- Database queries optimized with indexes
- Image assets optimized (WebP format, lazy loading)

### NFR2: Security

- All passwords hashed (Supabase handles this)
- Session tokens are HTTP-only cookies
- Row Level Security (RLS) enforced on all tables
- HTTPS only in production
- Input validation on client and server
- CSRF protection
- XSS prevention

### NFR3: Scalability

- Support up to 10,000 users (initial)
- Support up to 100,000 subscriptions
- Horizontal scaling capability via Supabase
- Database connection pooling

### NFR4: Availability

- 99.9% uptime SLA (via Vercel/Supabase)
- Graceful degradation if services unavailable
- Error boundaries prevent full app crashes

### NFR5: Usability

- Mobile responsive (works on phones, tablets, desktops)
- Accessible (WCAG 2.1 AA compliance)
- Support light/dark modes
- Consistent UI patterns throughout app
- Loading states for async operations
- Clear error messages

### NFR6: Maintainability

- TypeScript for type safety
- Component-based architecture
- Comprehensive comments for complex logic
- Consistent code style (ESLint, Prettier)
- Environment-based configuration
- Separation of concerns (services, components, types)

---

## User Stories

### As a subscription owner, I want to...

1. **US-O1**: Create a new subscription so members can split the cost
2. **US-O2**: Add members to my subscription so they can pay their share
3. **US-O3**: Set individual payment amounts so I can charge different amounts per member
4. **US-O4**: Mark payments as paid so I can track who has paid
5. **US-O5**: View which members have unpaid amounts so I can follow up
6. **US-O6**: Generate an invoice for unpaid amounts so I can formally request payment
7. **US-O7**: Send invoices via email so members receive professional payment requests
8. **US-O8**: View payment history so I can see all past transactions
9. **US-O9**: Remove members who consistently don't pay so I can maintain the subscription
10. **US-O10**: Edit subscription details so I can update price changes from the service

### As a subscription member, I want to...

1. **US-M1**: View subscriptions I'm a member of so I know what I need to pay
2. **US-M2**: See my payment amount clearly so I know how much I owe
3. **US-M3**: View my payment history so I can track what I've paid
4. **US-M4**: See invoices sent to me so I can make payments
5. **US-M5**: See the subscription owner's contact info so I can reach out if needed
6. **US-M6**: Leave a subscription if I no longer want to be a member
7. **US-M7**: Update my profile phone number so invoices have correct contact info

### As a user (general), I want to...

1. **US-U1**: Register an account so I can start using the platform
2. **US-U2**: Log in securely so my data is protected
3. **US-U3**: Update my profile information so my details are current
4. **US-U4**: Use the app on my phone so I can manage subscriptions on-the-go
5. **US-U5**: Switch between light and dark mode so I can use the app comfortably

---

## Acceptance Criteria Summary

### Must Have (MVP)

- User authentication (register, login, logout)
- Profile management
- Create/edit/delete subscriptions
- Add/remove members
- Equal and individual payment splits
- Create payment records
- Mark payments as paid
- View accumulated pending amounts
- Generate invoices
- Send invoices via email
- View subscription and payment history
- Responsive UI (mobile + desktop)

### Should Have (Phase 2)

- Background job for auto-invoice generation
- Email notifications for payment reminders
- Export reports to CSV/PDF
- In-app notification center
- Advanced filtering and sorting
- Payment integration (Stripe/PayPal)

### Could Have (Future)

- Multi-currency support
- Recurring payment automation
- Advanced analytics and reports
- Mobile app (Flutter)
- Social features (share subscription links)
- Subscription templates

### Won't Have (Out of Scope)

- Direct payment processing within the app (MVP uses external payment)
- Multi-language support (English only for MVP)
- Subscription discovery/marketplace
- Social login (OAuth with Google/Facebook)

---

## Test Scenarios

### Critical Path Tests

1. **Registration → Login → Create Subscription → Add Member → Generate Invoice → Send Invoice**
2. **Login as Member → View Subscribed Subscriptions → View Payment History**
3. **Owner Marks Payment as Paid → Verify Accumulated Pending Updates**
4. **Generate Invoice for Multiple Months → Send Email → Mark as Paid → Verify All Payments Updated**

### Edge Cases

1. Owner tries to add non-existent user as member
2. Owner tries to delete subscription with unpaid amounts
3. Member tries to access owner-only features (should get 403)
4. Expired session redirects to login
5. Network error during invoice generation
6. Email send failure handling
7. Multiple owners trying to edit same subscription concurrently

---

## Glossary

- **Owner**: User who creates a subscription (account holder)
- **Member**: User added to a subscription who pays their share
- **Payment Type**: Equal (split evenly) or Individual (custom amounts)
- **Payment Record**: Database record tracking a member's payment for one cycle
- **Payment Cycle**: Typically monthly period for which payment is due
- **Accumulated Pending**: Sum of all unpaid payment amounts for a member
- **Invoice**: Formal document requesting payment for unpaid amounts
- **RLS**: Row Level Security (Supabase feature for data access control)
- **RPC**: Remote Procedure Call (Supabase database functions)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | Development Team | Initial requirements document |

