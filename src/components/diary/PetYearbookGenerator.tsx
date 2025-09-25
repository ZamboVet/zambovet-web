'use client';

import { useState } from 'react';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    DocumentArrowDownIcon,
    PhotoIcon,
    CalendarDaysIcon,
    HeartIcon,
    SparklesIcon,
    StarIcon,
    BookOpenIcon,
    GiftIcon,
    AcademicCapIcon,
    CheckCircleIcon
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
    entry_date: string;
    title: string;
    content: string;
    mood: string;
    photos: string[];
    entry_type: string;
    health_notes?: string;
    tags?: string[];
    is_favorite: boolean;
}

interface YearbookData {
    pet: Pet;
    year: number;
    totalEntries: number;
    favoriteEntries: StoryEntry[];
    monthlyHighlights: { [month: string]: StoryEntry[] };
    moodStats: { [mood: string]: number };
    milestones: StoryEntry[];
    vetVisits: StoryEntry[];
    photos: string[];
    activities: string[];
}

interface PetYearbookGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet | null;
}

export default function PetYearbookGenerator({ isOpen, onClose, pet }: PetYearbookGeneratorProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [yearbookData, setYearbookData] = useState<YearbookData | null>(null);

    const generateYearbook = async () => {
        if (!pet) return;

        setLoading(true);
        try {
            const startDate = startOfYear(new Date(selectedYear, 0, 1));
            const endDate = endOfYear(new Date(selectedYear, 11, 31));

            // Fetch all diary entries for the selected year
            const { data: entries, error } = await supabase
                .from('pet_diary_entries')
                .select('*')
                .eq('patient_id', pet.id)
                .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
                .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
                .order('entry_date', { ascending: true });

            if (error) throw error;

            if (!entries || entries.length === 0) {
                alert(`No diary entries found for ${pet.name} in ${selectedYear}`);
                return;
            }

            // Transform entries to story format
            const stories: StoryEntry[] = entries.map(entry => ({
                id: entry.id,
                entry_date: entry.entry_date,
                title: entry.title || 'Daily Entry',
                content: entry.content || '',
                mood: entry.mood || 'neutral',
                photos: entry.photos || [],
                entry_type: entry.is_vet_visit_related ? 'vet_visit' : 
                           entry.tags?.includes('milestone') ? 'milestone' :
                           entry.tags?.includes('special') ? 'special' : 'daily',
                health_notes: entry.health_observations || entry.symptoms,
                tags: entry.tags || [],
                is_favorite: entry.tags?.includes('favorite') || false
            }));

            // Process data for yearbook
            const favoriteEntries = stories.filter(s => s.is_favorite).slice(0, 12);
            const milestones = stories.filter(s => s.entry_type === 'milestone');
            const vetVisits = stories.filter(s => s.entry_type === 'vet_visit');
            
            // Group by months
            const monthlyHighlights: { [month: string]: StoryEntry[] } = {};
            const months = eachMonthOfInterval({ start: startDate, end: endDate });
            
            months.forEach(month => {
                const monthKey = format(month, 'MMMM');
                monthlyHighlights[monthKey] = stories.filter(story => 
                    format(new Date(story.entry_date), 'MMMM') === monthKey
                ).slice(0, 3); // Top 3 entries per month
            });

            // Calculate mood statistics
            const moodStats: { [mood: string]: number } = {};
            stories.forEach(story => {
                moodStats[story.mood] = (moodStats[story.mood] || 0) + 1;
            });

            // Collect all photos
            const allPhotos = stories.flatMap(s => s.photos).filter(Boolean);
            const uniquePhotos = [...new Set(allPhotos)].slice(0, 20); // Limit to 20 photos

            // Collect activities from tags
            const allActivities = stories.flatMap(s => s.tags || [])
                .filter(tag => !['daily', 'milestone', 'special', 'vet_visit', 'favorite'].includes(tag));
            const uniqueActivities = [...new Set(allActivities)];

            const yearbook: YearbookData = {
                pet,
                year: selectedYear,
                totalEntries: stories.length,
                favoriteEntries,
                monthlyHighlights,
                moodStats,
                milestones,
                vetVisits,
                photos: uniquePhotos,
                activities: uniqueActivities
            };

            setYearbookData(yearbook);
        } catch (error) {
            console.error('Error generating yearbook:', error);
            alert('Error generating yearbook. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadAsHTML = () => {
        if (!yearbookData) return;

        setGeneratingPDF(true);
        try {
            const htmlContent = generateHTMLContent(yearbookData);
            
            // Create and download HTML file
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${yearbookData.pet.name}-${yearbookData.year}-Yearbook.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading yearbook:', error);
            alert('Error downloading yearbook. Please try again.');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const generateHTMLContent = (data: YearbookData): string => {
        const { pet, year, totalEntries, favoriteEntries, monthlyHighlights, moodStats, milestones, vetVisits, photos } = data;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pet.name}'s ${year} Yearbook</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1d4ed8; margin-top: 30px; }
        .header { text-align: center; margin-bottom: 40px; }
        .pet-photo { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 auto; display: block; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .story-entry { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 15px 0; }
        .story-title { font-weight: bold; color: #1e293b; margin-bottom: 10px; }
        .story-date { color: #64748b; font-size: 14px; margin-bottom: 10px; }
        .story-content { margin-bottom: 15px; }
        .mood-badge { background: #dbeafe; color: #1e40af; padding: 5px 10px; border-radius: 15px; font-size: 12px; display: inline-block; }
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .photo { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; }
        .month-section { margin: 30px 0; }
        .favorite-star { color: #fbbf24; }
        @media print { body { print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${pet.name}'s ${year} Yearbook</h1>
        ${pet.profile_picture_url ? `<img src="${pet.profile_picture_url}" alt="${pet.name}" class="pet-photo">` : ''}
        <p><strong>${pet.species} • ${pet.breed || 'Mixed Breed'}</strong></p>
        <p>A year of precious memories and adventures</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${totalEntries}</div>
            <div>Total Entries</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${favoriteEntries.length}</div>
            <div>Favorite Memories</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${milestones.length}</div>
            <div>Milestones</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${vetVisits.length}</div>
            <div>Vet Visits</div>
        </div>
    </div>

    ${favoriteEntries.length > 0 ? `
    <h2>⭐ Favorite Memories</h2>
    ${favoriteEntries.map(entry => `
        <div class="story-entry">
            <div class="story-title"><span class="favorite-star">★</span> ${entry.title}</div>
            <div class="story-date">${format(new Date(entry.entry_date), 'MMMM d, yyyy')}</div>
            <div class="story-content">${entry.content}</div>
            <span class="mood-badge">${entry.mood}</span>
        </div>
    `).join('')}
    ` : ''}

    ${Object.keys(monthlyHighlights).filter(month => monthlyHighlights[month].length > 0).map(month => `
        <div class="month-section">
            <h2>${month} ${year}</h2>
            ${monthlyHighlights[month].map(entry => `
                <div class="story-entry">
                    <div class="story-title">${entry.title}</div>
                    <div class="story-date">${format(new Date(entry.entry_date), 'MMMM d, yyyy')}</div>
                    <div class="story-content">${entry.content}</div>
                    <span class="mood-badge">${entry.mood}</span>
                </div>
            `).join('')}
        </div>
    `).join('')}

    ${milestones.length > 0 ? `
    <h2>🌟 Milestones & Achievements</h2>
    ${milestones.map(entry => `
        <div class="story-entry">
            <div class="story-title">🎯 ${entry.title}</div>
            <div class="story-date">${format(new Date(entry.entry_date), 'MMMM d, yyyy')}</div>
            <div class="story-content">${entry.content}</div>
        </div>
    `).join('')}
    ` : ''}

    ${photos.length > 0 ? `
    <h2>📸 Photo Memories</h2>
    <div class="photos-grid">
        ${photos.slice(0, 12).map(photo => `<img src="${photo}" alt="Memory" class="photo">`).join('')}
    </div>
    ` : ''}

    <div style="margin-top: 50px; text-align: center; color: #64748b; font-style: italic;">
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
        <p>Made with ❤️ for ${pet.name}</p>
    </div>
</body>
</html>`;
    };

    if (!isOpen || !pet) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <BookOpenIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Pet Yearbook Generator</h2>
                                <p className="text-white/80">Create {pet.name}'s story summary</p>
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

                {/* Content */}
                <div className="p-6">
                    {!yearbookData ? (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                                <SparklesIcon className="w-12 h-12 text-purple-500" />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Create {pet.name}'s Yearbook
                                </h3>
                                <p className="text-gray-600 mb-8">
                                    Generate a beautiful summary of all the memories, milestones, and precious moments 
                                    you've captured in {pet.name}'s diary.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={generateYearbook}
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <BookOpenIcon className="w-5 h-5" />
                                )}
                                {loading ? 'Generating...' : 'Generate Yearbook'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Yearbook Preview */}
                            <div className="text-center border-b border-gray-200 pb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {yearbookData.pet.name}'s {yearbookData.year} Yearbook
                                </h3>
                                <p className="text-gray-600">Ready to download</p>
                            </div>

                            {/* Stats Preview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{yearbookData.totalEntries}</div>
                                    <div className="text-sm text-blue-800">Total Entries</div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{yearbookData.favoriteEntries.length}</div>
                                    <div className="text-sm text-yellow-800">Favorites</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{yearbookData.milestones.length}</div>
                                    <div className="text-sm text-green-800">Milestones</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{yearbookData.photos.length}</div>
                                    <div className="text-sm text-purple-800">Photos</div>
                                </div>
                            </div>

                            {/* Sample Content */}
                            {yearbookData.favoriteEntries.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Sample Content Preview</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                                        {yearbookData.favoriteEntries.slice(0, 2).map((entry, index) => (
                                            <div key={index} className="mb-3 last:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <StarIcon className="w-4 h-4 text-yellow-500" />
                                                    <span className="font-medium text-gray-900">{entry.title}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Download Options */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                                <button
                                    onClick={downloadAsHTML}
                                    disabled={generatingPDF}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {generatingPDF ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                    )}
                                    Download HTML Yearbook
                                </button>
                                
                                <button
                                    onClick={() => setYearbookData(null)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Generate Another
                                </button>
                            </div>

                            <div className="text-xs text-gray-500 text-center">
                                The HTML file can be opened in any browser and printed as PDF if needed.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}