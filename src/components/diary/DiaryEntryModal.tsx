'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    CalendarDaysIcon,
    HeartIcon,
    ChatBubbleBottomCenterTextIcon,
    EyeIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface DiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    selectedPetId: number;
    petOwnerId: number;
    entry?: any; // For editing existing entries
    selectedDate?: Date;
    pets?: Array<{ id: number; name: string; species: string; breed?: string; profile_picture_url?: string }>;
}


export default function DiaryEntryModal({
    isOpen,
    onClose,
    onSave,
    selectedPetId,
    petOwnerId,
    entry,
    selectedDate,
    pets = []
}: DiaryEntryModalProps) {
    const [formData, setFormData] = useState({
        entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        title: '',
        content: '',
        mood: '',
        activity_level: '',
        appetite: '',
        behavior_notes: '',
        health_observations: '',
        symptoms: '',
        is_vet_visit_related: false,
        tags: [] as string[],
        photos: [] as string[]
    });

    const [currentSelectedPetId, setCurrentSelectedPetId] = useState(selectedPetId);


    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);

    // Form options
    const moodOptions = [
        { value: 'happy', label: 'Happy' },
        { value: 'playful', label: 'Playful' },
        { value: 'calm', label: 'Calm' },
        { value: 'excited', label: 'Excited' },
        { value: 'normal', label: 'Normal' },
        { value: 'tired', label: 'Tired' },
        { value: 'anxious', label: 'Anxious' },
        { value: 'sad', label: 'Sad' }
    ];

    const activityOptions = [
        { value: 'very_active', label: 'Very Active' },
        { value: 'high', label: 'High' },
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Low' },
        { value: 'lethargic', label: 'Lethargic' }
    ];

    const appetiteOptions = [
        { value: 'normal', label: 'Normal' },
        { value: 'increased', label: 'Increased' },
        { value: 'decreased', label: 'Decreased' },
        { value: 'picky', label: 'Picky' },
        { value: 'no_appetite', label: 'No Appetite' }
    ];

    const commonTags = [
        'health', 'medication', 'feeding', 'exercise', 'mood', 'symptom',
        'vet-visit', 'behavior', 'weight', 'temperature', 'activity', 'grooming',
        'sleep', 'play', 'training', 'social', 'anxiety', 'pain', 'recovery'
    ];

    useEffect(() => {
        // Update current selected pet ID when the prop changes
        setCurrentSelectedPetId(selectedPetId);
    }, [selectedPetId]);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            if (entry) {
                // Load existing entry for editing
                setFormData({
                    entry_date: entry.entry_date,
                    title: entry.title || '',
                    content: entry.content || '',
                    mood: entry.mood || '',
                    activity_level: entry.activity_level || '',
                    appetite: entry.appetite || '',
                    behavior_notes: entry.behavior_notes || '',
                    health_observations: entry.health_observations || '',
                    symptoms: entry.symptoms || '',
                    is_vet_visit_related: entry.is_vet_visit_related || false,
                    tags: entry.tags || [],
                    photos: entry.photos || []
                });

            } else {
                // Reset form for new entry
                resetForm();
            }
        }
    }, [isOpen, entry]);

    const resetForm = () => {
        setFormData({
            entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            title: '',
            content: '',
            mood: '',
            activity_level: '',
            appetite: '',
            behavior_notes: '',
            health_observations: '',
            symptoms: '',
            is_vet_visit_related: false,
            tags: [],
            photos: []
        });
        setSelectedPhotos([]);
    };

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('pet_diary_templates')
                .select('*')
                .eq('is_active', true)
                .order('category', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleTemplateApply = (template: any) => {
        const templateData = template.template_data;
        setFormData(prev => ({
            ...prev,
            ...templateData,
            title: prev.title || template.name
        }));
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTagToggle = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };


    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            // Validate file types and sizes
            const validFiles = files.filter(file => {
                if (!file.type.startsWith('image/')) {
                    alert(`${file.name} is not an image file`);
                    return false;
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert(`${file.name} is too large. Maximum size is 5MB`);
                    return false;
                }
                return true;
            });
            
            setSelectedPhotos(prev => [...prev, ...validFiles].slice(0, 6)); // Max 6 photos
        }
    };

    const removePhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const uploadPhotos = async (): Promise<string[]> => {
        if (selectedPhotos.length === 0) {
            return formData.photos || []; // Return existing photos if no new photos selected
        }

        setPhotoUploading(true);
        console.log('Starting photo upload for', selectedPhotos.length, 'photos');
        
        try {
            const uploadedUrls: string[] = [];
            
            // Upload photos one by one to better handle errors
            for (let i = 0; i < selectedPhotos.length; i++) {
                const file = selectedPhotos[i];
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const timestamp = Date.now();
                const fileName = `${timestamp}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `diary-photos/${currentSelectedPetId}/${fileName}`;

                console.log(`Uploading photo ${i + 1}/${selectedPhotos.length}:`, fileName);
                
                let uploadSuccess = false;
                let finalUrl = '';
                
                // Try buckets in priority order
                const bucketNames = ['pet-images', 'images', 'uploads', 'diary-images'];
                
                for (const bucketName of bucketNames) {
                    try {
                        console.log(`Attempting upload to bucket: ${bucketName}`);
                        
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from(bucketName)
                            .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: false
                            });
                        
                        if (uploadError) {
                            console.warn(`Upload to ${bucketName} failed:`, uploadError.message);
                            continue; // Try next bucket
                        }
                        
                        if (uploadData?.path) {
                            // Get public URL
                            const { data: urlData } = supabase.storage
                                .from(bucketName)
                                .getPublicUrl(filePath);
                            
                            if (urlData?.publicUrl) {
                                finalUrl = urlData.publicUrl;
                                uploadSuccess = true;
                                console.log(`Photo uploaded successfully to ${bucketName}:`, finalUrl);
                                break;
                            }
                        }
                    } catch (bucketError) {
                        console.warn(`Exception with bucket ${bucketName}:`, bucketError);
                        continue;
                    }
                }
                
                if (!uploadSuccess) {
                    console.error(`Failed to upload ${file.name} to any bucket`);
                    throw new Error(`Failed to upload ${file.name}. Please check your storage configuration.`);
                }
                
                uploadedUrls.push(finalUrl);
            }
            
            console.log(`All ${uploadedUrls.length} photos uploaded successfully`);
            
            // Combine existing photos with newly uploaded ones
            const allPhotoUrls = [...(formData.photos || []), ...uploadedUrls];
            console.log('Combined photo URLs:', allPhotoUrls);
            
            return allPhotoUrls;
            
        } catch (error) {
            console.error('Photo upload failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during upload';
            alert(`Photo upload failed: ${errorMessage}\n\nPlease try again or contact support if this continues.`);
            
            // Return existing photos if upload fails
            return formData.photos || [];
        } finally {
            // Always ensure photoUploading is reset
            setPhotoUploading(false);
            console.log('Photo upload process completed - loading state reset');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('DiaryEntryModal: Form submitted');
        console.log('DiaryEntryModal: selectedPetId:', currentSelectedPetId);
        console.log('DiaryEntryModal: petOwnerId:', petOwnerId);
        
        if (!currentSelectedPetId || !petOwnerId) {
            console.error('DiaryEntryModal: Missing selectedPetId or petOwnerId');
            alert('Missing pet or owner information. Please try again.');
            return;
        }

        setLoading(true);
        try {
            console.log('DiaryEntryModal: Starting save process...');
            
            // Upload photos first
            const photoUrls = await uploadPhotos();
            console.log('DiaryEntryModal: Photo URLs:', photoUrls);


            // Prepare entry data
            const entryData = {
                patient_id: currentSelectedPetId,
                pet_owner_id: petOwnerId,
                entry_date: formData.entry_date,
                title: formData.title.trim() || null,
                content: formData.content.trim() || null,
                mood: formData.mood || null,
                activity_level: formData.activity_level || null,
                appetite: formData.appetite || null,
                behavior_notes: formData.behavior_notes.trim() || null,
                health_observations: formData.health_observations.trim() || null,
                symptoms: formData.symptoms.trim() || null,
                is_vet_visit_related: formData.is_vet_visit_related,
                tags: formData.tags.length > 0 ? formData.tags : null,
                photos: photoUrls.length > 0 ? photoUrls : null
            };
            
            console.log('DiaryEntryModal: Entry data to save:', entryData);

            let result;
            if (entry) {
                console.log('DiaryEntryModal: Updating existing entry with ID:', entry.id);
                // Update existing entry
                result = await supabase
                    .from('pet_diary_entries')
                    .update({ ...entryData, updated_at: new Date().toISOString() })
                    .eq('id', entry.id)
                    .select();
            } else {
                console.log('DiaryEntryModal: Creating new entry...');
                // Create new entry
                result = await supabase
                    .from('pet_diary_entries')
                    .insert(entryData)
                    .select();
            }
            
            console.log('DiaryEntryModal: Database result:', result);

            if (result.error) {
                console.error('DiaryEntryModal: Database error:', result.error);
                throw result.error;
            }
            
            if (result.data && result.data.length > 0) {
                console.log('DiaryEntryModal: Entry saved successfully:', result.data[0]);
            } else {
                console.warn('DiaryEntryModal: No data returned from save operation');
            }

            console.log('DiaryEntryModal: Calling onSave callback...');
            onSave();
            console.log('DiaryEntryModal: Calling onClose callback...');
            onClose();
            resetForm();
            
            // Clear selected photos after successful save
            setSelectedPhotos([]);
            
            // Show success message
            alert('Diary entry saved successfully!');
        } catch (error) {
            console.error('DiaryEntryModal: Error saving diary entry:', error);
            
            // More detailed error message
            let errorMessage = 'Error saving entry. Please try again.';
            if (error && typeof error === 'object') {
                if ('message' in error) {
                    errorMessage = `Database error: ${error.message}`;
                } else if ('details' in error) {
                    errorMessage = `Error details: ${error.details}`;
                }
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-white/30 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {entry ? 'Edit Diary Entry' : 'New Diary Entry'}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {format(new Date(formData.entry_date), 'MMMM d, yyyy')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Templates */}
                    {templates.length > 0 && !entry && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Quick Templates:</p>
                            <div className="flex flex-wrap gap-2">
                                {templates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateApply(template)}
                                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100"
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Pet and Basic Info */}
                    <div className="space-y-6">
                        {/* Pet Selection (only show if multiple pets available) */}
                        {pets.length > 1 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Pet
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {pets.map(pet => (
                                        <button
                                            key={pet.id}
                                            type="button"
                                            onClick={() => setCurrentSelectedPetId(pet.id)}
                                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                                                currentSelectedPetId === pet.id
                                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                {pet.profile_picture_url ? (
                                                    <img
                                                        src={pet.profile_picture_url}
                                                        alt={pet.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-xs">
                                                            {pet.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium text-sm ${
                                                    currentSelectedPetId === pet.id ? 'text-blue-900' : 'text-gray-900'
                                                }`}>
                                                    {pet.name}
                                                </div>
                                                <div className={`text-xs ${
                                                    currentSelectedPetId === pet.id ? 'text-blue-600' : 'text-gray-500'
                                                }`}>
                                                    {pet.species} {pet.breed && `• ${pet.breed}`}
                                                </div>
                                            </div>
                                            {currentSelectedPetId === pet.id && (
                                                <div className="text-blue-500">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.entry_date}
                                        onChange={(e) => handleInputChange('entry_date', e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="e.g., Morning walk, Vet checkup..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Health Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mood
                            </label>
                            <select
                                value={formData.mood}
                                onChange={(e) => handleInputChange('mood', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select mood</option>
                                {moodOptions.map(mood => (
                                    <option key={mood.value} value={mood.value}>
                                        {mood.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Activity Level
                            </label>
                            <select
                                value={formData.activity_level}
                                onChange={(e) => handleInputChange('activity_level', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select activity</option>
                                {activityOptions.map(activity => (
                                    <option key={activity.value} value={activity.value}>
                                        {activity.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Appetite
                            </label>
                            <select
                                value={formData.appetite}
                                onChange={(e) => handleInputChange('appetite', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select appetite</option>
                                {appetiteOptions.map(appetite => (
                                    <option key={appetite.value} value={appetite.value}>
                                        {appetite.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes and Content */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                General Notes
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                placeholder="Describe your pet's day, behavior, or any general observations..."
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Health Observations
                                </label>
                                <textarea
                                    value={formData.health_observations}
                                    onChange={(e) => handleInputChange('health_observations', e.target.value)}
                                    placeholder="Any health-related observations or concerns..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Symptoms
                                </label>
                                <textarea
                                    value={formData.symptoms}
                                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                                    placeholder="Any symptoms or unusual behavior noticed..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Behavior Notes
                            </label>
                            <textarea
                                value={formData.behavior_notes}
                                onChange={(e) => handleInputChange('behavior_notes', e.target.value)}
                                placeholder="Behavioral patterns, social interactions, or training progress..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                            />
                        </div>

                    </div>



                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                            <TagIcon className="w-4 h-4" />
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {commonTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                                        formData.tags.includes(tag)
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="capitalize">{tag.replace('-', ' ')}</span>
                                    {formData.tags.includes(tag) && (
                                        <span className="ml-1 text-blue-500">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Photos */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                                <PhotoIcon className="w-4 h-4" />
                                Photos
                            </label>
                            <div className="text-sm text-gray-600">
                                {selectedPhotos.length + (formData.photos?.length || 0)} of 6 photos
                            </div>
                        </div>
                        
                        {/* Photo Upload Area */}
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                                type="file"
                                id="photo-upload"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                                disabled={photoUploading || (selectedPhotos.length + (formData.photos?.length || 0)) >= 6}
                            />
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium mb-1">
                                    {photoUploading ? 'Uploading photos...' : 'Add photos to capture this moment'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Click to browse or drag and drop images here (max 6 photos, 5MB each)
                                </p>
                            </label>
                        </div>
                        
                        {(selectedPhotos.length > 0 || (formData.photos && formData.photos.length > 0)) && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {/* Existing photos */}
                                {formData.photos?.map((photo, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={photo}
                                            alt={`Photo ${index + 1}`}
                                            className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        photos: prev.photos.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
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
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Vet Visit Checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                            type="checkbox"
                            id="vet-visit"
                            checked={formData.is_vet_visit_related}
                            onChange={(e) => handleInputChange('is_vet_visit_related', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="vet-visit" className="text-sm font-medium text-blue-800">
                            This entry is related to a vet visit
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            disabled={loading || photoUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            disabled={loading || photoUploading}
                        >
                            {(loading || photoUploading) && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            <span>{entry ? 'Update Entry' : 'Save Entry'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}