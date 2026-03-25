import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createRazorpayClient } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { calculateAzuraOrderDetails, type AzuraPosterFormValues } from "@/lib/types";
import { azuraCreateOrderSchema } from "@/lib/validation";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const json = await request.json();
    const parsed = azuraCreateOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Azura form values." }, { status: 400 });
    }

    const formValues = parsed.data as AzuraPosterFormValues;
    const orderId = crypto.randomUUID();
    const orderDetails = calculateAzuraOrderDetails(formValues);
    const amount = orderDetails.totalAmount * 100;
    const supabase = createSupabaseAdminClient();

    const { error: insertError } = await supabase.from("azura_orders").insert({
      id: orderId,
      name: formValues.name,
      phone: formValues.phone,
      email: formValues.email,
      order_category: formValues.orderCategory,
      size_key: "sizeKey" in formValues ? formValues.sizeKey : null,
      width: orderDetails.width,
      height: orderDetails.height,
      gdrive_url: formValues.gdriveUrl,
      amount,
      status: "pending",
    });

    if (insertError) {
      throw insertError;
    }

    const razorpay = createRazorpayClient();
    const razorpayOrder = (await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: orderId.slice(0, 20),
      payment_capture: true,
      notes: {
        name: formValues.name,
        event: "azura",
        category: formValues.orderCategory,
      },
    })) as RazorpayOrderResponse;

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