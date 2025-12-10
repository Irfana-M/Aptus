import { z } from 'zod';

// Trial Class Creation Schema
export const createTrialClassSchema = z.object({
  subject: z.string().min(1, 'Subject is required').trim(),
  preferredDate: z.coerce.date().refine(
    (date) => date > new Date(),
    'Date must be in the future'
  ),
  preferredTime: z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'Invalid time format (HH:MM)'
  ),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export type CreateTrialClassDto = z.infer<typeof createTrialClassSchema>;

// Reschedule Trial Class Schema
export const rescheduleTrialClassSchema = z.object({
  newDateTime: z.coerce.date().refine(
    (date) => date > new Date(),
    'Date must be in the future'
  ),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
});

export type RescheduleTrialClassDto = z.infer<typeof rescheduleTrialClassSchema>;

// Assign Mentor Schema
export const assignMentorSchema = z.object({
  mentorId: z.string().min(1, 'Mentor ID is required'),
  scheduledDateTime: z.coerce.date().refine(
    (date) => date > new Date(),
    'Scheduled date must be in the future'
  )
});

export type AssignMentorDto = z.infer<typeof assignMentorSchema>;

// Update Trial Class Status Schema
export const updateTrialClassStatusSchema = z.object({
  status: z.enum(['requested', 'assigned', 'completed', 'cancelled']),
  notes: z.string().optional()
});

export type UpdateTrialClassStatusDto = z.infer<typeof updateTrialClassStatusSchema>;
