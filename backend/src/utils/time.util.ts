
/**
 * Normalizes any time string to HH:mm (24-hour) format.
 * Handles: "09:00", "09:00 AM", "9:00 PM", "9:30", etc.
 */
export const normalizeTimeTo24h = (timeStr: string): string => {
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
 * Checks if a mentor's availability slot matches a requested filter.
 * Supports:
 * 1. Single time points (trial classes) - e.g., "09:00" matches "09:00-10:00"
 * 2. Time ranges (premium classes) - e.g., "09:00-10:00" matches "09:00-11:00"
 */
export const isSlotMatching = (
  slotStartTime: string,
  slotEndTime: string,
  filterStartTime: string,
  filterEndTime?: string
): boolean => {
  const normSlotStart = normalizeTimeTo24h(slotStartTime);
  const normSlotEnd = normalizeTimeTo24h(slotEndTime);
  const normReqStart = normalizeTimeTo24h(filterStartTime);

  // If no end time requested, it's a "point-in-time" check (trial class)
  if (!filterEndTime) {
    return normSlotStart <= normReqStart && normSlotEnd > normReqStart;
  }

  const normReqEnd = normalizeTimeTo24h(filterEndTime);
  
  // Full range match: Mentor slot must fully contain the requested range
  return normSlotStart <= normReqStart && normSlotEnd >= normReqEnd;
};

/**
 * Checks if a time falls within a predefined shift window.
 */
export const isShiftMatching = (
  startTime: string,
  shift: 'MORNING' | 'AFTERNOON'
): boolean => {
  const normStart = normalizeTimeTo24h(startTime);
  const shiftWindow = shift === 'MORNING' 
    ? { start: '09:00', end: '13:00' } 
    : { start: '14:00', end: '18:00' };

  return normStart >= shiftWindow.start && normStart < shiftWindow.end;
};
