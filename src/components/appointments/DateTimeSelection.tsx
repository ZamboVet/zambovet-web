'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns';
import {
    CalendarDaysIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

interface DateTimeSelectionProps {
    veterinarianId: number;
    selectedDate: string;
    selectedTime: string;
    onSelect: (date: string, time: string) => void;
}

export default function DateTimeSelection({
    veterinarianId,
    selectedDate,
    selectedTime,
    onSelect
}: DateTimeSelectionProps) {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<{ [key: string]: string[] }>({});
    const [loading, setLoading] = useState(false);

    // Generate time slots (9 AM to 5 PM, 30-minute intervals)
    const generateTimeSlots = () => {
        const slots = [];
        
        // Morning slots (9:00 AM - 12:00 PM)
        for (let hour = 9; hour <= 12; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 12) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        
        // Afternoon slots (1:00 PM - 5:00 PM)
        for (let hour = 13; hour <= 17; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 17) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        
        return slots;
    };
    
    // Function to check if a time slot is in the past for today's date
    const isTimeSlotPast = (timeValue: string, dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        
        // Only check for today's date
        if (dateStr !== today) {
            return false;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const [hour, minute] = timeValue.split(':').map(Number);
        
        // If selected hour is less than current hour, it's in the past
        if (hour < currentHour) {
            return true;
        }
        
        // If same hour but selected minute is less than current minute, it's in the past
        if (hour === currentHour && minute <= currentMinute) {
            return true;
        }
        
        return false;
    };

    const timeSlots = generateTimeSlots();

    useEffect(() => {
        if (veterinarianId) {
            fetchAvailableSlots();
        }
    }, [veterinarianId, currentWeek]);

    const fetchAvailableSlots = async () => {
        setLoading(true);
        try {
            // Simulate API call to fetch available slots
            // In a real app, this would check the veterinarian's schedule and existing appointments
            const slots: { [key: string]: string[] } = {};

            for (let i = 0; i < 7; i++) {
                const date = addDays(startOfWeek(currentWeek), i);
                const dateStr = format(date, 'yyyy-MM-dd');

                // Don't show past dates
                if (isBefore(date, new Date()) && !isToday(date)) {
                    slots[dateStr] = [];
                } else {
                    // Simulate some random availability and filter out past times
                    const availableSlots = timeSlots
                        .filter(() => Math.random() > 0.3)
                        .filter(timeSlot => !isTimeSlotPast(timeSlot, dateStr));
                    slots[dateStr] = availableSlots;
                }
            }

            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error fetching available slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const weekDays = Array.from({ length: 7 }, (_, i) =>
        addDays(startOfWeek(currentWeek), i)
    );

    const goToPreviousWeek = () => {
        setCurrentWeek(addDays(currentWeek, -7));
    };

    const goToNextWeek = () => {
        setCurrentWeek(addDays(currentWeek, 7));
    };

    const handleDateTimeSelect = (date: Date, time: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        onSelect(dateStr, time);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Select Date & Time
                </h2>
                <p className="text-gray-600">
                    Choose your preferred appointment date and time
                </p>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    type="button"
                    onClick={goToPreviousWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Previous week"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="text-lg font-medium text-gray-800">
                    {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                </h3>

                <button
                    type="button"
                    onClick={goToNextWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Next week"
                >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse">
                    <div className="grid grid-cols-7 gap-4 mb-6">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2 mb-6">
                        {weekDays.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const hasSlots = availableSlots[dateStr]?.length > 0;
                            const isSelected = selectedDate === dateStr;
                            const isPast = isBefore(date, new Date()) && !isToday(date);

                            return (
                                <div
                                    key={dateStr}
                                    className={`p-4 text-center rounded-lg border-2 transition-all duration-200 ${isPast
                                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : hasSlots
                                                ? isSelected
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                    : 'border-gray-200 hover:border-teal-300 cursor-pointer'
                                                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                    onClick={() => !isPast && hasSlots && onSelect(dateStr, '')}
                                    role={hasSlots && !isPast ? 'button' : undefined}
                                    tabIndex={hasSlots && !isPast ? 0 : -1}
                                    aria-selected={isSelected}
                                >
                                    <div className="text-xs font-medium mb-1">
                                        {format(date, 'EEE')}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {format(date, 'd')}
                                    </div>
                                    <div className="text-xs mt-1">
                                        {isPast ? 'Past' : hasSlots ? `${availableSlots[dateStr].length} slots` : 'No slots'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time Slots */}
                    {selectedDate && availableSlots[selectedDate]?.length > 0 && (
                        <div>
                            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                <ClockIcon className="w-5 h-5 mr-2" />
                                Available Times for {format(new Date(selectedDate), 'EEEE, MMM d')}
                            </h4>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {availableSlots[selectedDate]
                                    .filter(time => !isTimeSlotPast(time, selectedDate))
                                    .map((time) => {
                                        const isPast = isTimeSlotPast(time, selectedDate);
                                        return (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => !isPast && handleDateTimeSelect(new Date(selectedDate), time)}
                                                disabled={isPast}
                                                className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                                    isPast
                                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : selectedTime === time
                                                            ? 'border-teal-500 bg-teal-500 text-white'
                                                            : 'border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50'
                                                }`}
                                            >
                                                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {selectedDate && availableSlots[selectedDate]?.length === 0 && (
                        <div className="text-center py-8">
                            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No available time slots for this date</p>
                            <p className="text-sm text-gray-400 mt-1">Please select another date</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
