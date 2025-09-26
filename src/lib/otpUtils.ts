import crypto from 'crypto';

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure random numbers
  const otp = crypto.randomInt(100000, 999999).toString().padStart(6, '0');
  return otp;
}

/**
 * Validate OTP format
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Generate OTP expiration time (10 minutes from now)
 */
export function getOTPExpirationTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Generate rate limiting key for OTP requests
 */
export function getRateLimitKey(email: string, type: 'send' | 'verify'): string {
  return `otp_${type}_${email}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input for OTP
 */
export function sanitizeOTP(otp: string): string {
  return otp.replace(/\D/g, '').slice(0, 6);
}

/**
 * Rate limiting constants
 */
export const OTP_RATE_LIMITS = {
  SEND_ATTEMPTS_PER_EMAIL: 3, // Maximum OTP send attempts per email per hour
  VERIFY_ATTEMPTS_PER_CODE: 3, // Maximum verification attempts per OTP code
  SEND_COOLDOWN_MINUTES: 1, // Minimum time between OTP sends
  HOURLY_RESET_MINUTES: 60, // Reset rate limits every hour
} as const;

/**
 * OTP configuration
 */
export const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,
  CODE_LENGTH: 6,
  MAX_ATTEMPTS: 3,
} as const;