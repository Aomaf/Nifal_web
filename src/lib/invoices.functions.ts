import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAdminInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        status: z.string().optional(),
        contractId: z.string().uuid().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    // Auto mark overdue
    await context.supabase
      .from("invoices")
      .update({ status: "overdue" as never })
      .eq("status", "pending")
      .lt("due_date", new Date().toISOString().split("T")[0]);

    let q = context.supabase
      .from("invoices")
      .select(
        "*, contract:rental_contracts(id, unit:units(unit_number), tenant:tenants(name, phone))",
      )
      .order("due_date", { ascending: true });

    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);
    if (data.contractId) q = q.eq("contract_id", data.contractId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        contract_id: z.string().uuid(),
        amount: z.number().positive(),
        due_date: z.string(),
        period_start: z.string(),
        period_end: z.string(),
        notes: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("invoices")
      .insert(data as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const bulkGenerateInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ contractId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: contract, error: ce } = await context.supabase
      .from("rental_contracts")
      .select("*")
      .eq("id", data.contractId)
      .single();
    if (ce || !contract) throw new Error("Contract not found");

    const freqMonths: Record<string, number> = {
      monthly: 1,
      quarterly: 3,
      biannual: 6,
      annual: 12,
    };
    const step = freqMonths[contract.payment_frequency] ?? 1;
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);

    const invoiceRows: Record<string, unknown>[] = [];
    let current = new Date(start);
    while (current < end) {
      const periodEnd = new Date(current);
      periodEnd.setMonth(periodEnd.getMonth() + step);
      if (periodEnd > end) periodEnd.setTime(end.getTime());
      invoiceRows.push({
        contract_id: contract.id,
        amount: contract.rent_amount,
        due_date: current.toISOString().split("T")[0],
        period_start: current.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
      });
      current = new Date(periodEnd);
    }

    const { error } = await context.supabase.from("invoices").insert(invoiceRows as never);
    if (error) throw new Error(error.message);
    return { count: invoiceRows.length };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        invoiceId: z.string().uuid(),
        method: z.enum(["bank_transfer", "cheque", "cash", "credit_card", "stc_pay", "apple_pay"]),
        date: z.string(),
        amountPaid: z.number().positive(),
        notes: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: invoice, error: fe } = await context.supabase
      .from("invoices")
      .select("amount, amount_paid")
      .eq("id", data.invoiceId)
      .single();
    if (fe || !invoice) throw new Error("Invoice not found");

    const totalPaid = (invoice.amount_paid ?? 0) + data.amountPaid;
    const newStatus = totalPaid >= invoice.amount ? "paid" : "partially_paid";

    const { error } = await context.supabase
      .from("invoices")
      .update({
        amount_paid: totalPaid,
        status: newStatus,
        payment_method: data.method,
        payment_date: data.date,
        notes: data.notes ?? null,
      } as never)
      .eq("id", data.invoiceId);
    if (error) throw new Error(error.message);

    await context.supabase.from("invoice_activities").insert({
      invoice_id: data.invoiceId,
      type: "payment",
      notes: `دفعة ${data.amountPaid} ر.س بتاريخ ${data.date}`,
      created_by: context.userId,
    } as never);

    return { ok: true };
  });

export const cancelInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ invoiceId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: inv } = await context.supabase
      .from("invoices")
      .select("status")
      .eq("id", data.invoiceId)
      .single();
    if (inv?.status === "paid") throw new Error("لا يمكن إلغاء فاتورة مدفوعة");
    const { error } = await context.supabase
      .from("invoices")
      .update({ status: "cancelled" as never })
      .eq("id", data.invoiceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCollectionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("invoices")
      .select("status, amount, amount_paid");
    const all = rows ?? [];
    const totalPending = all
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalOverdue = all
      .filter((r) => r.status === "overdue")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalPaid = all
      .filter((r) => r.status === "paid")
      .reduce((s, r) => s + Number(r.amount_paid ?? r.amount), 0);
    const totalAmount = all.reduce((s, r) => s + Number(r.amount), 0);
    const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
    return { totalPending, totalOverdue, totalPaid, collectionRate };
  });
