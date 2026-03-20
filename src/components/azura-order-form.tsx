"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  AZURA_POSTER_WIDTH,
  AZURA_PRICE_MAP,
  AZURA_SIZE_OPTIONS,
  getPlatformFee,
  type AzuraHeightOption,
  type AzuraPosterFormValues,
} from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const initialValues: AzuraPosterFormValues = {
  name: "",
  phone: "",
  email: "",
  height: 30,
  gdriveUrl: "",
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

export function AzuraOrderForm() {
  const [values, setValues] = useState<AzuraPosterFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  const isReady = useMemo(
    () =>
      Boolean(
        values.name && values.phone && values.email && values.height && values.gdriveUrl,
      ),
    [values],
  );

  const selectedPrice = AZURA_PRICE_MAP[values.height];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const orderResponse = await fetch("/api/azura/create-order", {
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
        description: `Poster size ${AZURA_POSTER_WIDTH} x ${values.height}`,
        order_id: createdOrder.orderId,
        prefill: {
          name: values.name,
          email: values.email,
          contact: values.phone,
        },
        theme: {
          color: "#d97706",
        },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/azura/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              databaseOrderId: createdOrder.databaseOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
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
              ? "Payment completed. Your Azura order is confirmed and a confirmation email has been sent."
              : "Payment completed. Your Azura order is confirmed. Email sending is not configured yet.",
          });
          setValues(initialValues);
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
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
          <p>Need help generating the Google Drive link?</p>
          <button
            className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-800 transition hover:bg-stone-100"
            onClick={() => setShowInstructions(true)}
            type="button"
          >
            Instructions
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone-700">
          <span>Name</span>
          <input
            className="field"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your full name"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Contact number</span>
          <input
            className="field"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            value={values.phone}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                phone: event.target.value.replace(/\D/g, "").slice(0, 10),
              }))
            }
            placeholder="9876543210"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
          <span>Email</span>
          <input
            className="field"
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Poster width</span>
          <input className="field bg-stone-100" readOnly value={AZURA_POSTER_WIDTH} />
        </label>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Poster height</span>
          <select
            className="field"
            value={values.height}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                height: Number(event.target.value) as AzuraHeightOption,
              }))
            }
          >
            {AZURA_SIZE_OPTIONS.map((height) => (
              <option key={height} value={height}>
                {AZURA_POSTER_WIDTH} x {height} - Rs. {AZURA_PRICE_MAP[height]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
          <span>Google Drive link</span>
          <input
            className="field"
            type="url"
            value={values.gdriveUrl}
            onChange={(event) =>
              setValues((current) => ({ ...current, gdriveUrl: event.target.value }))
            }
            placeholder="https://drive.google.com/file/d/..."
            required
          />
          <p className="text-xs text-stone-500">Share a Google Drive view link with access enabled for the admin team.</p>
        </label>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-stone-700">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Selected size</p>
          <p className="mt-2 text-xl font-semibold text-stone-950">
            {AZURA_POSTER_WIDTH} x {values.height} at Rs. {selectedPrice}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-stone-950 px-5 py-4 text-sm text-stone-100 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Amount payable</p>
            <div className="flex items-baseline gap-3">
              <p className="text-xl font-semibold">Rs. {selectedPrice + getPlatformFee(selectedPrice)}</p>
              <p className="text-xs text-stone-400">
                Rs. {selectedPrice} + Rs. {getPlatformFee(selectedPrice)} platform fee
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
            {isSubmitting ? "Processing..." : "Continue to payment"}
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

      {showInstructions ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_100px_rgba(28,25,23,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="display-font text-xs uppercase tracking-[0.35em] text-amber-700">Instructions</p>
                <h2 className="display-font mt-3 text-3xl text-stone-950">How to create a Google Drive link</h2>
              </div>
              <button
                aria-label="Close instructions"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                onClick={() => setShowInstructions(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
              <p>Follow these steps before you paste the link into the Azura form.</p>
              <ol className="list-decimal space-y-3 pl-5">
                <li>Upload your poster file to Google Drive.</li>
                <li>Right click the uploaded file and choose <strong>Share</strong>.</li>
                <li>Under General access, change the permission to <strong>Anyone with the link</strong>.</li>
                <li>Set the permission to <strong>Viewer</strong> so the file can be opened without edit access.</li>
                <li>Click <strong>Copy link</strong>.</li>
                <li>Paste that copied link into the Google Drive link field in the Azura form.</li>
              </ol>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                Use a file link, not a folder link. If the file is restricted to specific users, the admin team will not be able to open it.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}