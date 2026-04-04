import { z } from 'zod';

const phoneRegex = /^(?:[6-9]\d{9}|\+?[1-9]\d{1,14})$/;
const indiaPostalRegex = /^[1-9][0-9]{5}$/;
const usaPostalRegex = /^\d{5}(-\d{4})?$/;
const ukPostalRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
const canadaPostalRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
const fallbackPostalRegex = /^[A-Za-z0-9\s-]{3,10}$/;

// --- Sub-Schemas for Nested Structure ---

const parentInfoSchema = z.object({
  name: z.string().min(3, "Parent name must be at least 3 characters").optional(),
  email: z.string().email("Invalid parent email address").optional().or(z.literal('')),
  phoneNumber: z.string().regex(phoneRegex, "Invalid parent phone number format").optional(),
  relationship: z.string().min(2, "Relationship must be at least 2 characters").optional(),
}).optional();

const contactInfoSchema = z.object({
  address: z.string().min(10, "Address must be at least 10 characters").optional(),
  country: z.string().min(2, "Country is required").optional(),
  postalCode: z.string().min(3, "Postal code is required").optional(),
  parentInfo: parentInfoSchema,
}).optional();

const academicDetailsSchema = z.object({
  institutionName: z.string().min(3, "Institution name must be at least 3 characters").optional(),
  grade: z.string().optional(), // Flexible for backward compatibility
  syllabus: z.string().optional(),
}).optional();

// --- Main Schema with Dual-Format Support ---

export const updateStudentProfileSchema = z.object({
  // Root Basic Fields
  fullName: z.string().min(3, "Full name must be at least 3 characters").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  emailId: z.string().email("Invalid email address").optional(), // Compatibility
  phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format").optional(),
  dateOfBirth: z.string().optional(),
  age: z.coerce.number().int().min(10).max(20).optional(),
  gender: z.string().optional(),
  goal: z.string().optional(),
  learningGoal: z.string().optional(), // Compatibility

  // Flat Compatibility Fields
  address: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().optional(),
  parentPhone: z.string().optional(),
  relationship: z.string().optional(),
  institution: z.string().optional(),
  institutionName: z.string().optional(),
  grade: z.string().optional(),
  syllabus: z.string().optional(),

  // Nested Target Structure
  contactInfo: contactInfoSchema,
  academicDetails: academicDetailsSchema,

  // Assets
  profileImage: z.string().optional().nullable(),
  idProof: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // 1. Resolve effective values based on precedence (Nested > Flat)
  const country = data.contactInfo?.country || data.country;
  const postalCode = data.contactInfo?.postalCode || data.postalCode;
  
  const parentPhone = data.contactInfo?.parentInfo?.phoneNumber || data.parentPhone;
  const dob = data.dateOfBirth;
  const age = data.age;

  // 2. Postal Code Validation (only if both are present)
  if (country && postalCode) {
    let isValid = true;
    let message = "Invalid Postal Code format";

    if (country === "India") {
      isValid = indiaPostalRegex.test(postalCode);
      message = "Invalid Indian Postal Code (must be 6 digits)";
    } else if (country === "USA") {
      isValid = usaPostalRegex.test(postalCode);
      message = "Invalid US ZIP Code";
    } else if (country === "UK") {
      isValid = ukPostalRegex.test(postalCode);
      message = "Invalid UK Postcode";
    } else if (country === "Canada") {
      isValid = canadaPostalRegex.test(postalCode);
      message = "Invalid Canadian Postal Code";
    } else {
      isValid = fallbackPostalRegex.test(postalCode);
    }

    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: data.contactInfo?.postalCode ? ["contactInfo", "postalCode"] : ["postalCode"],
      });
    }
  }

  // 3. Parent Phone Validation (if present)
  if (parentPhone && !phoneRegex.test(parentPhone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid parent phone number format",
      path: data.contactInfo?.parentInfo?.phoneNumber ? ["contactInfo", "parentInfo", "phoneNumber"] : ["parentPhone"],
    });
  }

  // 4. Age & DOB Consistency
  if (dob && age) {
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Check if DOB is a valid date
    if (isNaN(birthDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date of birth format",
        path: ["dateOfBirth"],
      });
    } else {
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      // Allow 1 year margin for edge cases or simple year-based checks
      if (Math.abs(calculatedAge - age) > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Age (${age}) does not match Date of Birth (${calculatedAge} years)`,
          path: ["age"],
        });
      }

      if (calculatedAge < 10 || calculatedAge > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Age must be between 10 and 20 years",
          path: ["dateOfBirth"],
        });
      }
    }
  }
}).passthrough();

export type UpdateStudentProfileDto = z.infer<typeof updateStudentProfileSchema>;