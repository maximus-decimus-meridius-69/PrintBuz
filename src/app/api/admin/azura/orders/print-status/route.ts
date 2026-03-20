import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const printStatusSchema = z.object({
  orderId: z.string().uuid(),
  printDone: z.boolean(),
});

export async function POST(request: Request) {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = printStatusSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("azura_orders")
    .update({ print_done: parsed.data.printDone })
    .eq("id", parsed.data.orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}