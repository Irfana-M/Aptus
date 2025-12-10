import { z } from 'zod';

// Mentor Profile Update Schema
export const updateMentorProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  bio: z.string().max(1000).optional(),
  education: z.array(z.object({
    degree: z.string().max(200),
    institution: z.string().max(200),
    year: z.number().int().min(1950).max(new Date().getFullYear())
  })).optional(),
  experience: z.array(z.object({
    title: z.string().max(200),
    company: z.string().max(200),
    years: z.number().int().min(0).max(50)
  })).optional(),
  subjectProficiency: z.array(z.object({
    subject: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
  })).optional(),
  availability: z.array(z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    slots: z.array(z.string())
  })).optional()
});

export type UpdateMentorProfileDto = z.infer<typeof updateMentorProfileSchema>;

// Mentor Registration Schema
export const mentorRegistrationSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  bio: z.string().max(1000).optional()
});

export type MentorRegistrationDto = z.infer<typeof mentorRegistrationSchema>;

// Approve/Reject Mentor Schema
export const mentorApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().max(500).optional()
});

export type MentorApprovalDto = z.infer<typeof mentorApprovalSchema>;
