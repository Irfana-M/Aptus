import { z } from "zod";

export const adminCreateMentorSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least three characters long")
    .max(100, "Full name must be at most 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, apostrophes, and hyphens")
    .transform((val) => val.trim()),

  email: z.string()
    .email("Invalid email address")
    .max(100, "Email must not exceed 100 characters")
    .transform((val) => val.toLowerCase().trim()),

  phoneNumber: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits")
    .regex(/^[0-9]+$/, "Phone must contain only numbers")
    .optional()
    .or(z.literal(''))
    .transform((val) => val?.trim() || ''),

  location: z.string()
    .max(100, "Location must not exceed 100 characters")
    .optional()
    .transform((val) => val?.trim()),

  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional()
    .transform((val) => val?.trim()),
});

export const mentorProfileUpdateSchema = z.object({
  fullName: z.string().min(3).max(100).optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  academicQualifications: z.array(z.object({
    institutionName: z.string().max(100),
    degree: z.string().max(100),
    graduationYear: z.string().max(4),
  })).optional(),
  experiences: z.array(z.object({
    institution: z.string().max(100),
    jobTitle: z.string().max(100),
    duration: z.string().max(50),
  })).optional(),
  subjectProficiency: z.array(z.object({
    subject: z.string().max(50),
    level: z.enum(["basic", "intermediate", "expert"]),
  })).optional(),
  certification: z.array(z.object({
    name: z.string().max(100),
    issuingOrganization: z.string().max(100),
  })).optional(),
  availability: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    timeSlots: z.array(z.string()),
    timezone: z.string().default("UTC"),
  })).optional(),
  expertise: z.array(z.string()).optional(),
  maxStudentsPerWeek: z.number().min(1).max(50).optional(),
});

export type AdminCreateMentorInput = z.infer<typeof adminCreateMentorSchema>;
export type MentorProfileUpdateInput = z.infer<typeof mentorProfileUpdateSchema>;