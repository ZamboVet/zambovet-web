'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    PhotoIcon,
    CalendarDaysIcon,
    HeartIcon,
    BookOpenIcon,
    StarIcon,
    GiftIcon,
    AcademicCapIcon,
    CloudArrowUpIcon,
    TrashIcon,
    SparklesIcon,
    FaceSmileIcon,
    FaceFrownIcon,
    BoltIcon,
    MoonIcon,
    ExclamationTriangleIcon,
    HandThumbUpIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    profile_picture_url: string;
}

interface StoryEntry {
    id?: number;
    pet_id: number;
    entry_date: string;
    title: string;
    content: string;
    mood: string;
    activities: string[];
    photos: string[];
    entry_type: 'daily' | 'milestone' | 'vet_visit' | 'special';
    health_notes?: string;
    is_favorite: boolean;
}

interface StoryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    pet: Pet | null;
    entry?: StoryEntry | null;
    selectedDate?: Date;
}

export default function StoryEntryModal({ isOpen, onClose, onSave, pet, entry, selectedDate }: StoryEntryModalProps) {
    const [formData, setFormData] = useState<StoryEntry>({
        pet_id: pet?.id || 0,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        content: '',
        mood: 'happy',
        activities: [],
        photos: [],
        entry_type: 'daily',
        health_notes: '',
        is_favorite: false
    });

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const moodOptions = [
        { value: 'happy', label: 'Happy', icon: FaceSmileIcon, color: 'text-green-600 bg-green-100' },
        { value: 'playful', label: 'Playful', icon: BoltIcon, color: 'text-blue-600 bg-blue-100' },
        { value: 'calm', label: 'Calm', icon: MoonIcon, color: 'text-purple-600 bg-purple-100' },
        { value: 'excited', label: 'Excited', icon: SparklesIcon, color: 'text-yellow-600 bg-yellow-100' },
        { value: 'tired', label: 'Tired', icon: MoonIcon, color: 'text-gray-600 bg-gray-100' },
        { value: 'anxious', label: 'Anxious', icon: ExclamationTriangleIcon, color: 'text-orange-600 bg-orange-100' },
        { value: 'sad', label: 'Sad', icon: FaceFrownIcon, color: 'text-red-600 bg-red-100' },
        { value: 'content', label: 'Content', icon: HandThumbUpIcon, color: 'text-emerald-600 bg-emerald-100' }
    ];

    const entryTypeOptions = [
        { value: 'daily', label: 'Daily Entry', icon: BookOpenIcon, description: 'Regular day-to-day moments' },
        { value: 'milestone', label: 'Milestone', icon: StarIcon, description: 'Special achievements or firsts' },
        { value: 'special', label: 'Special Event', icon: GiftIcon, description: 'Birthdays, holidays, celebrations' },
        { value: 'vet_visit', label: 'Vet Visit', icon: AcademicCapIcon, description: 'Medical appointments and health' }
    ];

    const activitySuggestions = [
        'Morning Walk', 'Playtime', 'Training Session', 'Grooming', 'Bath Time',
        'New Toy', 'Treats', 'Nap Time', 'Park Visit', 'Car Ride',
        'Meeting Friends', 'Learning Tricks', 'Outdoor Adventure', 'Cuddles', 'Photo Session'
    ];

    useEffect(() => {
        if (isOpen) {
            if (entry) {
                // Load existing entry for editing
                setFormData({
                    ...entry,
                    pet_id: pet?.id || entry.pet_id
                });
            } else {
                // Reset for new entry
                const today = new Date();
                setFormData({
                    pet_id: pet?.id || 0,
                    entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
                    title: '',
                    content: '',
                    mood: 'happy',
                    activities: [],
                    photos: [],
                    entry_type: 'daily',
                    health_notes: '',
                    is_favorite: false
                });
            }
            setSelectedPhotos([]);
        }
    }, [isOpen, entry, selectedDate, pet]);

    const handleInputChange = (field: keyof StoryEntry, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleActivityToggle = (activity: string) => {
        setFormData(prev => ({
            ...prev,
            activities: prev.activities.includes(activity)
                ? prev.activities.filter(a => a !== activity)
                : [...prev.activities, activity]
        }));
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const validFiles = files.filter(file => {
                // Check file type
                if (!file.type.startsWith('image/')) {
                    alert(`${file.name} is not an image file`);
                    return false;
                }
                
                // Check file size (2MB limit for better performance)
                if (file.size > 2 * 1024 * 1024) {
                    alert(`${file.name} is too large. Maximum size is 2MB for better performance.`);
                    return false;
                }
                
                // Check for common image formats
                const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!supportedTypes.includes(file.type)) {
                    alert(`${file.name} format not supported. Please use JPEG, PNG, GIF, or WebP.`);
                    return false;
                }
                
                return true;
            });
            
            const totalPhotos = selectedPhotos.length + validFiles.length;
            if (totalPhotos > 6) {
                alert(`You can only add ${6 - selectedPhotos.length} more photos (6 maximum).`);
                setSelectedPhotos(prev => [...prev, ...validFiles].slice(0, 6));
            } else {
                setSelectedPhotos(prev => [...prev, ...validFiles]);
            }
        }
        
        // Clear the input so the same file can be selected again if needed
        e.target.value = '';
    };

    const removePhoto = (index: number, isExisting: boolean = false) => {
        if (isExisting) {
            setFormData(prev => ({
                ...prev,
                photos: prev.photos.filter((_, i) => i !== index)
            }));
        } else {
            setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
        }
    };

    const uploadPhotos = async (): Promise<string[]> => {
        if (selectedPhotos.length === 0) return formData.photos;

        setPhotoUploading(true);
        const uploadedUrls: string[] = [...formData.photos];

        try {
            for (const photo of selectedPhotos) {
                // Skip files that are too large (over 5MB)
                if (photo.size > 5 * 1024 * 1024) {
                    console.warn(`Skipping large photo: ${photo.name} (${(photo.size / 1024 / 1024).toFixed(1)}MB)`);
                    continue;
                }

                const fileExt = photo.name.split('.').pop();
                const fileName = `story-${formData.pet_id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `story-photos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('pet-images')
                    .upload(filePath, photo);

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    continue;
                }

                const { data } = supabase.storage
                    .from('pet-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(data.publicUrl);
            }
        } catch (error) {
            console.error('Error uploading photos:', error);
        } finally {
            setPhotoUploading(false);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent, skipPhotos = false) => {
        e.preventDefault();
        
        if (!pet || !formData.title.trim()) {
            alert('Please enter a title for your story');
            return;
        }

        setLoading(true);
        try {
            // Upload photos first (unless skipping for speed)
            const photoUrls = skipPhotos ? formData.photos : await uploadPhotos();

            // Prepare story data for diary entry format
            const entryData = {
                patient_id: formData.pet_id,
                entry_date: formData.entry_date,
                title: formData.title.trim(),
                content: formData.content.trim() || null,
                mood: formData.mood,
                entry_type: formData.entry_type,
                activities: formData.activities,
                is_favorite: formData.is_favorite,
                is_vet_visit_related: formData.entry_type === 'vet_visit',
                health_observations: formData.health_notes?.trim() || null,
                photos: photoUrls.length > 0 ? photoUrls : null
            };

            // Add timeout protection
            const savePromise = entry?.id 
                ? supabase
                    .from('pet_diary_entries')
                    .update({ ...entryData, updated_at: new Date().toISOString() })
                    .eq('id', entry.id)
                    .select()
                : supabase
                    .from('pet_diary_entries')
                    .insert(entryData)
                    .select();
            
            // Set 10 second timeout
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Save operation timed out')), 10000)
            );
            
            const result = await Promise.race([savePromise, timeoutPromise]) as any;

            if (result.error) {
                throw result.error;
            }

            console.log('Story entry saved successfully:', result.data);
            onSave();
            onClose();
            
            // Show success message
            const successMessage = skipPhotos && selectedPhotos.length > 0 
                ? 'Story saved! Photos were skipped for faster save.' 
                : 'Story saved successfully!';
            alert(successMessage);
        } catch (error) {
            console.error('Error saving story entry:', error);
            alert('Error saving story. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !pet) return null;

    const selectedMood = moodOptions.find(m => m.value === formData.mood);
    const selectedType = entryTypeOptions.find(t => t.value === formData.entry_type);

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 border-2 border-white/50">
                                {pet.profile_picture_url ? (
                                    <img
                                        src={pet.profile_picture_url}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <HeartIcon className="w-6 h-6 text-white m-3" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {entry ? 'Edit Story' : 'New Story Chapter'}
                                </h2>
                                <p className="text-white/80">Recording {pet.name}'s story</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <div className="relative">
                                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.entry_date}
                                    onChange={(e) => handleInputChange('entry_date', e.target.value)}
                                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Story Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="What happened today?"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Entry Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Story Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {entryTypeOptions.map(type => {
                                const IconComponent = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleInputChange('entry_type', type.value)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                                            formData.entry_type === type.value
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComponent className={`w-6 h-6 mb-2 ${
                                            formData.entry_type === type.value ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                        <div className={`font-medium text-sm ${
                                            formData.entry_type === type.value ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                            {type.label}
                                        </div>
                                        <div className={`text-xs ${
                                            formData.entry_type === type.value ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                            {type.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mood Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            How was {pet.name} feeling?
                        </label>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                            {moodOptions.map(mood => {
                                const IconComponent = mood.icon;
                                return (
                                    <button
                                        key={mood.value}
                                        type="button"
                                        onClick={() => handleInputChange('mood', mood.value)}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            formData.mood === mood.value
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            formData.mood === mood.value ? mood.color : 'bg-gray-100'
                                        }`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <span className={`text-xs font-medium ${
                                            formData.mood === mood.value ? 'text-blue-900' : 'text-gray-700'
                                        }`}>
                                            {mood.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Story Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tell the Story</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            placeholder={`What did ${pet.name} do today? Share the special moments, funny behaviors, or just a typical day...`}
                            rows={6}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Activities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Activities & Highlights</label>
                        <div className="flex flex-wrap gap-2">
                            {activitySuggestions.map(activity => (
                                <button
                                    key={activity}
                                    type="button"
                                    onClick={() => handleActivityToggle(activity)}
                                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                        formData.activities.includes(activity)
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {activity}
                                    {formData.activities.includes(activity) && (
                                        <span className="ml-1 text-blue-500">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Health Notes */}
                    {formData.entry_type === 'vet_visit' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Health Notes</label>
                            <textarea
                                value={formData.health_notes}
                                onChange={(e) => handleInputChange('health_notes', e.target.value)}
                                placeholder="Any health observations, treatments, or vet recommendations..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}

                    {/* Photos */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Photos</label>
                            <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                <CloudArrowUpIcon className="w-4 h-4" />
                                Add Photos
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {selectedPhotos.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    📸 {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} ready to upload! 
                                    {selectedPhotos.some(photo => photo.size > 2 * 1024 * 1024) && (
                                        <span className="block mt-1">⚡ Large photos may take time to upload.</span>
                                    )}
                                </p>
                            </div>
                        )}
                        
                        {(selectedPhotos.length > 0 || formData.photos.length > 0) && (
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                {/* Existing photos */}
                                {formData.photos.map((photo, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={photo}
                                            alt={`Photo ${index + 1}`}
                                            className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index, true)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* New photos */}
                                {selectedPhotos.map((photo, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`New photo ${index + 1}`}
                                            className="w-full aspect-square object-cover rounded-lg border border-blue-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index, false)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Favorite Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <input
                            type="checkbox"
                            id="favorite"
                            checked={formData.is_favorite}
                            onChange={(e) => handleInputChange('is_favorite', e.target.checked)}
                            className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <label htmlFor="favorite" className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                            <StarIcon className="w-4 h-4" />
                            Mark as favorite memory
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            disabled={loading || photoUploading}
                        >
                            Cancel
                        </button>
                        
                        <div className="flex items-center space-x-3">
                            {selectedPhotos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-colors"
                                    disabled={loading || photoUploading}
                                >
                                    {loading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                    <span>Quick Save (No Photos)</span>
                                </button>
                            )}
                            
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-all shadow-sm hover:shadow-md"
                                disabled={loading || photoUploading}
                            >
                                {(loading || photoUploading) && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                <span>
                                    {entry ? 'Update Story' : 'Save Story'}
                                    {selectedPhotos.length > 0 && !loading && ' with Photos'}
                                </span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}