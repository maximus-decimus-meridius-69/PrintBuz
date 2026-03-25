import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendAzuraOrderConfirmationEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  calculateAzuraOrderDetails,
  getAzuraPricingInputFromOrderRecord,
  type AzuraOrderDbRecord,
  type AzuraPosterFormValues,
} from "@/lib/types";
import { azuraPaymentVerifySchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const json = await request.json();
    const parsed = azuraPaymentVerifySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment verification payload." }, { status: 400 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", serverEnv.razorpayKeySecret)
      .update(`${parsed.data.razorpayOrderId}|${parsed.data.razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== parsed.data.razorpaySignature) {
      return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: storedOrder, error: orderError } = await supabase
      .from("azura_orders")
      .select("*")
      .eq("id", parsed.data.databaseOrderId)
      .single();

    if (orderError || !storedOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = storedOrder as AzuraOrderDbRecord;
    const pricingInput = getAzuraPricingInputFromOrderRecord(order);
    const orderDetails = calculateAzuraOrderDetails(pricingInput);
    const expectedAmount = orderDetails.totalAmount * 100;

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not pending." }, { status: 409 });
    }

    if (order.amount !== expectedAmount) {
      return NextResponse.json({ error: "Stored order amount mismatch." }, { status: 409 });
    }

    if (order.razorpay_order_id !== parsed.data.razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order mismatch." }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("azura_orders")
      .update({
        status: "paid",
        razorpay_order_id: parsed.data.razorpayOrderId,
        razorpay_payment_id: parsed.data.razorpayPaymentId,
        payment_verified_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.databaseOrderId);

    if (updateError) {
      throw updateError;
    }

    let emailPayload: AzuraPosterFormValues;

    if (pricingInput.orderCategory === "customised") {
      emailPayload = {
        name: order.name,
        phone: order.phone,
        email: order.email,
        gdriveUrl: order.gdrive_url,
        orderCategory: pricingInput.orderCategory,
        width: orderDetails.width,
        height: orderDetails.height,
      };
    } else if (pricingInput.orderCategory === "dept-wise") {
      emailPayload = {
        name: order.name,
        phone: order.phone,
        email: order.email,
        gdriveUrl: order.gdrive_url,
        orderCategory: pricingInput.orderCategory,
        sizeKey: pricingInput.sizeKey,
      };
    } else {
      emailPayload = {
        name: order.name,
        phone: order.phone,
        email: order.email,
        gdriveUrl: order.gdrive_url,
        orderCategory: pricingInput.orderCategory,
        sizeKey: pricingInput.sizeKey,
      };
    }

    const emailSent = await sendAzuraOrderConfirmationEmail(
      emailPayload,
      order.id,
      order.amount,
    );

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to verify Azura payment.",
      },
      { status: 500 },
    );
  }
}