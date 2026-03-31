
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { Check, Save } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import toast from 'react-hot-toast';
import api from '../../api/api';
import { MentorLayout } from '../../components/mentor/MentorLayout';



interface AvailabilitySlot {
    startTime: string;
    endTime: string;
}

interface DayAvailability {
    day: string;
    slots: AvailabilitySlot[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00',
    '15:00-16:00', '16:00-17:00', '17:00-18:00',
    '18:00-19:00', '19:00-20:00', '20:00-21:00'
];

const MentorAvailabilityPage: React.FC = () => {
    // State: map of Day -> Set of selected TimeSlots
    const [availability, setAvailability] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);

    const fetchAvailability = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get<{ data: DayAvailability[] }>(`/availability/${user?._id}`);
            const data = response.data.data;
            
            const initialAvailability: Record<string, string[]> = {};
            DAYS.forEach(day => initialAvailability[day] = []);

            if (data && Array.isArray(data)) {
                data.forEach((dayData) => {
                    initialAvailability[dayData.day] = dayData.slots.map((s: AvailabilitySlot) => `${s.startTime}-${s.endTime}`);
                });
            }
            setAvailability(initialAvailability);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load availability");
        } finally {
            setLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        if (user?._id) {
            fetchAvailability();
        }
    }, [user?._id, fetchAvailability]);

    const toggleSlot = (day: string, slot: string) => {
        setAvailability(prev => {
            const daySlots = prev[day] || [];
            const newDaySlots = daySlots.includes(slot) 
                ? daySlots.filter(s => s !== slot)
                : [...daySlots, slot];
            
            return { ...prev, [day]: newDaySlots };
        });
    };

    const toggleDayAllSlots = (day: string, action: 'select' | 'clear') => {
        setAvailability(prev => {
            if (action === 'clear') {
                return { ...prev, [day]: [] };
            } else {
                return { ...prev, [day]: [...TIME_SLOTS] };
            }
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Transform back to API format
            const schedule = Object.entries(availability).map(([day, slots]) => ({
                day,
                slots: slots.map(s => {
                    const [startTime, endTime] = s.split('-');
                    return { startTime, endTime };
                })
            })).filter(d => d.slots.length > 0);

            await api.put(`/availability/${user?._id}`, { schedule });
            toast.success("Availability updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save availability");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MentorLayout title="Availability">
            <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Weekly Availability</h1>
                    <p className="text-gray-500 mt-1">Select the hours you are available to teach.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 min-w-[160px] justify-center"
                >
                    {loading ? (
                        <Loader size="sm" color="text-white" />
                    ) : (
                        <>
                            <Save size={20} />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 w-32">Day</th>
                                {TIME_SLOTS.map(slot => (
                                    <th key={slot} className="px-2 py-4 text-center text-xs font-medium text-gray-500 min-w-[100px]">
                                        {slot}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {DAYS.map(day => (
                                <tr key={day} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-100">
                                        <div className="flex flex-col gap-1">
                                            <span>{day}</span>
                                            <div className="flex gap-2 mt-1">
                                                <button 
                                                    onClick={() => toggleDayAllSlots(day, 'select')}
                                                    className="text-[10px] text-teal-600 font-bold hover:underline uppercase"
                                                >
                                                    All
                                                </button>
                                                <button 
                                                    onClick={() => toggleDayAllSlots(day, 'clear')}
                                                    className="text-[10px] text-red-500 font-bold hover:underline uppercase"
                                                >
                                                    None
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    {TIME_SLOTS.map(slot => {
                                        const isSelected = availability[day]?.includes(slot);
                                        return (
                                            <td key={`${day}-${slot}`} className="p-2 text-center">
                                                <button
                                                    onClick={() => toggleSlot(day, slot)}
                                                    className={`w-full h-10 rounded-md transition-all duration-200 border ${
                                                        isSelected 
                                                            ? 'bg-teal-500 border-teal-600 text-white shadow-sm' 
                                                            : 'bg-white border-gray-200 text-gray-300 hover:border-teal-300 hover:bg-teal-50'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={16} className="mx-auto" />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Alert 
                variant="info" 
                title="Instructional Note" 
                message="Students will book you based on these recurring slots. If you mark Monday 17:00-18:00 as available, a student can book you for every Monday at this time for the duration of the course." 
                className="mt-6"
            />
            </div>
        </MentorLayout>
    );
};

export default MentorAvailabilityPage;
