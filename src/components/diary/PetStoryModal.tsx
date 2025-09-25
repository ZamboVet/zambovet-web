'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    HeartIcon,
    PhotoIcon,
    PlusIcon,
    EyeIcon,
    BookOpenIcon,
    SparklesIcon,
    BoltIcon,
    CameraIcon,
    DocumentArrowDownIcon,
    ViewColumnsIcon,
    ListBulletIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    StarIcon,
    GiftIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    profile_picture_url: string;
    date_of_birth?: string;
}

interface StoryEntry {
    id: number;
    pet_id: number;
    entry_date: string;
    title: string;
    content: string;
    mood: string;
    activities: string[];
    photos: string[];
    entry_type: 'daily' | 'milestone' | 'vet_visit' | 'special';
    health_notes?: string;
    created_at: string;
    is_favorite: boolean;
}

interface PetStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet | null;
    onOpenStoryEntry: (entry?: StoryEntry, selectedDate?: Date) => void;
    onGenerateYearbook: (petId: number) => void;
}

export default function PetStoryModal({ isOpen, onClose, pet, onOpenStoryEntry, onGenerateYearbook }: PetStoryModalProps) {
    const [stories, setStories] = useState<StoryEntry[]>([]);
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<StoryEntry | null>(null);

    useEffect(() => {
        if (isOpen && pet) {
            fetchStories();
        }
    }, [isOpen, pet]);

    const fetchStories = async () => {
        if (!pet) return;
        
        setLoading(true);
        try {
            // Fetch diary entries as stories
            const { data: diaryEntries, error } = await supabase
                .from('pet_diary_entries')
                .select('*')
                .eq('patient_id', pet.id)
                .order('entry_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform diary entries to story format
            const transformedStories: StoryEntry[] = diaryEntries?.map(entry => ({
                id: entry.id,
                pet_id: entry.patient_id,
                entry_date: entry.entry_date,
                title: entry.title || 'Daily Entry',
                content: entry.content || '',
                mood: entry.mood || 'neutral',
                activities: [], // We could parse this from content or have a separate field
                photos: entry.photos || [],
                entry_type: entry.is_vet_visit_related ? 'vet_visit' : 'daily',
                health_notes: entry.health_observations || entry.symptoms,
                created_at: entry.created_at,
                is_favorite: false // Could add this field to database
            })) || [];

            setStories(transformedStories);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEntriesForDate = (date: Date) => {
        return stories.filter(story => 
            isSameDay(new Date(story.entry_date), date)
        );
    };

    const getMoodColor = (mood: string) => {
        const colors = {
            happy: 'bg-green-100 text-green-800 border-green-200',
            playful: 'bg-blue-100 text-blue-800 border-blue-200',
            calm: 'bg-purple-100 text-purple-800 border-purple-200',
            excited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            tired: 'bg-gray-100 text-gray-800 border-gray-200',
            anxious: 'bg-orange-100 text-orange-800 border-orange-200',
            sad: 'bg-red-100 text-red-800 border-red-200',
            neutral: 'bg-slate-100 text-slate-800 border-slate-200'
        };
        return colors[mood as keyof typeof colors] || colors.neutral;
    };

    const getEntryTypeIcon = (type: string) => {
        switch (type) {
            case 'milestone': return StarIcon;
            case 'vet_visit': return AcademicCapIcon;
            case 'special': return GiftIcon;
            default: return BookOpenIcon;
        }
    };

    const renderCalendarView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
            <div className="bg-white rounded-xl border border-gray-200">
                {/* Calendar Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {format(currentDate, 'MMMM yyyy')}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map(day => {
                            const dayEntries = getEntriesForDate(day);
                            const isCurrentDay = isToday(day);
                            
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[100px] p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                                        isCurrentDay ? 'bg-blue-50 border-blue-200' : 'border-gray-100'
                                    }`}
                                    onClick={() => onOpenStoryEntry(undefined, day)}
                                >
                                    <div className={`text-sm font-medium mb-1 ${
                                        isCurrentDay ? 'text-blue-600' : 'text-gray-700'
                                    }`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEntries.slice(0, 2).map(entry => (
                                            <div
                                                key={entry.id}
                                                className={`text-xs p-1 rounded text-center cursor-pointer ${getMoodColor(entry.mood)}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEntry(entry);
                                                }}
                                            >
                                                {entry.title}
                                            </div>
                                        ))}
                                        {dayEntries.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                +{dayEntries.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderTimelineView = () => {
        if (stories.length === 0) {
            return (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpenIcon className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Start {pet?.name}'s Story</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Create the first chapter of {pet?.name}'s life story. Record daily moments, adventures, 
                        and precious memories that make them special.
                    </p>
                    <button
                        onClick={() => onOpenStoryEntry()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Write First Story
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {stories.map((story, index) => {
                    const IconComponent = getEntryTypeIcon(story.entry_type);
                    return (
                        <div key={story.id} className="relative">
                            {/* Timeline Line */}
                            {index < stories.length - 1 && (
                                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300"></div>
                            )}
                            
                            {/* Story Entry */}
                            <div className="flex gap-6 group">
                                {/* Timeline Icon */}
                                <div className="flex-shrink-0">
                                    <div className={`w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                                        story.entry_type === 'vet_visit' ? 'bg-red-100' :
                                        story.entry_type === 'milestone' ? 'bg-yellow-100' :
                                        story.entry_type === 'special' ? 'bg-purple-100' : 'bg-blue-100'
                                    }`}>
                                        <IconComponent className={`w-6 h-6 ${
                                            story.entry_type === 'vet_visit' ? 'text-red-600' :
                                            story.entry_type === 'milestone' ? 'text-yellow-600' :
                                            story.entry_type === 'special' ? 'text-purple-600' : 'text-blue-600'
                                        }`} />
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm group-hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{story.title}</h3>
                                                {story.mood && (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(story.mood)}`}>
                                                        {story.mood}
                                                    </span>
                                                )}
                                                {story.is_favorite && (
                                                    <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDaysIcon className="w-4 h-4" />
                                                    {format(new Date(story.entry_date), 'MMMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {format(new Date(story.created_at), 'h:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onOpenStoryEntry(story)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    {story.content && (
                                        <p className="text-gray-700 mb-4 leading-relaxed">{story.content}</p>
                                    )}

                                    {/* Health Notes */}
                                    {story.health_notes && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800">
                                                <strong>Health Note:</strong> {story.health_notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Photos */}
                                    {story.photos && story.photos.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto mb-4">
                                            {story.photos.slice(0, 4).map((photo, photoIndex) => (
                                                <img
                                                    key={photoIndex}
                                                    src={photo}
                                                    alt={`Story photo ${photoIndex + 1}`}
                                                    className="flex-shrink-0 w-20 h-20 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                                                />
                                            ))}
                                            {story.photos.length > 4 && (
                                                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500">
                                                    +{story.photos.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!isOpen || !pet) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/50">
                                {pet.profile_picture_url ? (
                                    <img
                                        src={pet.profile_picture_url}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                                        <HeartIcon className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{pet.name}'s Story</h2>
                                <p className="text-white/80">A journey through life's precious moments</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onGenerateYearbook(pet.id)}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Generate Yearbook"
                            >
                                <DocumentArrowDownIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200">
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'timeline'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <ListBulletIcon className="w-4 h-4" />
                                    Timeline
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'calendar'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    Calendar
                                </button>
                            </div>
                        </div>

                        {/* Add Story Button */}
                        <button
                            onClick={() => onOpenStoryEntry()}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Story
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading {pet.name}'s story...</p>
                        </div>
                    ) : (
                        viewMode === 'timeline' ? renderTimelineView() : renderCalendarView()
                    )}
                </div>
            </div>
        </div>
    );
}