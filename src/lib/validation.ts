import { z } from "zod";
import { COURSE_OPTIONS, YEAR_OPTIONS } from "@/lib/types";

export const posterFormSchema = z.object({
  rollNumber: z.string().trim().min(3).max(30),
  department: z.string().trim().min(2).max(80),
  year: z.enum(YEAR_OPTIONS),
  course: z.enum(COURSE_OPTIONS),
  email: z.string().trim().email(),
  section: z.string().trim().min(1).max(30),
});

export const createOrderSchema = posterFormSchema;

export const paymentVerifySchema = posterFormSchema.extend({
  databaseOrderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});