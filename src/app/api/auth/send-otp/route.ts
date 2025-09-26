import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  generateOTP, 
  getOTPExpirationTime, 
  isValidEmail, 
  OTP_RATE_LIMITS 
} from '@/lib/otpUtils';
import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
  const key = `send_otp_${email}`;
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or rate limit window has reset
    rateLimitStore.set(key, { count: 1, resetTime: now + hourInMs });
    return { allowed: true, remainingAttempts: OTP_RATE_LIMITS.SEND_ATTEMPTS_PER_EMAIL - 1 };
  }
  
  if (existing.count >= OTP_RATE_LIMITS.SEND_ATTEMPTS_PER_EMAIL) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      resetTime: existing.resetTime 
    };
  }
  
  existing.count += 1;
  rateLimitStore.set(key, existing);
  
  return { 
    allowed: true, 
    remainingAttempts: OTP_RATE_LIMITS.SEND_ATTEMPTS_PER_EMAIL - existing.count 
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userData } = body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!userData || typeof userData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'User data is required' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      const resetTime = new Date(rateCheck.resetTime!);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many OTP requests. Please try again later.',
          resetTime: resetTime.toISOString()
        },
        { status: 429 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpirationTime();

    // Clean up any existing OTP for this email
    await supabase
      .from('otp_verification')
      .delete()
      .eq('email', email);

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verification')
      .insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verification_data: userData,
        attempts: 0,
        is_verified: false
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Send email
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"ZamboVet" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your ZamboVet Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #0032A0, #0053d6); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px;">🐾</span>
              </div>
              <h1 style="color: #0032A0; margin: 0;">ZamboVet</h1>
            </div>
            
            <div style="background: #f8f9ff; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #0032A0; margin-top: 0;">Verify Your Account</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Welcome to ZamboVet! Please use the verification code below to complete your account setup:
              </p>
              
              <div style="background: white; border: 2px solid #0032A0; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; color: #0032A0; letter-spacing: 8px;">${otpCode}</span>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This code will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>If you didn't request this verification code, please ignore this email.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
        text: `
Welcome to ZamboVet!

Your verification code is: ${otpCode}

This code will expire in 10 minutes for security reasons.

If you didn't request this verification code, please ignore this email.
        `.trim()
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        email: email,
        expiresAt: expiresAt.toISOString(),
        remainingAttempts: rateCheck.remainingAttempts
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clean up the OTP record if email failed
      await supabase
        .from('otp_verification')
        .delete()
        .eq('email', email);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send verification email. Please check your email address and try again.' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}