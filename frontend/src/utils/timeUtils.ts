
/**
 * Normalizes time string to 24h format (HH:mm)
 */
export const normalizeTo24h = (timeStr: string): string => {
  if (!timeStr) return "00:00";
  
  const trimmed = timeStr.trim();
  const parts = trimmed.split(' ');
  const timePart = parts[0] || "00:00";
  const modifier = parts[1]; // AM or PM
  
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  
  if (modifier) {
    const mod = modifier.toLowerCase();
    if (mod === 'pm' && h < 12) h += 12;
    if (mod === 'am' && h === 12) h = 0;
  }
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Creates a time range string starting from the given time with 1 hour duration
 */
export const createDefaultTimeRange = (startTime: string): string => {
    const normalizedStart = normalizeTo24h(startTime);
    const [h, m] = normalizedStart.split(':').map(Number);
    const endH = (h + 1) % 24;
    const endStr = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return `${normalizedStart}-${endStr}`;
};

/**
 * Checks if a class is overdue based on date and time
 */
export const isClassOverdue = (date: string, time: string): boolean => {
    if (!date || !time) return false;
    try {
        const normalizedTime = normalizeTo24h(time);
        const [h, m] = normalizedTime.split(':').map(Number);
        const classDate = new Date(date);
        classDate.setHours(h, m, 0, 0);
        return classDate < new Date();
    } catch (e) {
        console.error('Error checking if class is overdue:', e);
        return false;
    }
};

/**
 * Determines if a session is joinable (standard: 60 minutes before start)
 */
export const isSessionJoinable = (startTime: string | Date | undefined): boolean => {
    if (!startTime) return false;
    try {
        const start = new Date(startTime);
        const now = new Date();
        const oneHourBefore = new Date(start.getTime() - (60 * 60 * 1000));
        return now >= oneHourBefore;
    } catch (e) {
        return false;
    }
};
