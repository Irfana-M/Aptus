import { z } from 'zod';

// Student Profile Update Schema
export const updateStudentProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  emailId: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email('Invalid parent email').optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  relationship: z.string().optional(),
  institution: z.string().optional(),
  grade: z.string().optional(),
  syllabus: z.string().optional(),
  learningGoal: z.string().optional(),
  profileImage: z.string().optional().nullable(),
  idProof: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  school: z.string().max(200).optional(),
}).passthrough(); // Allow additional fields to pass through

export type UpdateStudentProfileDto = z.infer<typeof updateStudentProfileSchema>;

// Student Registration Schema
export const studentRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format'
  ).optional()
});

export type StudentRegistrationDto = z.infer<typeof studentRegistrationSchema>;
