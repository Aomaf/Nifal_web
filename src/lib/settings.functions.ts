import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.supabase.from("system_settings" as never).select("key, value");
    const rows = (result.data ?? []) as unknown as { key: string; value: string }[];
    const entries = rows.map((r) => [r.key, r.value] as const);
    return Object.fromEntries(entries) as Record<string, string>;
  });

export const saveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ key: z.string().min(1), value: z.unknown() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("system_settings").upsert({
      key: data.key,
      value: data.value as never,
      updated_at: new Date().toISOString(),
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
