/**
 * Time Format Utilities
 * Standardize all time handling to 12-hour format (e.g., "04:00 PM")
 */

/**
 * Convert 24-hour time to 12-hour format
 * @param time24 - Time in 24-hour format (e.g., "16:00" or "16:00:00")
 * @returns Time in 12-hour format (e.g., "04:00 PM")
 */
export const formatTo12Hour = (time24: string): string => {
  if (!time24 || time24 === 'FLEXIBLE') return time24 || '';
  
  // Remove seconds if present
  const timeParts = time24.split(':');
  if (timeParts.length < 2) return time24; // Not a valid time format, return as is

  let hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];
  
  if (isNaN(hours)) return time24; // Not a valid hour
  
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
};

/**
 * Convert 12-hour time to 24-hour format
 * @param time12 - Time in 12-hour format (e.g., "04:00 PM")
 * @returns Time in 24-hour format (e.g., "16:00")
 */
export const formatTo24Hour = (time12: string): string => {
  if (!time12) return '';
  
  const [time, period] = time12.split(' ');
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Format time range to 12-hour format
 * @param startTime - Start time in 24-hour format (e.g., "16:00")
 * @param endTime - End time in 24-hour format (e.g., "17:00")
 * @returns Formatted range (e.g., "04:00 PM - 05:00 PM")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`;
};

/**
 * Parse time slot string
 * @param timeSlot - Time slot in various formats
 * @returns Object with start and end times in 24-hour format
 */
export const parseTimeSlot = (timeSlot: string): { start: string; end: string } => {
  // Handle "16:00-17:00" or "04:00 PM - 05:00 PM"
  const parts = timeSlot.split('-').map(t => t.trim());
  
  const start = parts[0].includes('M') ? formatTo24Hour(parts[0]) : parts[0];
  const end = parts[1].includes('M') ? formatTo24Hour(parts[1]) : parts[1];
  
  return { start, end };
};

/**
 * Generate time slots for a day (in 12-hour format)
 * @param startHour - Starting hour (0-23)
 * @param endHour - Ending hour (0-23)
 * @param intervalMinutes - Interval in minutes (default: 60)
 * @returns Array of time slot strings
 */
export const generateTimeSlots = (
  startHour: number = 8,
  endHour: number = 21
): string[] => {
  const slots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(formatTimeRange(startTime, endTime));
  }
  
  return slots;
};
