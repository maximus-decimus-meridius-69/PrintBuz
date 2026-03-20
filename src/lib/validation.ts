import { z } from "zod";
import { AZURA_SIZE_OPTIONS, COURSE_OPTIONS, DEPARTMENT_OPTIONS, YEAR_OPTIONS } from "@/lib/types";

const googleDriveUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.hostname === "drive.google.com" || url.hostname === "docs.google.com";
      } catch {
        return false;
      }
    },
    { message: "Only Google Drive links are allowed." },
  );

export const ceerPosterFormSchema = z.object({
  rollNumber: z.string().trim().min(3).max(30),
  department: z.enum(DEPARTMENT_OPTIONS),
  year: z.enum(YEAR_OPTIONS),
  course: z.enum(COURSE_OPTIONS),
  email: z.string().trim().email(),
  section: z.string().trim().regex(/^[A-Za-z]$/, "Section should be a single alphabet."),
});

export const azuraPosterFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  email: z.string().trim().email(),
  height: z.coerce.number().refine(
    (value): value is (typeof AZURA_SIZE_OPTIONS)[number] =>
      AZURA_SIZE_OPTIONS.includes(value as (typeof AZURA_SIZE_OPTIONS)[number]),
    "Invalid poster height.",
  ),
  gdriveUrl: googleDriveUrlSchema,
});

export const ceerCreateOrderSchema = ceerPosterFormSchema;
export const azuraCreateOrderSchema = azuraPosterFormSchema;

export const ceerPaymentVerifySchema = z.object({
  databaseOrderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const azuraPaymentVerifySchema = z.object({
  databaseOrderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});