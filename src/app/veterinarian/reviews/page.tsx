'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import {
  StarIcon,
  ChartBarIcon,
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  pet_owner_profiles: {
    full_name: string;
    profile_picture_url?: string;
  };
  patients: {
    name: string;
    species: string;
  };
  services: {
    name: string;
  };
}

export default function VeterinarianReviews() {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(0);
  const [vetProfile, setVetProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchVeterinarianData();
    }
  }, [user]);

  const fetchVeterinarianData = async () => {
    try {
      setLoading(true);
      
      // First get veterinarian profile
      const { data: vetData, error: vetError } = await supabase
        .from('veterinarians')
        .select('id, full_name, specialization, average_rating')
        .eq('user_id', user?.id)
        .single();
        
      if (vetError || !vetData) {
        console.log('Veterinarian profile not found, using development mock data');
        // Use mock data for development
        setVetProfile({
          id: 'mock-vet-id',
          full_name: userProfile?.full_name || 'Dr. Developer',
          specialization: 'General Practice',
          average_rating: 4.5
        });
        setAverageRating(4.5);
        setTotalReviews(0);
        setSatisfactionRate(95);
        setLoading(false);
        return;
      }
      
      setVetProfile(vetData);
      
      // Fetch reviews for this veterinarian
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          pet_owner_profiles (
            full_name,
            profile_picture_url
          ),
          patients (
            name,
            species
          ),
          services (
            name
          )
        `)
        .eq('veterinarian_id', vetData.id)
        .order('created_at', { ascending: false });
        
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setReviews([]);
      } else {
        setReviews(reviewsData || []);
        
        // Calculate statistics
        const validReviews = reviewsData?.filter(r => r.rating != null) || [];
        const totalCount = validReviews.length;
        
        if (totalCount > 0) {
          const avgRating = validReviews.reduce((sum, review) => sum + review.rating, 0) / totalCount;
          const satisfaction = (validReviews.filter(r => r.rating >= 4).length / totalCount) * 100;
          
          setAverageRating(Number(avgRating.toFixed(1)));
          setTotalReviews(totalCount);
          setSatisfactionRate(Math.round(satisfaction));
        } else {
          setAverageRating(0);
          setTotalReviews(0);
          setSatisfactionRate(0);
        }
      }
      
    } catch (error) {
      console.error('Error fetching veterinarian data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`w-5 h-5 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <ProtectedRoute requiredRole="veterinarian">
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Patient Reviews</h1>
                  <p className="text-slate-600 mt-2">View patient feedback</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <StarIconSolid className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
                    <p className="text-sm text-slate-600">Average Rating</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{totalReviews}</p>
                    <p className="text-sm text-slate-600">Total Reviews</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaceSmileIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{satisfactionRate}%</p>
                    <p className="text-sm text-slate-600">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-8">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ChatBubbleLeftRightIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">No Reviews Yet</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                      You haven't received any patient reviews yet. Reviews will appear here once patients start providing feedback about their appointments with you.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                      <p className="text-blue-800 font-medium text-sm">💡 Pro Tip</p>
                      <p className="text-blue-700 text-xs mt-1">Provide excellent care to encourage positive reviews from your patients!</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Reviews Header */}
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Patient Reviews ({totalReviews})</h3>
                        <p className="text-slate-600 text-sm mt-1">Recent feedback from your patients</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(averageRating)
                                  ? 'text-yellow-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="divide-y divide-slate-200">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {review.pet_owner_profiles?.profile_picture_url ? (
                              <img
                                src={review.pet_owner_profiles.profile_picture_url}
                                alt={review.pet_owner_profiles.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserCircleIcon className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Review Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {review.pet_owner_profiles?.full_name || 'Anonymous'}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-slate-500">
                                  <span>Patient: {review.patients?.name || 'Unknown'}</span>
                                  <span>•</span>
                                  <span>{review.patients?.species || 'Unknown Species'}</span>
                                  {review.services?.name && (
                                    <>
                                      <span>•</span>
                                      <span>{review.services.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <StarIconSolid
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-slate-500">
                                  {new Date(review.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Review Comment */}
                            {review.comment && (
                              <div className="mt-3">
                                <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                              </div>
                            )}

                            {/* Review Actions */}
                            <div className="mt-4 flex items-center space-x-4">
                              <button className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                <HandThumbUpIcon className="w-4 h-4" />
                                <span>Helpful</span>
                              </button>
                              <button className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                <span>Respond</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More */}
                  {reviews.length >= 10 && (
                    <div className="p-6 text-center border-t border-slate-200">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Load More Reviews
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}