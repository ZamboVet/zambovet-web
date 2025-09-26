'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  EnvelopeIcon, 
  ClockIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: (userData: any) => void;
  onBack: () => void;
  userData: any;
}

export default function OTPVerification({ 
  email, 
  onVerificationSuccess, 
  onBack, 
  userData 
}: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Only allow single digits
    
    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtpCode.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtpCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtpCode = pastedData.split('');
      setOtpCode(newOtpCode);
      setError('');
      handleVerifyOTP(pastedData);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (code?: string) => {
    const codeToVerify = code || otpCode.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otpCode: codeToVerify
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Account created successfully!');
        setTimeout(() => {
          onVerificationSuccess(result.user);
        }, 1500);
      } else {
        setError(result.error || 'Invalid verification code');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        // Clear OTP fields for retry
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('New verification code sent to your email!');
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setRemainingAttempts(3); // Reset attempts
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-full flex items-center justify-center mx-auto mb-4">
          <EnvelopeIcon className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-[#0032A0] mb-2">
          Verify Your Email
        </h2>
        
        <p className="text-gray-600 mb-4">
          We've sent a 6-digit verification code to
        </p>
        
        <p className="text-[#0032A0] font-semibold mb-6">
          {email}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 text-sm">{error}</p>
            {remainingAttempts > 0 && (
              <p className="text-red-600 text-xs mt-1">
                {remainingAttempts} attempts remaining
              </p>
            )}
          </div>
        </div>
      )}

      {/* OTP Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
          Enter 6-Digit Code
        </label>
        
        <div className="flex justify-center space-x-3">
          {otpCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-colors"
              disabled={isVerifying}
            />
          ))}
        </div>
      </div>

      {/* Timer and Resend */}
      <div className="mb-6 text-center">
        {!canResend ? (
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span className="text-sm">
              Code expires in {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={isResending}
            className="flex items-center justify-center space-x-2 mx-auto text-[#0032A0] hover:text-[#002080] font-medium text-sm transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleVerifyOTP()}
          disabled={isVerifying || otpCode.some(digit => digit === '')}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#0032A0] to-[#0053d6] text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Code</span>
          )}
        </button>

        <button
          onClick={onBack}
          disabled={isVerifying}
          className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back to Sign Up
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Didn't receive the code? Check your spam folder or try resending.</p>
      </div>
    </div>
  );
}