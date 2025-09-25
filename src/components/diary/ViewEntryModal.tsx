'use client';

import { format } from 'date-fns';
import {
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    HeartIcon,
    EyeIcon,
    ChatBubbleBottomCenterTextIcon,
    PhotoIcon,
    TagIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    PencilIcon
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
    is_vet_visit_related: boolean;
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

interface ViewEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: DiaryEntry | null;
    pets: Pet[];
    onEdit?: (entry: DiaryEntry) => void;
    onDelete?: (entryId: number) => void;
}

export default function ViewEntryModal({ isOpen, onClose, entry, pets, onEdit, onDelete }: ViewEntryModalProps) {
    if (!isOpen || !entry) return null;

    const pet = pets.find(p => p.id === entry.patient_id);

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

    const handleDelete = () => {
        const confirmed = window.confirm(
            `Are you sure you want to delete this precious moment?\n\n"${entry.title || 'Daily Moment'}" from ${format(new Date(entry.entry_date), 'MMM d, yyyy')}\n\nThis memory and all its photos will be permanently removed.`
        );
        if (confirmed && onDelete) {
            onDelete(entry.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {/* Pet Image */}
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                                {pet?.profile_picture_url ? (
                                    <img
                                        src={pet.profile_picture_url}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                            {pet?.name?.charAt(0) || 'P'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {entry.title || 'Daily Moment'}
                                    </h2>
                                    {entry.mood && (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                            moodColors[entry.mood as keyof typeof moodColors] || moodColors.normal
                                        }`}>
                                            {moodLabels[entry.mood as keyof typeof moodLabels] || entry.mood}
                                        </span>
                                    )}
                                    {entry.is_vet_visit_related && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                            <HeartIcon className="w-4 h-4 mr-1" />
                                            Health Visit
                                        </span>
                                    )}
                                </div>
                                
                                <div className="text-gray-600 space-y-1">
                                    <p className="font-medium">
                                        {pet?.name} • {pet?.species} {pet?.breed && `• ${pet.breed}`}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" />
                                            {format(new Date(entry.created_at), 'h:mm a')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => {
                                        onEdit(entry);
                                        onClose();
                                    }}
                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Edit Entry"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* The Story */}
                    {entry.content && (
                        <div className="prose prose-lg max-w-none">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-semibold text-blue-900">Today's Story</span>
                                </div>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">{entry.content}</p>
                            </div>
                        </div>
                    )}

                    {/* Daily Summary */}
                    {(entry.activity_level || entry.appetite) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <HeartIcon className="w-5 h-5" />
                                Daily Summary
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entry.activity_level && (
                                    <div className={`p-4 rounded-xl border ${activityColors[entry.activity_level as keyof typeof activityColors]} border-gray-200`}>
                                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Activity Level</div>
                                        <div className="text-lg font-semibold capitalize flex items-center gap-2">
                                            <span className="text-xl">{activityIcons[entry.activity_level as keyof typeof activityIcons]}</span>
                                            {entry.activity_level.replace('_', ' ')}
                                        </div>
                                    </div>
                                )}
                                {entry.appetite && (
                                    <div className={`p-4 rounded-xl border ${appetiteColors[entry.appetite as keyof typeof appetiteColors]} border-gray-200`}>
                                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Appetite</div>
                                        <div className="text-lg font-semibold capitalize">
                                            {entry.appetite.replace('_', ' ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Health Observations & Symptoms */}
                    {(entry.health_observations || entry.symptoms || entry.behavior_notes) && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <EyeIcon className="w-5 h-5" />
                                Observations
                            </h3>
                            
                            {entry.health_observations && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Health Observations</span>
                                    </div>
                                    <p className="text-blue-900 leading-relaxed">{entry.health_observations}</p>
                                </div>
                            )}

                            {entry.symptoms && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                        <span className="text-sm font-medium text-red-800">Symptoms</span>
                                    </div>
                                    <p className="text-red-900 leading-relaxed">{entry.symptoms}</p>
                                </div>
                            )}

                            {entry.behavior_notes && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <InformationCircleIcon className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-800">Behavior Notes</span>
                                    </div>
                                    <p className="text-amber-900 leading-relaxed">{entry.behavior_notes}</p>
                                </div>
                            )}
                        </div>
                    )}



                    {/* Categories */}
                    {entry.tags && entry.tags.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <TagIcon className="w-5 h-5" />
                                Categories
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {entry.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"
                                    >
                                        {tag.replace('-', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Captured Moments */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PhotoIcon className="w-5 h-5" />
                            Captured Moments
                        </h3>
                        {entry.photos && entry.photos.length > 0 ? (
                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {entry.photos.map((photo, index) => (
                                        <div key={index} className="group">
                                            <img
                                                src={photo}
                                                alt={`Moment ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-xl border border-gray-300 hover:scale-105 transition-all duration-300 cursor-pointer shadow-md group-hover:shadow-xl"
                                                onClick={() => window.open(photo, '_blank')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium mb-1">No photos captured</p>
                                <p className="text-sm text-gray-500">This moment was saved without photos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            <p>Created: {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}</p>
                            {entry.updated_at !== entry.created_at && (
                                <p>Updated: {format(new Date(entry.updated_at), 'MMM d, yyyy • h:mm a')}</p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {onDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                    Delete Moment
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}