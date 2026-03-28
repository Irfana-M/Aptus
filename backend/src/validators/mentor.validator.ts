import { z } from 'zod';

export const updateMentorProfileSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters")
    .max(100),

  phoneNumber: z.string()
    .regex(/^[6-9]\d{9}$/, "Phone number must be 10 digits starting with 6-9"),

  bio: z.string().max(1000).optional(),

  education: z.array(z.object({
    degree: z.string().min(2).max(200),
    institution: z.string().min(2).max(200),
    year: z.number().int().min(1950).max(new Date().getFullYear())
  })).min(1, "At least one education entry is required"),

  experience: z.array(z.object({
    title: z.string().min(2).max(200),
    company: z.string().min(2).max(200),
    years: z.number().int().min(0).max(50)
  })).optional(),

  subjectProficiency: z.array(z.object({
    subject: z.string().min(2),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
  })).min(1, "At least one subject proficiency is required"),

  availability: z.array(z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    slots: z.array(z.string()).min(1, "At least one slot is required per day")
  })).min(1, "Availability is required")
});

export type UpdateMentorProfileDto = z.infer<typeof updateMentorProfileSchema>;