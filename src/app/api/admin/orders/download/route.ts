import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CeerOrderDbRecord } from "@/lib/types";

const downloadSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = downloadSchema.safeParse(json);

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

  if (!order.poster_url) {
    return NextResponse.json({ error: "Poster file not available" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("poster_orders")
    .update({
      downloaded: true,
      downloaded_at: new Date().toISOString(),
      downloaded_by: adminUser.email,
    })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: order.poster_url });
}