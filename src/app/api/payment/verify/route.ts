import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendCeerOrderConfirmationEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CEER_ORDER_AMOUNT, getPlatformFee, type CeerOrderDbRecord } from "@/lib/types";
import { ceerPaymentVerifySchema } from "@/lib/validation";

const createPosterFilePath = (email: string, fileName: string) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
  return `${email.toLowerCase()}/${Date.now()}-${safeName}`;
};

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const formData = await request.formData();
    const poster = formData.get("poster");

    if (!(poster instanceof File)) {
      return NextResponse.json({ error: "Poster file is required." }, { status: 400 });
    }

    const rawData = Object.fromEntries(
      Array.from(formData.entries()).filter(([key]) => key !== "poster"),
    );
    const parsed = ceerPaymentVerifySchema.safeParse(rawData);

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
      .from("poster_orders")
      .select("*")
      .eq("id", parsed.data.databaseOrderId)
      .single();

    if (orderError || !storedOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = storedOrder as CeerOrderDbRecord;

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not pending." }, { status: 409 });
    }

    const expectedAmount = (CEER_ORDER_AMOUNT + getPlatformFee(CEER_ORDER_AMOUNT)) * 100;
    if (order.amount !== expectedAmount) {
      return NextResponse.json({ error: "Stored order amount mismatch." }, { status: 409 });
    }

    if (order.razorpay_order_id !== parsed.data.razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order mismatch." }, { status: 409 });
    }

    const posterPath = createPosterFilePath(order.email, poster.name);
    const fileBuffer = Buffer.from(await poster.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(serverEnv.bucketName)
      .upload(posterPath, fileBuffer, {
        cacheControl: "3600",
        contentType: poster.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(serverEnv.bucketName).getPublicUrl(posterPath);

    const { error: updateError } = await supabase
      .from("poster_orders")
      .update({
        status: "paid",
        poster_path: posterPath,
        poster_url: publicUrl,
        razorpay_order_id: parsed.data.razorpayOrderId,
        razorpay_payment_id: parsed.data.razorpayPaymentId,
        payment_verified_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.databaseOrderId);

    if (updateError) {
      throw updateError;
    }

    const emailSent = await sendCeerOrderConfirmationEmail(
      {
        rollNumber: order.roll_number,
        department: order.department,
        year: order.year,
        course: order.course,
        email: order.email,
        section: order.section,
      },
      parsed.data.databaseOrderId,
    );

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}