import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: number | null;
  onDateSelect: (date: number | null) => void; // Change to number to match the state
  availableDates?: number[];
}

export const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  availableDates = [] 
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const isDateAvailable = (day: number): boolean => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date should be in future and in available dates
    return date >= today && (availableDates.length === 0 || 
      availableDates.some(availDate => 
        new Date(availDate).toDateString() === date.toDateString()
      ));
  };

  const handleDateClick = (day: number): void => {
    if (!isDateAvailable(day)) return;
    
    // Create a proper Date object for the selected day
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Pass the timestamp (number) to match the expected type
    onDateSelect(selectedDateObj.getTime());
  };
  
  const days: JSX.Element[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isSelected = selectedDate === dateObj.getTime(); // Compare timestamps
    const isAvailable = isDateAvailable(day);
    const isToday = new Date().getDate() === day && 
                   new Date().getMonth() === currentMonth.getMonth() &&
                   new Date().getFullYear() === currentMonth.getFullYear();
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)} // Use the handler function
        disabled={!isAvailable}
        className={`p-2 text-sm rounded-full transition-all duration-200 ${
          isSelected 
            ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg transform scale-105' 
            : isToday
            ? 'bg-teal-100 text-teal-700 border-2 border-teal-300 font-semibold'
            : isAvailable
            ? 'text-gray-700 hover:bg-teal-100 hover:text-teal-700 hover:shadow-md'
            : 'text-gray-300 cursor-not-allowed line-through'
        }`}
      >
        {day}
      </button>
    );
  }
  
  return (
    <div className="mb-4">
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={prevMonth} 
            className="p-2 hover:bg-white rounded-full transition border border-gray-200 hover:border-gray-300"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900 text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button 
            onClick={nextMonth} 
            className="p-2 hover:bg-white rounded-full transition border border-gray-200 hover:border-gray-300"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-xs font-semibold text-gray-500 p-2">{day}</div>
          ))}
          {days}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-teal-100 rounded-full border-2 border-teal-300"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
