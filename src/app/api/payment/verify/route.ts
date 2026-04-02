import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendCeerOrderConfirmationEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CEER_ORDER_TOTAL_AMOUNT_PAISE, type CeerOrderDbRecord, type DepartmentOption, type CourseOption, type YearOption } from "@/lib/types";
import { ceerPaymentVerifySchema } from "@/lib/validation";

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const sanitizePathSegment = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const createPosterFilePath = (orderId: string, order: Pick<CeerOrderDbRecord, "roll_number" | "department" | "section">) => {
  const teamNumber = sanitizePathSegment(order.roll_number);
  const branch = sanitizePathSegment(order.department);
  const section = sanitizePathSegment(order.section);

  return `${orderId}/${teamNumber}-${branch}-${section}.pdf`;
};

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const formData = await request.formData();
    const poster = formData.get("poster");

    if (!(poster instanceof File)) {
      return NextResponse.json({ error: "Poster file is required." }, { status: 400 });
    }

    if (!isPdfFile(poster)) {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
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

    const expectedAmount = CEER_ORDER_TOTAL_AMOUNT_PAISE;
    if (order.amount !== expectedAmount) {
      return NextResponse.json({ error: "Stored order amount mismatch." }, { status: 409 });
    }

    if (order.razorpay_order_id !== parsed.data.razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order mismatch." }, { status: 409 });
    }

    const posterPath = createPosterFilePath(parsed.data.databaseOrderId, order);
    const fileBuffer = Buffer.from(await poster.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(serverEnv.bucketName)
      .upload(posterPath, fileBuffer, {
        cacheControl: "3600",
        contentType: "application/pdf",
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
        department: order.department as DepartmentOption,
        year: order.year as YearOption,
        course: order.course as CourseOption,
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