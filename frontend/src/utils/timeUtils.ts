
/**
 * Checks if a class is overdue based on its date and time.
 * @param dateStr ISO date string or Date object
 * @param timeStr Time string in HH:mm format (24-hour)
 * @returns boolean
 */
export const isClassOverdue = (dateStr: string | Date, timeStr: string): boolean => {
  if (!dateStr || !timeStr) return false;

  try {
    const classDate = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a date object for the scheduled time
    const scheduledDateTime = new Date(classDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    
    // A class is overdue if the current time is after the scheduled time + some buffer (e.g. 1 hour)
    // For now, let's say it's overdue if it's strictly passed.
    return now > scheduledDateTime;
  } catch (error) {
    console.error("Error parsing date/time in isClassOverdue:", error);
    return false;
  }
};
