# Email Configuration Setup Guide

This guide explains how to configure the email system in Subscribly for sending invoices and notifications.

## Environment Variables

Add the following to your `.env` file:

```env
# Required: Encryption key for storing sensitive email credentials in database
# Must be exactly 32 characters or will be padded/truncated automatically
# Change this to a secure random string in production
SETTINGS_ENCRYPTION_KEY=your-32-character-secret-key-here-change-me-in-prod

# Optional: Database URL (if not already set)
DATABASE_URL=postgresql://username:password@localhost:5432/subscribly
```

## Supported Email Providers

### 1. Gmail SMTP

**Pros:**
- Free for personal use
- Reliable delivery
- Uses your existing Gmail account

**Setup Steps:**

1. Enable 2-factor authentication on your Google account
   - Go to: https://myaccount.google.com/security

2. Generate an App Password
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the 16-character password

3. Configure in Subscribly
   - Navigate to: Admin > Settings > Email Configuration
   - Select "Gmail SMTP"
   - Enter your settings:
     - SMTP Host: `smtp.gmail.com`
     - SMTP Port: `587`
     - Username: Your Gmail address
     - App Password: The 16-character password from step 2
     - From Email: Your Gmail address
     - From Name: `Subscribly` (or your preferred name)

4. Test the configuration before saving

**Limitations:**
- Gmail has sending limits (500 emails/day for personal accounts)
- Requires app password setup

### 2. Resend

**Pros:**
- Modern, developer-friendly API
- Generous free tier (100 emails/day, 3,000/month)
- Better deliverability for transactional emails
- No app password needed

**Setup Steps:**

1. Sign up for a Resend account
   - Go to: https://resend.com
   - Create a free account

2. Verify your domain (or use resend.dev for testing)
   - Follow Resend's domain verification process
   - For testing, you can use `onboarding@resend.dev`

3. Generate an API key
   - Go to: https://resend.com/api-keys
   - Create a new API key
   - Copy the key (starts with `re_`)

4. Configure in Subscribly
   - Navigate to: Admin > Settings > Email Configuration
   - Select "Resend"
   - Enter your settings:
     - API Key: Your Resend API key
     - From Email: Your verified email (e.g., `noreply@yourdomain.com`)
     - From Name: `Subscribly` (or your preferred name)

5. Test the configuration before saving

**Limitations:**
- Free tier: 100 emails/day, 3,000/month
- Requires domain verification for production use

## Invoice Generation Features

### Bulk Invoice Generation

Generate invoices for all users with unpaid payments:

1. Navigate to: Invoices page
2. Click "Generate All Invoices" to create invoices without sending
3. Click "Generate & Email All" to create and immediately send invoices

### Individual Invoice Generation

Generate an invoice for a specific user:

1. Navigate to: Invoices page
2. Click "Generate for User"
3. Select a user from the list of users with unpaid payments
4. Choose "Generate" (without email) or "Generate & Email"

## Troubleshooting

### "Email not configured" error

Make sure you:
1. Added `SETTINGS_ENCRYPTION_KEY` to your `.env` file
2. Configured email settings in Admin > Settings
3. Tested the configuration successfully
4. Saved the settings

### Gmail authentication failed

- Verify 2FA is enabled on your Google account
- Double-check the app password (no spaces)
- Ensure you're using `smtp.gmail.com` and port `587`
- Try regenerating the app password

### Resend API key invalid

- Verify the API key starts with `re_`
- Check that the API key hasn't been revoked
- Ensure your account is active
- Try creating a new API key

### Test email not received

- Check spam/junk folders
- Verify the "From Email" matches your verified domain (Resend)
- For Gmail, ensure the username and from email match
- Check the email service's sending logs

## Security Notes

1. **Encryption Key:** The `SETTINGS_ENCRYPTION_KEY` is used to encrypt passwords and API keys stored in the database. Keep this key secure and never commit it to version control.

2. **Database Security:** Email credentials are encrypted in the database, but the encryption is basic. For production systems handling sensitive data, consider using dedicated secret management services (AWS Secrets Manager, HashiCorp Vault, etc.).

3. **Access Control:** Only SUPER_ADMIN users can access and modify email settings.

## Adding More Email Providers

The system is designed to be extensible. To add a new provider:

1. Update `EmailService` in `src/lib/services/email-service.ts`
2. Add provider-specific configuration to `SettingsService`
3. Update the settings UI in `src/app/(dashboard)/admin/settings/page.tsx`
4. Add the provider to the test email endpoint

## API Endpoints

- `POST /api/admin/settings` - Save settings
- `GET /api/admin/settings?category=email` - Get email settings
- `POST /api/admin/settings/test-email` - Test email configuration
- `POST /api/invoices/generate-for-user` - Generate invoice for specific user
- `POST /api/invoices/generate-all` - Generate invoices for all users
- `POST /api/invoices/[id]/send` - Send existing invoice
- `GET /api/users/with-unpaid-payments` - Get users with unpaid payments
