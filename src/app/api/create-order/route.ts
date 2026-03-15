import { NextResponse } from "next/server";
import { createRazorpayClient } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ORDER_AMOUNT_PAISE } from "@/lib/types";
import { createOrderSchema } from "@/lib/validation";

const isMissingEventColumnError = (error: unknown) => {
  return Boolean(
    error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("event") &&
      error.message.includes("schema cache"),
  );
};

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const json = await request.json();
    const parsed = createOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form values." }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const supabase = createSupabaseAdminClient();
    const baseInsertPayload = {
      id: orderId,
      roll_number: parsed.data.rollNumber,
      department: parsed.data.department,
      year: parsed.data.year,
      course: parsed.data.course,
      email: parsed.data.email,
      section: parsed.data.section,
      amount: ORDER_AMOUNT_PAISE,
      status: "pending",
    };

    let { error: insertError } = await supabase.from("poster_orders").insert({
      ...baseInsertPayload,
      event: "ceer",
    });

    if (isMissingEventColumnError(insertError)) {
      const retryResult = await supabase.from("poster_orders").insert(baseInsertPayload);
      insertError = retryResult.error;
    }

    if (insertError) {
      throw insertError;
    }

    const razorpay = createRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: ORDER_AMOUNT_PAISE,
      currency: "INR",
      receipt: orderId.slice(0, 20),
      notes: {
        rollNumber: parsed.data.rollNumber,
      },
    });

    await supabase
      .from("poster_orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", orderId);

    return NextResponse.json({
      orderId: razorpayOrder.id,
      databaseOrderId: orderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: serverEnv.razorpayKeyId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create payment order.",
      },
      { status: 500 },
    );
  }
}