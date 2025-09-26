'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  XMarkIcon,
  StarIcon,
  PaperAirplaneIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    veterinarian_id: string;
    patient_id: string;
    service_id?: string;
    veterinarians?: {
      full_name: string;
      specialization: string;
    };
    patients?: {
      name: string;
      species: string;
    };
    services?: {
      name: string;
    };
  };
  onReviewSubmitted?: () => void;
}

export default function ReviewSubmissionModal({
  isOpen,
  onClose,
  appointment,
  onReviewSubmitted
}: ReviewSubmissionModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !appointment || rating === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get pet owner profile
      const { data: petOwnerProfile } = await supabase
        .from('pet_owner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!petOwnerProfile) {
        throw new Error('Pet owner profile not found');
      }

      const reviewData = {
        veterinarian_id: appointment.veterinarian_id,
        pet_owner_id: petOwnerProfile.id,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        service_id: appointment.service_id || null,
        rating: rating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) {
        throw error;
      }

      // Update the appointment to mark as reviewed
      await supabase
        .from('appointments')
        .update({ 
          has_review: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      setShowSuccess(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
        onReviewSubmitted?.();
      }, 2000);

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {showSuccess ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your feedback. Your review helps other pet owners and improves our services.
            </p>
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <StarIconSolid
                  key={i}
                  className={`w-6 h-6 ${
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                🎉 Your {rating}-star review has been sent to Dr. {appointment.veterinarians?.full_name}
              </p>
            </div>
          </div>
        ) : (
          // Review Form
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Rate Your Experience</h3>
                    <p className="text-blue-100 text-sm">Share your feedback with Dr. {appointment.veterinarians?.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HeartIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.patients?.name}</h4>
                    <p className="text-sm text-gray-600">{appointment.patients?.species}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Veterinarian:</strong> Dr. {appointment.veterinarians?.full_name}</p>
                  {appointment.veterinarians?.specialization && (
                    <p><strong>Specialization:</strong> {appointment.veterinarians.specialization}</p>
                  )}
                  {appointment.services?.name && (
                    <p><strong>Service:</strong> {appointment.services.name}</p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  How would you rate your overall experience? *
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-2 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <StarIconSolid
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {hoveredRating > 0
                      ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoveredRating]
                      : rating > 0
                      ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]
                      : 'Click to rate'}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Share your experience (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 resize-none"
                  placeholder="Tell other pet owners about your experience. What did you like? How was the care for your pet?"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Your feedback helps other pet owners and improves our services</span>
                  <span>{comment.length}/500</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rating === 0 || isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}