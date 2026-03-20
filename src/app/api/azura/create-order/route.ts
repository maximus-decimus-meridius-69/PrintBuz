import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createRazorpayClient } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AZURA_POSTER_WIDTH, AZURA_PRICE_MAP, getPlatformFee } from "@/lib/types";
import { azuraCreateOrderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const json = await request.json();
    const parsed = azuraCreateOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Azura form values." }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const baseAmountRupees = AZURA_PRICE_MAP[parsed.data.height];
    const amount = (baseAmountRupees + getPlatformFee(baseAmountRupees)) * 100;
    const supabase = createSupabaseAdminClient();

    const { error: insertError } = await supabase.from("azura_orders").insert({
      id: orderId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      width: AZURA_POSTER_WIDTH,
      height: parsed.data.height,
      gdrive_url: parsed.data.gdriveUrl,
      amount,
      status: "pending",
    });

    if (insertError) {
      throw insertError;
    }

    const razorpay = createRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: orderId.slice(0, 20),
      payment_capture: true,
      notes: {
        name: parsed.data.name,
        event: "azura",
      },
    });

    const { error: updateError } = await supabase
      .from("azura_orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

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
        error: error instanceof Error ? error.message : "Unable to create Azura payment order.",
      },
      { status: 500 },
    );
  }
}