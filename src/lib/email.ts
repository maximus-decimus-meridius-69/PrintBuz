import nodemailer from "nodemailer";
import { getHasEmailConfig, getServerEnv } from "@/lib/env";
import { ORDER_AMOUNT } from "@/lib/types";
import type { PosterFormValues } from "@/lib/types";

const createTransporter = () => {
  const serverEnv = getServerEnv();

  return {
    serverEnv,
    transporter: nodemailer.createTransport({
      host: serverEnv.smtpHost,
      port: serverEnv.smtpPort,
      secure: serverEnv.smtpPort === 465,
      auth: {
        user: serverEnv.smtpUser,
        pass: serverEnv.smtpPass,
      },
    }),
  };
};

export const sendOrderConfirmationEmail = async (
  customer: PosterFormValues,
  orderId: string,
) => {
  if (!getHasEmailConfig()) {
    return false;
  }

  const { serverEnv, transporter } = createTransporter();

  await transporter.sendMail({
    from: serverEnv.smtpFrom,
    to: customer.email,
    subject: "CEER poster order confirmed",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Poster order confirmed</h2>
        <p>Your CEER poster upload and payment have been received successfully.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Amount paid:</strong> Rs. ${ORDER_AMOUNT}</p>
        <p><strong>Roll number:</strong> ${customer.rollNumber}</p>
        <p><strong>Department:</strong> ${customer.department}</p>
        <p><strong>Year:</strong> ${customer.year}</p>
        <p><strong>Course:</strong> ${customer.course}</p>
        <p><strong>Section:</strong> ${customer.section}</p>
        <p>You can keep this email as your confirmation receipt.</p>
      </div>
    `,
  });

  return true;
};

export const sendDeletionAuditEmail = async (input: {
  deletedBy: string;
  orderId: string;
  rollNumber: string;
  department: string;
  year: string;
  course: string;
  section: string;
  email: string;
}) => {
  if (!getHasEmailConfig()) {
    return false;
  }

  const { serverEnv, transporter } = createTransporter();

  if (!serverEnv.adminEmails.length) {
    return false;
  }

  await transporter.sendMail({
    from: serverEnv.smtpFrom,
    to: serverEnv.adminEmails.join(","),
    subject: `Poster order deleted: ${input.rollNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Poster order deleted</h2>
        <p>This record was deleted for audit purposes.</p>
        <p><strong>Deleted by:</strong> ${input.deletedBy}</p>
        <p><strong>Order ID:</strong> ${input.orderId}</p>
        <p><strong>Roll number:</strong> ${input.rollNumber}</p>
        <p><strong>Department:</strong> ${input.department}</p>
        <p><strong>Year:</strong> ${input.year}</p>
        <p><strong>Course:</strong> ${input.course}</p>
        <p><strong>Section:</strong> ${input.section}</p>
        <p><strong>Student email:</strong> ${input.email}</p>
      </div>
    `,
  });

  return true;
};