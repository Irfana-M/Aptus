import { z } from "zod";

export const studentRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least three characters long")
      .max(100, "Full name must be at most 100 characters")
      .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, apostrophes, and hyphens"),

    email: z.string().email("Invalid email address"),

    phoneNumber: z
      .string()
      .min(10, "Phone must be at least 10 digits")
      .max(15, "Phone must be at most 15 digits")
      .regex(/^[0-9]+$/, "Phone must contain only numbers"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(32, "Password must be at most 32 characters")
      .refine(
        (val) => /[0-9]/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val),
        {
          message:
            "Password must contain at least one number and one special character",
        }
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });


export const adminCreateStudentSchema = z.object({
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
});


export const adminUpdateStudentSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least three characters long")
    .max(100, "Full name must be at most 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, apostrophes, and hyphens")
    .optional()
    .transform((val) => val?.trim()),

  email: z.string()
    .email("Invalid email address")
    .max(100, "Email must not exceed 100 characters")
    .optional()
    .transform((val) => val?.toLowerCase().trim()),

  phoneNumber: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits")
    .regex(/^[0-9]+$/, "Phone must contain only numbers")
    .optional()
    .or(z.literal(''))
    .transform((val) => val?.trim() || ''),
});


export const studentProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least three characters long")
    .max(100, "Full name must be at most 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, apostrophes, and hyphens")
    .optional()
    .transform((val) => val?.trim()),

  phoneNumber: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits")
    .regex(/^[0-9]+$/, "Phone must contain only numbers")
    .optional()
    .or(z.literal(''))
    .transform((val) => val?.trim() || ''),

  age: z.number()
    .min(5, "Age must be at least 5")
    .max(100, "Age must be at most 100")
    .optional(),

  gender: z.string()
    .max(50, "Gender must not exceed 50 characters")
    .optional(),

  dateOfBirth: z.string()
    .datetime("Invalid date format")
    .optional(),

  contactInfo: z.object({
    parentInfo: z.object({
      name: z.string().max(100, "Parent name too long").optional(),
      email: z.string().email("Invalid parent email").optional(),
      phoneNumber: z.string().max(15, "Parent phone too long").optional(),
    }).optional(),
    address: z.string().max(200, "Address too long").optional(),
    country: z.string().max(50, "Country name too long").optional(),
    postalCode: z.string().max(10, "Postal code too long").optional(),
  }).optional(),

  academicDetails: z.object({
    institutionName: z.string().max(100, "Institution name too long").optional(),
    grade: z.string().max(20, "Grade too long").optional(),
    syllabus: z.string().max(50, "Syllabus too long").optional(),
  }).optional(),

  goal: z.string().max(500, "Goal too long").optional(),
});


export const studentIdSchema = z.string()
  .min(1, "Student ID is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format");

export const mentorIdSchema = z.string()
  .min(1, "Mentor ID is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid mentor ID format");


export const blockActionSchema = z.object({
  targetId: z.string().min(1, "ID is required"),
  reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
});


export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


export const studentPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});


export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type AdminCreateStudentInput = z.infer<typeof adminCreateStudentSchema>;
export type AdminUpdateStudentInput = z.infer<typeof adminUpdateStudentSchema>;
export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type StudentPasswordResetInput = z.infer<typeof studentPasswordResetSchema>;