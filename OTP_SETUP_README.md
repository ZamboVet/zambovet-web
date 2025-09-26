# 📧 OTP (One-Time Password) Verification System

This document provides setup instructions for the newly implemented OTP verification system for pet owner account creation in ZamboVet.

## 🎯 Overview

The OTP system adds an extra layer of security to the pet owner registration process by requiring email verification through a 6-digit code before account creation.

### Key Features:
- ✅ 6-digit OTP codes with 10-minute expiry
- ✅ Rate limiting (3 attempts per email per hour)
- ✅ Professional email templates
- ✅ Auto-submit on complete code entry
- ✅ Copy-paste support for OTP codes
- ✅ Resend functionality with cooldown
- ✅ Attempt tracking and security measures
- ✅ Responsive UI with accessibility features

## 🚀 Setup Instructions

### Step 1: Database Setup

Run the following SQL in your Supabase SQL Editor to create the OTP verification table:

```sql
-- Create OTP verification table for temporary storage of OTP codes
CREATE TABLE IF NOT EXISTS otp_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_data JSONB, -- Store temporary signup data
    CONSTRAINT otp_verification_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT otp_verification_code_check CHECK (otp_code ~ '^[0-9]{6}$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verification_email_otp ON otp_verification(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON otp_verification(expires_at);

-- Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verification 
    WHERE expires_at < NOW() 
    OR (is_verified = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies
ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own OTP records (this will be handled by API)
CREATE POLICY "Users can access their own OTP records" ON otp_verification
FOR ALL USING (FALSE); -- Disable direct access, only through API
```

### Step 2: Environment Variables

Add the following SMTP configuration to your `.env.local` file:

```env
# SMTP Configuration for OTP Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 3: Gmail Setup (Recommended)

If using Gmail for SMTP:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Other (Custom name)" 
   - Enter "ZamboVet OTP" as the name
   - Copy the generated 16-character password
   - Use this as your `SMTP_PASS` value (not your regular Gmail password)

### Step 4: Alternative SMTP Providers

#### Microsoft Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Custom SMTP Server:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🔧 Configuration Options

The OTP system can be configured by modifying the constants in `/src/lib/otpUtils.ts`:

```typescript
export const OTP_RATE_LIMITS = {
  SEND_ATTEMPTS_PER_EMAIL: 3, // Max OTP requests per hour
  VERIFY_ATTEMPTS_PER_CODE: 3, // Max verification attempts per code
  SEND_COOLDOWN_MINUTES: 1,   // Time between resend requests
  HOURLY_RESET_MINUTES: 60,   // Rate limit reset period
};

export const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,  // OTP expiration time
  CODE_LENGTH: 6,      // Length of OTP code
  MAX_ATTEMPTS: 3,     // Max verification attempts
};
```

## 🎨 User Flow

1. **User Signup**: User fills out the pet owner signup form
2. **OTP Request**: System sends 6-digit code to user's email
3. **Email Verification**: User receives professional email with OTP code
4. **Code Entry**: User enters the 6-digit code in the verification screen
5. **Verification**: System validates the code and creates the account
6. **Account Creation**: User is logged in and redirected to dashboard

## 📧 Email Template

The system sends professional emails with:
- ZamboVet branding
- Clear 6-digit code display
- Expiration time information
- Security disclaimer
- Mobile-friendly HTML design

## 🛡️ Security Features

- **Rate Limiting**: Prevents spam and abuse
- **Attempt Tracking**: Limits verification attempts per code
- **Expiration**: Codes expire after 10 minutes
- **Input Sanitization**: All inputs are validated and sanitized
- **Secure Generation**: Uses cryptographically secure random number generation
- **Database Cleanup**: Expired codes are automatically cleaned up

## 🧪 Testing

### Manual Testing Steps:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to signup**: Go to `/signup` in your browser

3. **Select Pet Owner**: Choose "Pet Owner" as the account type

4. **Fill out the form**: Complete all required fields

5. **Submit form**: Click "Create Account" to trigger OTP sending

6. **Check email**: Look for the OTP verification email

7. **Enter OTP**: Input the 6-digit code in the verification screen

8. **Verify account**: Confirm account creation and login

### Test Cases to Verify:

- ✅ Valid OTP code acceptance
- ✅ Invalid OTP code rejection
- ✅ OTP expiration handling
- ✅ Rate limiting enforcement
- ✅ Resend functionality
- ✅ Email delivery
- ✅ Account creation on successful verification
- ✅ Error handling for SMTP failures
- ✅ UI responsiveness and accessibility

## 🐛 Troubleshooting

### Common Issues:

**1. "Failed to send verification email"**
- Check SMTP credentials in `.env.local`
- Verify Gmail App Password is correct
- Ensure 2FA is enabled for Gmail

**2. "Network error. Please try again."**
- Check internet connection
- Verify Supabase connection
- Check browser console for detailed errors

**3. "Too many OTP requests"**
- Wait for rate limit reset (1 hour)
- Try with a different email address

**4. "OTP has expired"**
- Request a new OTP code
- Codes expire after 10 minutes

**5. Database errors**
- Ensure the OTP verification table is created
- Check Supabase permissions
- Verify RLS policies are correctly set

### Debug Logs:

Check the browser console and server logs for detailed error messages:
- API endpoint responses
- SMTP connection status
- Database query results
- Validation errors

## 📝 API Endpoints

### Send OTP
- **POST** `/api/auth/send-otp`
- **Body**: `{ email: string, userData: object }`
- **Response**: Success/error with rate limit info

### Verify OTP  
- **POST** `/api/auth/verify-otp`
- **Body**: `{ email: string, otpCode: string }`
- **Response**: Success with user data or error with remaining attempts

## 🔧 Maintenance

### Scheduled Cleanup:
Consider setting up a cron job to regularly clean expired OTP codes:

```sql
SELECT cleanup_expired_otp_codes();
```

### Monitoring:
Monitor these metrics:
- OTP success/failure rates
- Email delivery rates
- Rate limit triggers
- Database table size

## 🎉 Success!

Once configured correctly, your pet owner signup process will now include secure email verification. Users will receive professional-looking emails with verification codes and enjoy a smooth, secure registration experience.

---

For additional support or questions, please check the application logs or contact the development team.