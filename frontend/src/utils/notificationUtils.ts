import type { NotificationUI } from "../types/notification.types";

/**
 * Centralized helper to build the display message for a notification.
 * Handles local time formatting for type-specific notifications.
 */
export const getNotificationMessage = (n: NotificationUI): string => {
  if (n.type === 'session_rescheduled' && n.payload?.startTime) {
    try {
      const localTime = new Date(n.payload.startTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return `Your session for ${n.payload.subjectName || 'Subject'} has been rescheduled to ${localTime}.`;
    } catch (e) {
      console.error("Failed to format notification time", e);
      return n.message; // Fallback to raw message
    }
  }

  // Add more type-specific formatting here if needed
  
  return n.message;
};
