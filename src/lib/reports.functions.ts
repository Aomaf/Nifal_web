import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DateRange = z.object({
  from: z.string(),
  to: z.string(),
});

export const getFinancialReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DateRange.parse(data))
  .handler(async ({ data, context }) => {
    const { data: invoices } = await context.supabase
      .from("invoices")
      .select("amount, amount_paid, status, payment_date, due_date")
      .gte("due_date", data.from)
      .lte("due_date", data.to);

    const { data: maintenance } = await context.supabase
      .from("maintenance_requests")
      .select("actual_cost, closed_at")
      .gte("closed_at", data.from)
      .lte("closed_at", data.to)
      .not("actual_cost", "is", null);

    const all = invoices ?? [];
    const paid = all.filter((r) => r.status === "paid");
    const totalCollected = paid.reduce((s, r) => s + Number(r.amount_paid ?? r.amount), 0);
    const totalPending = all
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalOverdue = all
      .filter((r) => r.status === "overdue")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalAmount = all.reduce((s, r) => s + Number(r.amount), 0);
    const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;
    const maintenanceCost = (maintenance ?? []).reduce((s, r) => s + Number(r.actual_cost ?? 0), 0);

    const monthlyMap: Record<string, { month: string; collected: number; maintenance: number }> =
      {};
    for (const inv of paid) {
      const key = (inv.payment_date ?? inv.due_date ?? "").slice(0, 7);
      if (!key) continue;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, collected: 0, maintenance: 0 };
      monthlyMap[key].collected += Number(inv.amount_paid ?? inv.amount);
    }
    for (const req of maintenance ?? []) {
      const key = (req.closed_at ?? "").slice(0, 7);
      if (!key) continue;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, collected: 0, maintenance: 0 };
      monthlyMap[key].maintenance += Number(req.actual_cost ?? 0);
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalCollected,
      totalPending,
      totalOverdue,
      collectionRate,
      maintenanceCost,
      monthly,
    };
  });

export const getLeadFunnelReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DateRange.parse(data))
  .handler(async ({ data, context }) => {
    const { data: leads } = await context.supabase
      .from("leads")
      .select("status, assigned_to")
      .gte("created_at", data.from)
      .lte("created_at", data.to);

    const { data: agents } = await context.supabase
      .from("leads")
      .select("assigned_to, status")
      .not("assigned_to", "is", null)
      .gte("created_at", data.from)
      .lte("created_at", data.to);

    const all = leads ?? [];
    const funnel = [
      { stage: "جديد", count: all.filter((l) => l.status === "new").length },
      { stage: "تم التواصل", count: all.filter((l) => l.status === "contacted").length },
      { stage: "مؤهل", count: all.filter((l) => l.status === "qualified").length },
      { stage: "محوّل", count: all.filter((l) => l.status === "converted").length },
      { stage: "خسارة", count: all.filter((l) => l.status === "lost").length },
    ];

    const agentMap: Record<string, { leads: number; converted: number }> = {};
    for (const a of agents ?? []) {
      const uid = a.assigned_to as string;
      if (!agentMap[uid]) agentMap[uid] = { leads: 0, converted: 0 };
      agentMap[uid].leads++;
      if (a.status === "converted") agentMap[uid].converted++;
    }

    return { total: all.length, funnel, agentStats: agentMap };
  });

export const getClientStageReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DateRange.parse(data))
  .handler(async ({ data, context }) => {
    const { data: clients } = await context.supabase
      .from("clients")
      .select("stage")
      .gte("created_at", data.from)
      .lte("created_at", data.to);

    const all = clients ?? [];
    const stageLabels: Record<string, string> = {
      lead: "جديد",
      prospect: "مؤهل",
      active: "نشط",
      negotiation: "تفاوض",
      closed: "مغلق",
      lost: "خسارة",
    };
    const counts: Record<string, number> = {};
    for (const c of all) {
      const s = (c.stage as string) ?? "lead";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(stageLabels).map(([key, label]) => ({
      stage: label,
      count: counts[key] ?? 0,
    }));
  });

export const getPropertyPerformanceReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DateRange.parse(data))
  .handler(async ({ data, context }) => {
    const { data: properties } = await context.supabase
      .from("properties")
      .select("id, title, views_count, city, type, price")
      .order("views_count", { ascending: false })
      .limit(10);

    const { data: leads } = await context.supabase
      .from("leads")
      .select("property_id, properties(title)")
      .not("property_id", "is", null)
      .gte("created_at", data.from)
      .lte("created_at", data.to);

    const inquiryMap: Record<string, number> = {};
    for (const l of leads ?? []) {
      const pid = l.property_id as string;
      if (pid) inquiryMap[pid] = (inquiryMap[pid] ?? 0) + 1;
    }

    const topViewed = (properties ?? []).slice(0, 5).map((p) => ({
      title: p.title ?? "—",
      views: p.views_count ?? 0,
      city: p.city ?? "—",
    }));

    const topInquired = Object.entries(inquiryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pid, count]) => {
        const prop = (properties ?? []).find((p) => p.id === pid);
        return { title: prop?.title ?? "—", count };
      });

    const cityMap: Record<string, number> = {};
    for (const p of properties ?? []) {
      const city = p.city ?? "أخرى";
      cityMap[city] = (cityMap[city] ?? 0) + (p.price ?? 0);
    }
    const byCity = Object.entries(cityMap).map(([city, value]) => ({ city, value }));

    return { topViewed, topInquired, byCity };
  });

export const getOccupancyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: units } = await context.supabase.from("units").select("status");
    const all = units ?? [];
    const total = all.length;
    const rented = all.filter((u) => u.status === "rented").length;
    const vacant = all.filter((u) => u.status === "vacant").length;
    const occupancyRate = total > 0 ? Math.round((rented / total) * 100) : 0;

    const { data: contracts } = await context.supabase
      .from("rental_contracts")
      .select("rent_amount, unit:units(unit_number, property:properties(title))")
      .eq("status", "active");

    const rents = (contracts ?? []).map((c) => Number(c.rent_amount ?? 0));
    const avgRent =
      rents.length > 0 ? Math.round(rents.reduce((s, r) => s + r, 0) / rents.length) : 0;

    const { data: topProps } = await context.supabase
      .from("rental_contracts")
      .select("rent_amount, unit:units(property:properties(id,title))")
      .eq("status", "active");

    const propRentMap: Record<string, { title: string; total: number }> = {};
    for (const c of topProps ?? []) {
      const prop = (c.unit as { property?: { id: string; title: string } })?.property;
      if (!prop) continue;
      if (!propRentMap[prop.id]) propRentMap[prop.id] = { title: prop.title, total: 0 };
      propRentMap[prop.id].total += Number(c.rent_amount ?? 0);
    }
    const topByRent = Object.values(propRentMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { total, rented, vacant, occupancyRate, avgRent, topByRent };
  });
