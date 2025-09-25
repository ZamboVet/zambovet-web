import nodemailer from 'nodemailer';

// Email templates
const EMAIL_TEMPLATES = {
  VET_REGISTRATION_PENDING: {
    subject: 'Veterinarian Registration - Pending Verification',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0032A0; color: white; padding: 20px; text-align: center;">
          <h1>ZamboVet - Registration Submitted</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2>Hello Dr. ${data.fullName},</h2>
          <p>Thank you for registering as a veterinarian with ZamboVet.</p>
          <p>Your application has been received and is currently under review by our administrative team.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Application Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Name:</strong> ${data.fullName}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>License Number:</strong> ${data.licenseNumber}</li>
              <li><strong>Specialization:</strong> ${data.specialization || 'General Practice'}</li>
              <li><strong>Status:</strong> Pending Verification</li>
            </ul>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will review your documents (Business Permit and Government ID)</li>
            <li>Verification typically takes 2-3 business days</li>
            <li>You will receive an email notification once your application is approved or if additional information is needed</li>
            <li>Once approved, you can log in and start managing your veterinary services</li>
          </ul>
          
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The ZamboVet Team</p>
        </div>
        <div style="background-color: #e9e9e9; padding: 15px; text-align: center; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  },

  VET_APPROVED: {
    subject: 'Welcome to ZamboVet - Your Account Has Been Approved!',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1>🎉 Welcome to ZamboVet!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2>Congratulations Dr. ${data.fullName}!</h2>
          <p>Your veterinarian account has been <strong>approved</strong> and is now active.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3>✅ Your Application Status: APPROVED</h3>
            <p><strong>Reviewed by:</strong> ZamboVet Admin Team</p>
            <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${data.adminRemarks ? `<p><strong>Admin Notes:</strong> ${data.adminRemarks}</p>` : ''}
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚀 Getting Started:</h3>
            <ol>
              <li>Log in to your ZamboVet account</li>
              <li>Complete your veterinary profile setup</li>
              <li>Set your clinic information and location</li>
              <li>Configure your consultation fees and availability</li>
              <li>Start accepting appointment requests from pet owners</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
               style="background-color: #0032A0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Log In to Your Account
            </a>
          </div>
          
          <p>Thank you for joining our network of trusted veterinary professionals.</p>
          <p>Best regards,<br>The ZamboVet Team</p>
        </div>
        <div style="background-color: #e9e9e9; padding: 15px; text-align: center; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  },

  VET_REJECTED: {
    subject: 'ZamboVet Registration - Additional Information Required',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>ZamboVet Registration Update</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2>Hello Dr. ${data.fullName},</h2>
          <p>Thank you for your interest in joining ZamboVet as a veterinary professional.</p>
          <p>After reviewing your application, we need additional information or corrections before we can approve your account.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3>⚠️ Application Status: Requires Attention</h3>
            <p><strong>Reviewed by:</strong> ZamboVet Admin Team</p>
            <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <h4>Admin Remarks:</h4>
              <p>${data.adminRemarks}</p>
            </div>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📝 Next Steps:</h3>
            <ol>
              <li>Review the feedback provided above</li>
              <li>Prepare the required documents or corrections</li>
              <li>Submit a new application with the updated information</li>
              <li>Our team will review your resubmission within 2-3 business days</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup" 
               style="background-color: #0032A0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Submit New Application
            </a>
          </div>
          
          <p>If you have any questions about the requirements, please contact our support team.</p>
          <p>We look forward to having you join our network once the requirements are met.</p>
          <p>Best regards,<br>The ZamboVet Team</p>
        </div>
        <div style="background-color: #e9e9e9; padding: 15px; text-align: center; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  },

  ADMIN_NEW_VET_REGISTRATION: {
    subject: 'New Veterinarian Registration - Review Required',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0032A0; color: white; padding: 20px; text-align: center;">
          <h1>🔔 New Veterinarian Registration</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2>New Veterinarian Application Submitted</h2>
          <p>A new veterinarian has registered and requires verification review.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Application Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Name:</strong> Dr. ${data.fullName}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Phone:</strong> ${data.phone}</li>
              <li><strong>License Number:</strong> ${data.licenseNumber}</li>
              <li><strong>Specialization:</strong> ${data.specialization || 'General Practice'}</li>
              <li><strong>Years of Experience:</strong> ${data.yearsExperience}</li>
              <li><strong>Consultation Fee:</strong> $${data.consultationFee}</li>
              <li><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>📋 Documents Uploaded:</h4>
            <ul>
              <li>✅ Business Permit</li>
              <li>✅ Government ID</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/verifications" 
               style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Review Application
            </a>
          </div>
          
          <p><strong>Action Required:</strong> Please review the submitted documents and approve or reject the application.</p>
          <p>This is an automated notification from the ZamboVet Admin System.</p>
        </div>
      </div>
    `
  }
};

// Create email transporter (configure based on your email service)
function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendNotification(type: keyof typeof EMAIL_TEMPLATES, to: string, data: any) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured - skipping notification');
      return { success: false, error: 'Email not configured' };
    }

    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown email template: ${type}`);
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ZamboVet" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html(data)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: (error as Error).message };
  }
}

// SMS notification function (placeholder for future implementation)
export async function sendSMS(phone: string, message: string) {
  try {
    // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
    console.log('SMS notification (not implemented):', { phone, message });
    
    return { success: false, error: 'SMS service not implemented' };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify OTP (basic implementation - in production, use a proper OTP service)
export function verifyOTP(provided: string, expected: string): boolean {
  return provided === expected;
}

export const NotificationTypes = {
  VET_REGISTRATION_PENDING: 'VET_REGISTRATION_PENDING' as const,
  VET_APPROVED: 'VET_APPROVED' as const,
  VET_REJECTED: 'VET_REJECTED' as const,
  ADMIN_NEW_VET_REGISTRATION: 'ADMIN_NEW_VET_REGISTRATION' as const
};
