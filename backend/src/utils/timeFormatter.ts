
/**
 * Normalizes various time formats to HH:mm (24-hour) string
 * Handles "09:00", "09:00 AM", "9:00 PM", logic etc.
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
 * Checks if a mentor's slot covers a requested time range
 * slot: { startTime: "09:00", endTime: "10:00" } (normalized or not)
 * request: { start: "09:00 AM", end: "10:00 AM" }
 */
export const isSlotMatching = (
  slotStart: string, 
  slotEnd: string, 
  reqStart: string, 
  reqEnd: string
): boolean => {
  const normSlotStart = normalizeTimeTo24h(slotStart);
  const normSlotEnd = normalizeTimeTo24h(slotEnd);
  const normReqStart = normalizeTimeTo24h(reqStart);
  const normReqEnd = normalizeTimeTo24h(reqEnd);
  
  return (normSlotStart <= normReqStart) && (normSlotEnd >= normReqEnd);
};
