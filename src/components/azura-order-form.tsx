"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  AZURA_CATEGORY_LABELS,
  AZURA_CUSTOM_MIN_AREA,
  AZURA_CUSTOM_MIN_DIMENSION,
  AZURA_CUSTOM_PRICE_PER_SQ_FT,
  AZURA_DEPT_WISE_POSTER_OPTIONS,
  AZURA_ORDER_CATEGORY_OPTIONS,
  AZURA_STALL_POSTER_OPTIONS,
  calculateAzuraOrderDetails,
  formatCurrencyAmount,
  type AzuraOrderCategory,
  type AzuraPosterFormValues,
} from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

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

const createInitialValues = (orderCategory: AzuraOrderCategory): AzuraPosterFormValues => {
  const sharedValues = {
    name: "",
    phone: "",
    email: "",
    gdriveUrl: "",
  };

  if (orderCategory === "stall") {
    return {
      ...sharedValues,
      orderCategory,
      sizeKey: AZURA_STALL_POSTER_OPTIONS[0].key,
    };
  }

  if (orderCategory === "customised") {
    return {
      ...sharedValues,
      orderCategory,
      width: AZURA_CUSTOM_MIN_DIMENSION,
      height: AZURA_CUSTOM_MIN_DIMENSION,
    };
  }

  return {
    ...sharedValues,
    orderCategory,
    sizeKey: AZURA_DEPT_WISE_POSTER_OPTIONS[0].key,
  };
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

export function AzuraOrderForm() {
  const [values, setValues] = useState<AzuraPosterFormValues>(createInitialValues("dept-wise"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  const orderDetails = useMemo(() => calculateAzuraOrderDetails(values), [values]);
  const isCustomAreaValid =
    values.orderCategory !== "customised" || orderDetails.area >= AZURA_CUSTOM_MIN_AREA;
  const isReady = useMemo(
    () =>
      Boolean(
        values.name &&
          values.phone &&
          values.email &&
          values.gdriveUrl &&
          isCustomAreaValid,
      ),
    [isCustomAreaValid, values],
  );

  const handleCategoryChange = (nextCategory: AzuraOrderCategory) => {
    setValues((current) => {
      if (current.orderCategory === nextCategory) {
        return current;
      }

      const nextValues = createInitialValues(nextCategory);

      return {
        ...nextValues,
        name: current.name,
        phone: current.phone,
        email: current.email,
        gdriveUrl: current.gdriveUrl,
      };
    });
    setStatus({ kind: "idle", message: "" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isCustomAreaValid) {
      setStatus({
        kind: "error",
        message: `Minimum area for customised posters is ${AZURA_CUSTOM_MIN_AREA} sq ft.`,
      });
      return;
    }

    const activeCategory = values.orderCategory;

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
        description: `${orderDetails.orderLabel} • ${orderDetails.sizeLabel}`,
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
          setValues(createInitialValues(activeCategory));
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
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {AZURA_ORDER_CATEGORY_OPTIONS.map((orderCategory) => (
          <button
            key={orderCategory}
            className={clsx(
              "rounded-3xl border px-5 py-4 text-left transition",
              values.orderCategory === orderCategory
                ? "border-amber-300 bg-amber-50 text-stone-950 shadow-[0_20px_50px_rgba(217,119,6,0.12)]"
                : "border-stone-200 bg-stone-50/70 text-stone-600 hover:border-stone-300 hover:bg-white",
            )}
            onClick={() => handleCategoryChange(orderCategory)}
            type="button"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Azura</p>
            <p className="mt-2 text-lg font-semibold">{AZURA_CATEGORY_LABELS[orderCategory]}</p>
          </button>
        ))}
      </div>

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

          {values.orderCategory === "customised" ? (
            <>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Poster width (ft)</span>
                <input
                  className="field"
                  inputMode="numeric"
                  min={AZURA_CUSTOM_MIN_DIMENSION}
                  onChange={(event) =>
                    setValues((current) =>
                      current.orderCategory === "customised"
                        ? {
                            ...current,
                            width: Number(event.target.value) || AZURA_CUSTOM_MIN_DIMENSION,
                          }
                        : current,
                    )
                  }
                  required
                  step={1}
                  type="number"
                  value={values.width}
                />
              </label>

              <label className="space-y-2 text-sm text-stone-700">
                <span>Poster height (ft)</span>
                <input
                  className="field"
                  inputMode="numeric"
                  min={AZURA_CUSTOM_MIN_DIMENSION}
                  onChange={(event) =>
                    setValues((current) =>
                      current.orderCategory === "customised"
                        ? {
                            ...current,
                            height: Number(event.target.value) || AZURA_CUSTOM_MIN_DIMENSION,
                          }
                        : current,
                    )
                  }
                  required
                  step={1}
                  type="number"
                  value={values.height}
                />
              </label>
            </>
          ) : (
            <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
              <span>Poster size</span>
              <select
                className="field"
                onChange={(event) =>
                  setValues((current) =>
                    current.orderCategory === "dept-wise"
                      ? {
                          ...current,
                          sizeKey: event.target.value as (typeof AZURA_DEPT_WISE_POSTER_OPTIONS)[number]["key"],
                        }
                      : current.orderCategory === "stall"
                        ? {
                            ...current,
                            sizeKey: event.target.value as (typeof AZURA_STALL_POSTER_OPTIONS)[number]["key"],
                          }
                        : current,
                  )
                }
                value={values.sizeKey}
              >
                {(values.orderCategory === "dept-wise"
                  ? AZURA_DEPT_WISE_POSTER_OPTIONS
                  : AZURA_STALL_POSTER_OPTIONS
                ).map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.width} x {option.height} - Rs. {option.price}
                  </option>
                ))}
              </select>
            </label>
          )}

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
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Selected order</p>
          <p className="mt-2 text-xl font-semibold text-stone-950">
            {orderDetails.orderLabel} • {orderDetails.sizeLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span>Area: {orderDetails.area} sq ft</span>
            {values.orderCategory === "customised" ? (
              <span>Rate: Rs. {AZURA_CUSTOM_PRICE_PER_SQ_FT} per sq ft</span>
            ) : null}
          </div>
          {values.orderCategory === "customised" && !isCustomAreaValid ? (
            <p className="mt-3 rounded-2xl bg-rose-100 px-3 py-2 text-xs text-rose-700">
              Minimum order area for customised posters is {AZURA_CUSTOM_MIN_AREA} sq ft.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-stone-950 px-5 py-4 text-sm text-stone-100 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Amount payable</p>
            <div className="flex items-baseline gap-3">
              <p className="text-xl font-semibold">Rs. {formatCurrencyAmount(orderDetails.totalAmount)}</p>
              <p className="text-xs text-stone-400">
                Rs. {formatCurrencyAmount(orderDetails.baseAmount)} + Rs. {formatCurrencyAmount(orderDetails.platformFee)} platform fee
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