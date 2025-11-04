import { z } from "zod";

export const studentRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least three characters long")
      .max(100, "Full name must be at most 100 characters"),

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
