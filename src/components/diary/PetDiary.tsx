'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { supabase } from '@/lib/supabase';
import ViewEntryModal from './ViewEntryModal';
import DiaryEntryModal from './DiaryEntryModal';
import {
    CalendarDaysIcon,
    PlusIcon,
    HeartIcon,
    PhotoIcon,
    TagIcon,
    ClockIcon,
    DocumentTextIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ChartBarIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline';

interface DiaryEntry {
    id: number;
    patient_id: number;
    entry_date: string;
    title: string;
    content: string;
    mood: string;
    activity_level: string;
    appetite: string;
    behavior_notes: string;
    health_observations: string;
    symptoms: string;
    medication_given: any;
    feeding_notes: string;
    weight: number;
    temperature: number;
    is_vet_visit_related: boolean;
    appointment_id: number;
    tags: string[];
    photos: string[];
    created_at: string;
    updated_at: string;
}

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    profile_picture_url: string;
}

interface PetDiaryProps {
    pets: Pet[];
    selectedPetId?: number;
    petOwnerId: number;
    onOpenAddModal?: (petId: number, selectedDate?: Date) => void;
    onOpenEditModal?: (entry: DiaryEntry) => void;
    onOpenViewModal?: (entry: DiaryEntry) => void;
    refreshTrigger?: number; // Add this to trigger data refresh
}

export default function PetDiary({ pets, selectedPetId, petOwnerId, onOpenAddModal, onOpenEditModal, onOpenViewModal, refreshTrigger }: PetDiaryProps) {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [selectedPet, setSelectedPet] = useState<number>(selectedPetId || pets[0]?.id || 0);
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const [refreshTriggerInternal, setRefreshTriggerInternal] = useState(0);

    // Common tags for filtering
    const availableTags = [
        'health', 'medication', 'feeding', 'exercise', 'mood', 'symptom', 
        'vet-visit', 'behavior', 'weight', 'temperature', 'activity'
    ];

    const moodLabels = {
        happy: 'Happy',
        playful: 'Playful',
        tired: 'Tired',
        anxious: 'Anxious',
        sad: 'Sad',
        normal: 'Normal',
        excited: 'Excited',
        calm: 'Calm'
    };

    const moodColors = {
        happy: 'bg-green-100 text-green-800 border-green-200',
        playful: 'bg-blue-100 text-blue-800 border-blue-200',
        tired: 'bg-gray-100 text-gray-800 border-gray-200',
        anxious: 'bg-orange-100 text-orange-800 border-orange-200',
        sad: 'bg-red-100 text-red-800 border-red-200',
        normal: 'bg-slate-100 text-slate-800 border-slate-200',
        excited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        calm: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };

    const activityColors = {
        low: 'text-gray-600 bg-gray-50',
        normal: 'text-green-700 bg-green-50',
        high: 'text-amber-700 bg-amber-50',
        very_active: 'text-orange-700 bg-orange-50',
        lethargic: 'text-red-700 bg-red-50'
    };

    const activityIcons = {
        low: '◐',
        normal: '●',
        high: '◗',
        very_active: '●●',
        lethargic: '◦'
    };

    const appetiteColors = {
        normal: 'text-green-700 bg-green-50',
        increased: 'text-blue-700 bg-blue-50',
        decreased: 'text-amber-700 bg-amber-50',
        no_appetite: 'text-red-700 bg-red-50',
        picky: 'text-orange-700 bg-orange-50'
    };

    useEffect(() => {
        if (selectedPet) {
            fetchDiaryEntries();
        }
    }, [selectedPet, currentDate]);

    // Refresh data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && selectedPet) {
            console.log('PetDiary: Refresh triggered, refetching entries...');
            fetchDiaryEntries();
        }
    }, [refreshTrigger]);

    const fetchDiaryEntries = async () => {
        if (!selectedPet) return;
        
        setLoading(true);
        try {
            const startDate = viewMode === 'calendar' 
                ? startOfMonth(currentDate).toISOString().split('T')[0]
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days
            
            const endDate = viewMode === 'calendar'
                ? endOfMonth(currentDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('pet_diary_entries')
                .select('*')
                .eq('patient_id', selectedPet)
                .gte('entry_date', startDate)
                .lte('entry_date', endDate)
                .order('entry_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching diary entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = !searchTerm || 
            entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.health_observations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTags = selectedTags.length === 0 || 
            selectedTags.some(tag => entry.tags?.includes(tag));

        return matchesSearch && matchesTags;
    });

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const getEntriesForDate = (date: Date) => {
        return filteredEntries.filter(entry => 
            isSameDay(new Date(entry.entry_date), date)
        );
    };

    const handleDeleteEntry = async (entryId: number) => {
        try {
            const { error } = await supabase
                .from('pet_diary_entries')
                .delete()
                .eq('id', entryId);

            if (error) {
                console.error('Error deleting diary entry:', error);
                alert('Failed to delete entry. Please try again.');
                return;
            }

            console.log('Diary entry deleted successfully');
            // Refresh the entries
            fetchDiaryEntries();
            // Trigger internal refresh counter for external consumers
            setRefreshTriggerInternal(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting diary entry:', error);
            alert('An error occurred while deleting the entry.');
        }
    };

    // Custom handlers for CRUD operations
    const handleViewEntry = (entry: DiaryEntry) => {
        console.log('PetDiary: Opening view modal for entry:', entry.id);
        setSelectedEntry(entry);
        setShowViewModal(true);
    };

    const handleEditEntry = (entry: DiaryEntry) => {
        console.log('PetDiary: Opening edit modal for entry:', entry.id);
        setEditingEntry(entry);
        setShowEditModal(true);
    };

    const handleCreateEntry = (petId?: number, selectedDate?: Date) => {
        console.log('PetDiary: Opening create modal for pet:', petId || selectedPet);
        setEditingEntry(null); // Ensure we're in create mode
        setShowAddModal(true);
    };

    // Modal handlers
    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setSelectedEntry(null);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingEntry(null);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
    };

    const handleSaveEntry = () => {
        console.log('PetDiary: Entry saved, refreshing data...');
        // Refresh the entries after save
        fetchDiaryEntries();
        // Trigger internal refresh counter for external consumers
        setRefreshTriggerInternal(prev => prev + 1);
    };

    const renderCalendarView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                                className={`min-h-[100px] p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer ${
                                    isCurrentDay ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => {
                                    if (onOpenAddModal) {
                                        onOpenAddModal(selectedPet, day);
                                    } else {
                                        handleCreateEntry(selectedPet, day);
                                    }
                                }}
                            >
                                <div className={`text-sm font-medium mb-1 ${
                                    isCurrentDay ? 'text-blue-600' : 'text-gray-700'
                                }`}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayEntries.slice(0, 3).map(entry => (
                                        <div
                                            key={entry.id}
                                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onOpenViewModal) {
                                                    onOpenViewModal(entry);
                                                } else {
                                                    handleViewEntry(entry);
                                                }
                                            }}
                                        >
                                            {entry.title || 'Diary Entry'}
                                        </div>
                                    ))}
                                    {dayEntries.length > 3 && (
                                        <div className="text-xs text-gray-500">
                                            +{dayEntries.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTimelineView = () => {
        if (filteredEntries.length === 0) {
            const isFiltered = searchTerm || selectedTags.length > 0;
            
            return (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        {isFiltered ? (
                            <>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">No entries match your search</h3>
                                <p className="text-gray-600 mb-6">
                                    Try adjusting your search terms or filters to find what you're looking for.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedTags([]);
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                    <button
                                        onClick={() => onOpenAddModal ? onOpenAddModal(selectedPet) : handleCreateEntry(selectedPet)}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Create New Entry
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your Pet's Health Journey</h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    Begin documenting your pet's daily activities, health observations, and behavioral patterns. 
                                    This helps you track their wellbeing and share valuable insights with your veterinarian.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="text-blue-600 font-semibold text-sm mb-1">Daily Health</div>
                                        <div className="text-xs text-blue-700">Track mood, appetite, and activity levels</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                        <div className="text-green-600 font-semibold text-sm mb-1">Symptoms</div>
                                        <div className="text-xs text-green-700">Record any health observations or concerns</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="text-purple-600 font-semibold text-sm mb-1">Medications</div>
                                        <div className="text-xs text-purple-700">Log treatments and medications given</div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => onOpenAddModal ? onOpenAddModal(selectedPet) : handleCreateEntry(selectedPet)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span>Create First Entry</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredEntries.map(entry => {
                    const pet = pets.find(p => p.id === entry.patient_id);
                    return (
                        <div key={entry.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start gap-4">
                                    {/* Pet Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                            {pet?.profile_picture_url ? (
                                                <img
                                                    src={pet.profile_picture_url}
                                                    alt={pet.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {pet?.name?.charAt(0) || 'P'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {entry.title || 'Daily Entry'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {pet?.name} • {pet?.species}
                                                        </p>
                                                    </div>
                                                    {entry.mood && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                            moodColors[entry.mood as keyof typeof moodColors] || moodColors.normal
                                                        }`}>
                                                            {moodLabels[entry.mood as keyof typeof moodLabels] || entry.mood}
                                                        </span>
                                                    )}
                                                    {entry.is_vet_visit_related && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                            Vet Visit
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDaysIcon className="w-4 h-4" />
                                                        {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-4 h-4" />
                                                        {format(new Date(entry.created_at), 'h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        if (onOpenViewModal) {
                                                            onOpenViewModal(entry);
                                                        } else {
                                                            handleViewEntry(entry);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (onOpenEditModal) {
                                                            onOpenEditModal(entry);
                                                        } else {
                                                            handleEditEntry(entry);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Edit Entry"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const confirmed = window.confirm(
                                                            `Are you sure you want to delete this diary entry?\\n\\n"${entry.title || 'Daily Entry'}" from ${format(new Date(entry.entry_date), 'MMM d, yyyy')}\\n\\nThis action cannot be undone.`
                                                        );
                                                        if (confirmed) {
                                                            handleDeleteEntry(entry.id);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Entry"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Entry Content */}
                                {entry.content && (
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 leading-relaxed">{entry.content}</p>
                                    </div>
                                )}

                                {/* Health Metrics */}
                                {(entry.activity_level || entry.appetite || entry.weight || entry.temperature) && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {entry.activity_level && (
                                            <div className={`p-3 rounded-lg border ${activityColors[entry.activity_level as keyof typeof activityColors]}`}>
                                                <div className="text-xs font-medium mb-1">Activity Level</div>
                                                <div className="text-sm font-semibold capitalize flex items-center gap-1">
                                                    <span>{activityIcons[entry.activity_level as keyof typeof activityIcons]}</span>
                                                    {entry.activity_level.replace('_', ' ')}
                                                </div>
                                            </div>
                                        )}
                                        {entry.appetite && (
                                            <div className={`p-3 rounded-lg border ${appetiteColors[entry.appetite as keyof typeof appetiteColors]}`}>
                                                <div className="text-xs font-medium mb-1">Appetite</div>
                                                <div className="text-sm font-semibold capitalize">
                                                    {entry.appetite.replace('_', ' ')}
                                                </div>
                                            </div>
                                        )}
                                        {entry.weight && (
                                            <div className="p-3 rounded-lg border bg-gray-50 text-gray-700">
                                                <div className="text-xs font-medium mb-1">Weight</div>
                                                <div className="text-sm font-semibold">{entry.weight} kg</div>
                                            </div>
                                        )}
                                        {entry.temperature && (
                                            <div className="p-3 rounded-lg border bg-gray-50 text-gray-700">
                                                <div className="text-xs font-medium mb-1">Temperature</div>
                                                <div className="text-sm font-semibold">{entry.temperature}°C</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Additional Notes */}
                                {(entry.health_observations || entry.symptoms || entry.behavior_notes) && (
                                    <div className="space-y-3">
                                        {entry.health_observations && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="text-xs font-medium text-blue-700 mb-1">Health Observations</div>
                                                <p className="text-sm text-blue-800">{entry.health_observations}</p>
                                            </div>
                                        )}
                                        {entry.symptoms && (
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                                <div className="text-xs font-medium text-red-700 mb-1">Symptoms</div>
                                                <p className="text-sm text-red-800">{entry.symptoms}</p>
                                            </div>
                                        )}
                                        {entry.behavior_notes && (
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                <div className="text-xs font-medium text-amber-700 mb-1">Behavior Notes</div>
                                                <p className="text-sm text-amber-800">{entry.behavior_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tags */}
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {entry.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Photos */}
                                {entry.photos && entry.photos.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {entry.photos.slice(0, 4).map((photo, index) => (
                                            <img
                                                key={index}
                                                src={photo}
                                                alt={`Entry photo ${index + 1}`}
                                                className="flex-shrink-0 w-20 h-20 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        ))}
                                        {entry.photos.length > 4 && (
                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500">
                                                +{entry.photos.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (pets.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pets Found</h3>
                <p className="text-gray-500">Add a pet first to start using the diary feature.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <DocumentTextIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Pet Health Diary</h1>
                                <p className="text-gray-600 text-sm">Monitor and track your pet's daily health and activities</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Pet Selection */}
                        <div className="min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Select Pet</label>
                            <select
                                value={selectedPet}
                                onChange={(e) => setSelectedPet(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                {pets.map(pet => (
                                    <option key={pet.id} value={pet.id}>
                                        {pet.name} • {pet.species}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Add Entry Button */}
                        <button
                            onClick={() => onOpenAddModal ? onOpenAddModal(selectedPet) : handleCreateEntry(selectedPet)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>New Entry</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-4">
                    {/* Top Row: View Mode and Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    viewMode === 'timeline' 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <ListBulletIcon className="w-4 h-4" />
                                <span>Timeline</span>
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    viewMode === 'calendar' 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <CalendarDaysIcon className="w-4 h-4" />
                                <span>Calendar</span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search entries, symptoms, notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                            />
                        </div>

                        {/* Month Navigation (for calendar view) */}
                        {viewMode === 'calendar' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-sm font-medium min-w-[140px] text-center text-gray-900">
                                    {format(currentDate, 'MMMM yyyy')}
                                </span>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {availableTags.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filter by category</span>
                                {selectedTags.length > 0 && (
                                    <button
                                        onClick={() => setSelectedTags([])}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                                            selectedTags.includes(tag)
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="capitalize">{tag.replace('-', ' ')}</span>
                                        {selectedTags.includes(tag) && (
                                            <span className="ml-1 text-blue-500">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading diary entries...</p>
                </div>
            ) : (
                viewMode === 'calendar' ? renderCalendarView() : renderTimelineView()
            )}

            {/* Modals */}
            <ViewEntryModal
                isOpen={showViewModal}
                onClose={handleCloseViewModal}
                entry={selectedEntry}
                pets={pets}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
            />

            <DiaryEntryModal
                isOpen={showEditModal}
                onClose={handleCloseEditModal}
                onSave={handleSaveEntry}
                selectedPetId={editingEntry?.patient_id || selectedPet}
                petOwnerId={petOwnerId}
                entry={editingEntry}
                pets={pets}
            />

            <DiaryEntryModal
                isOpen={showAddModal}
                onClose={handleCloseAddModal}
                onSave={handleSaveEntry}
                selectedPetId={selectedPet}
                petOwnerId={petOwnerId}
                pets={pets}
            />
        </div>
    );
}
