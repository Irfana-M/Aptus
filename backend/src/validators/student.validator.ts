import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/; // Indian 10-digit mobile number

// Student Profile Update Schema - STRICT
export const updateStudentProfileSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be at most 100 characters"),

  emailId: z.string().email("Invalid email address").optional(),

  phoneNumber: z.string()
    .regex(phoneRegex, "Phone number must be 10 digits starting with 6-9")
    .optional(),

  dateOfBirth: z.string()
    .refine((dob) => {
      const date = new Date(dob);
      const minDate = new Date("2005-01-01");
      const maxDate = new Date("2015-12-31");
      return date >= minDate && date <= maxDate;
    }, "Date of birth must be between 2005 and 2015 (age between 10 and 20 years)"),

  // Correct way for enum with custom error message
  gender: z.enum(["Male", "Female", "Other"])
    .refine((val) => ["Male", "Female", "Other"].includes(val), {
      message: "Gender is required"
    }),

  age: z.number()
    .int("Age must be a whole number")
    .min(10, "Age must be at least 10")
    .max(20, "Age must be at most 20"),

  address: z.string()
    .min(10, "Address must be at least 10 characters long"),

  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(4, "Postal code is required"),

  parentName: z.string().min(3, "Parent name is required"),

  parentEmail: z.string()
    .email("Invalid parent email")
    .optional()
    .or(z.literal('')),

  parentPhone: z.string()
    .regex(phoneRegex, "Parent phone must be 10 digits starting with 6-9")
    .optional(),

  relationship: z.string().min(2, "Relationship is required"),

  institution: z.string().min(3, "Institution name is required"),

  // Correct way for grade enum
  grade: z.enum(["8", "9", "10"])
    .refine((val) => ["8", "9", "10"].includes(val), {
      message: "Grade must be 8th, 9th or 10th"
    }),

  syllabus: z.string().optional(),
  learningGoal: z.string()
    .min(10, "Learning goal must be at least 10 characters")
    .optional(),

  profileImage: z.string().optional().nullable(),
  idProof: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields for backward compatibility

export type UpdateStudentProfileDto = z.infer<typeof updateStudentProfileSchema>;