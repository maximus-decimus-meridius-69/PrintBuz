import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

export const requireAdminUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const normalizedEmail = user.email.toLowerCase();
  const serverEnv = getServerEnv();

  if (!serverEnv.adminEmails.includes(normalizedEmail)) {
    return null;
  }

  return {
    email: normalizedEmail,
  };
};