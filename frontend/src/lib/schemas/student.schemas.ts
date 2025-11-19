import { z } from 'zod';

// For CREATING new students - all fields required
export const adminCreateStudentSchema = z.object({
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters") // Increased from 20
    .regex(/^[A-Za-z\s]+$/, "Full name can only contain letters and spaces"),
  email: z.string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"), // Increased from 50
  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .max(15, "Phone number must be at most 15 characters")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

// For EDITING existing students - all fields optional but with validation when provided
export const adminUpdateStudentSchema = z.object({
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters")
    .regex(/^[A-Za-z\s]+$/, "Full name can only contain letters and spaces")
    .optional()
    .refine(val => !val || val.length > 0, "Full name cannot be empty"),
  email: z.string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters")
    .optional()
    .refine(val => !val || val.length > 0, "Email cannot be empty"),
  phoneNumber: z.string()
    .max(15, "Phone number must be at most 15 characters")
    .regex(/^\d+$/, "Phone number must contain only digits")
    .optional()
    .refine(val => !val || val.length > 0, "Phone number cannot be empty"),
});

// Types for both
export type AdminCreateStudentInput = z.infer<typeof adminCreateStudentSchema>;
export type AdminUpdateStudentInput = z.infer<typeof adminUpdateStudentSchema>;