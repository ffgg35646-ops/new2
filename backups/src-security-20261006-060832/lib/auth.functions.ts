import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const resolveEmailForPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ phone: z.string().min(6).max(20) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("phone", data.phone)
      .maybeSingle();
    return { email: (row?.email as string | null) ?? null };
  });
