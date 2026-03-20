import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-auth";
import { sendDeletionAuditEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CeerOrderDbRecord } from "@/lib/types";

const deleteSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = deleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("poster_orders")
    .select("*")
    .eq("id", parsed.data.orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const order = data as CeerOrderDbRecord;
  const serverEnv = getServerEnv();

  if (order.poster_path) {
    const { error: storageError } = await supabase.storage
      .from(serverEnv.bucketName)
      .remove([order.poster_path]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase.from("poster_orders").delete().eq("id", order.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await sendDeletionAuditEmail({
    deletedBy: adminUser.email,
    orderId: order.id,
    rollNumber: order.roll_number,
    department: order.department,
    year: order.year,
    course: order.course,
    section: order.section,
    email: order.email,
  });

  return NextResponse.json({ success: true });
}