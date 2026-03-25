"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  CEER_ORDER_AMOUNT,
  getPlatformFee,
  DEPARTMENT_OPTIONS,
  type CeerPosterFormValues,
  type CourseOption,
  type DepartmentOption,
  type YearOption,
} from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const initialValues: CeerPosterFormValues = {
  rollNumber: "",
  department: "",
  year: "1",
  course: "ISI",
  email: "",
  section: "",
};

const loadRazorpayScript = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

type Status = {
  kind: "idle" | "error" | "success";
  message: string;
};

type CreateOrderSuccess = {
  orderId: string;
  databaseOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

type VerifyPaymentSuccess = {
  success: true;
  emailSent: boolean;
};

export function PosterUploadForm() {
  const [values, setValues] = useState<CeerPosterFormValues>(initialValues);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  const isReady = useMemo(
    () =>
      Boolean(
        values.rollNumber &&
          values.department &&
          values.year &&
          values.course &&
          values.email &&
          values.section &&
          posterFile,
      ),
    [posterFile, values],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!posterFile) {
      setStatus({ kind: "error", message: "Select a poster file before continuing." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const orderPayload = (await orderResponse.json()) as CreateOrderSuccess | { error: string };
      const orderError = "error" in orderPayload ? orderPayload.error : undefined;

      if (!orderResponse.ok || orderError) {
        throw new Error(orderError || "Unable to start payment.");
      }

      const createdOrder = orderPayload as CreateOrderSuccess;

      const checkout = new window.Razorpay({
        key: createdOrder.keyId,
        amount: createdOrder.amount,
        currency: createdOrder.currency,
        name: "Action Prints",
        description: "Poster upload payment",
        order_id: createdOrder.orderId,
        prefill: {
          email: values.email,
        },
        theme: {
          color: "#d97706",
        },
        handler: async (response: Record<string, string>) => {
          const payload = new FormData();
          payload.append("poster", posterFile);
          payload.append("databaseOrderId", createdOrder.databaseOrderId);
          payload.append("razorpayOrderId", response.razorpay_order_id);
          payload.append("razorpayPaymentId", response.razorpay_payment_id);
          payload.append("razorpaySignature", response.razorpay_signature);

          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            body: payload,
          });

          const verifyPayload = (await verifyResponse.json()) as VerifyPaymentSuccess | { error: string };
          const verifyError = "error" in verifyPayload ? verifyPayload.error : undefined;

          if (!verifyResponse.ok || verifyError) {
            throw new Error(verifyError || "Payment verification failed.");
          }

          const verifiedPayment = verifyPayload as VerifyPaymentSuccess;

          setStatus({
            kind: "success",
            message: verifiedPayment.emailSent
              ? "Payment completed. Your poster is stored and a confirmation email has been sent."
              : "Payment completed. Your poster is stored. Email sending is not configured yet.",
          });
          setValues(initialValues);
          setPosterFile(null);
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Payment flow failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone-700">
          <span>Student roll number</span>
          <input
            className="field"
            value={values.rollNumber}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                rollNumber: event.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
              }))
            }
            pattern="[A-Z0-9]+"
            placeholder="22BCE1001"
            required
            spellCheck={false}
          />
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Department</span>
          <select
            className="field"
            value={values.department}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                department: event.target.value as DepartmentOption | "",
              }))
            }
            required
          >
            <option value="">Select department</option>
            {DEPARTMENT_OPTIONS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Year</span>
          <select
            className="field"
            value={values.year}
            onChange={(event) =>
              setValues((current) => ({ ...current, year: event.target.value as YearOption }))
            }
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Course</span>
          <select
            className="field"
            value={values.course}
            onChange={(event) =>
              setValues((current) => ({ ...current, course: event.target.value as CourseOption }))
            }
          >
            <option value="ISI">ISI</option>
            <option value="EEP">EEP</option>
            <option value="SIP">SIP</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
          <span>Email</span>
          <input
            className="field"
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            placeholder="student@example.com"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
          <span>Section</span>
          <input
            className="field"
            maxLength={1}
            value={values.section}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                section: event.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase(),
              }))
            }
            pattern="[A-Za-z]"
            placeholder="A"
            required
          />
        </label>
      </div>

      <label className="block rounded-3xl border border-dashed border-amber-300 bg-amber-50/80 p-5 text-sm text-stone-700">
        <span className="mb-2 block font-medium text-stone-900">Poster upload</span>
        <input
          className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-white"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(event) => setPosterFile(event.target.files?.[0] ?? null)}
          required
        />
        <p className="mt-3 text-xs text-stone-500">Accepted formats: PDF, PNG, JPG, JPEG.</p>
      </label>

      <div className="flex flex-col gap-3 rounded-3xl bg-stone-950 px-5 py-4 text-sm text-stone-100 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Amount payable</p>
          <div className="flex items-baseline gap-3">
            <p className="text-xl font-semibold">Rs. {CEER_ORDER_AMOUNT + getPlatformFee(CEER_ORDER_AMOUNT)}</p>
            <p className="text-xs text-stone-400">
              Rs. {CEER_ORDER_AMOUNT} + Rs. {getPlatformFee(CEER_ORDER_AMOUNT)} platform fee
            </p>
          </div>
        </div>
        <button
          className={clsx(
            "rounded-full px-5 py-3 font-medium transition",
            isReady && !isSubmitting
              ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
              : "cursor-not-allowed bg-stone-800 text-stone-400",
          )}
          type="submit"
          disabled={!isReady || isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Upload and pay"}
        </button>
      </div>

      {status.kind !== "idle" ? (
        <p
          className={clsx(
            "rounded-2xl px-4 py-3 text-sm",
            status.kind === "success"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-700",
          )}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}