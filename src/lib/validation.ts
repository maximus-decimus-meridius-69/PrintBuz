import { z } from "zod";
import {
  AZURA_CUSTOM_MIN_AREA,
  AZURA_CUSTOM_MIN_DIMENSION,
  AZURA_DEPT_WISE_POSTER_OPTIONS,
  AZURA_STALL_POSTER_OPTIONS,
  COURSE_OPTIONS,
  DEPARTMENT_OPTIONS,
  YEAR_OPTIONS,
} from "@/lib/types";

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
  rollNumber: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Roll number must contain only uppercase letters and numbers."),
  department: z.enum(DEPARTMENT_OPTIONS),
  year: z.enum(YEAR_OPTIONS),
  course: z.enum(COURSE_OPTIONS),
  email: z.string().trim().email(),
  section: z.string().trim().regex(/^[A-Za-z]$/, "Section should be a single alphabet."),
});

const azuraContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  email: z.string().trim().email(),
  gdriveUrl: googleDriveUrlSchema,
});

const azuraPosterSchemaBase = z.discriminatedUnion("orderCategory", [
  azuraContactSchema.extend({
    orderCategory: z.literal("dept-wise"),
    sizeKey: z.enum(AZURA_DEPT_WISE_POSTER_OPTIONS.map((option) => option.key) as [string, ...string[]]),
  }),
  azuraContactSchema.extend({
    orderCategory: z.literal("stall"),
    sizeKey: z.enum(AZURA_STALL_POSTER_OPTIONS.map((option) => option.key) as [string, ...string[]]),
  }),
  azuraContactSchema
    .extend({
      orderCategory: z.literal("customised"),
      width: z.coerce
        .number()
        .int()
        .min(AZURA_CUSTOM_MIN_DIMENSION, `Width must be at least ${AZURA_CUSTOM_MIN_DIMENSION} feet.`),
      height: z.coerce
        .number()
        .int()
        .min(AZURA_CUSTOM_MIN_DIMENSION, `Height must be at least ${AZURA_CUSTOM_MIN_DIMENSION} feet.`),
    }),
]);

export const azuraPosterFormSchema = azuraPosterSchemaBase.superRefine((value, context) => {
  if (value.orderCategory === "customised" && value.width * value.height < AZURA_CUSTOM_MIN_AREA) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Minimum order area is ${AZURA_CUSTOM_MIN_AREA} sq ft.`,
      path: ["width"],
    });
  }
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