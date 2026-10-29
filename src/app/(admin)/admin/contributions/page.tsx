"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { TableSection } from "@/components/admin/table-section";
import { currentYearInKampala, monthKey, monthLabel, todayInKampala } from "@/components/admin/datetime";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { listContributions, listMembers, recordContribution } from "@/lib/api";
import { contributionSchema } from "@/lib/validation";
import { formatDate, formatMoney } from "@/lib/format";
import type { Contribution, Membership, Profile } from "@/lib/types";

type MemberRow = Membership & { profiles: Partial<Profile> | null };

const formSchema = contributionSchema.extend({
  amount: z.coerce.number({ message: "Enter the amount received" }).positive("Enter an amount greater than zero"),
});
type FormValues = z.infer<typeof formSchema>;

const METHODS = ["Cash", "Mobile money", "Bank transfer", "Cheque", "Other"];

interface Total {
  key: string;
  label: string;
  currency: string;
  count: number;
  total: number;
}

function groupTotals(rows: Contribution[], keyOf: (row: Contribution) => string, labelOf: (key: string) => string): Total[] {
  const map = new Map<string, Total>();
  rows.forEach((row) => {
    const key = keyOf(row);
    const composite = `${key}|${row.currency}`;
    const current = map.get(composite) ?? { key, label: labelOf(key), currency: row.currency, count: 0, total: 0 };
    current.count += 1;
    current.total += Number(row.amount);
    map.set(composite, current);
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function AdminContributionsPage() {
  return (
    <AdminGate permission="view_finance" screen="Contributions">
      <ContributionsScreen />
    </AdminGate>
  );
}

function ContributionsScreen() {
  const { can } = useAuth();
  const contributions = useAdminData<Contribution[]>(() => listContributions(), [], []);
  const members = useAdminData<MemberRow[]>(() => listMembers(), [], []);
  const canRecord = can("record_contributions");

  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [review, setReview] = React.useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      memberId: "",
      campaign: "",
      amount: undefined,
      currency: "UGX",
      method: "",
      reference: "",
      receivedAt: todayInKampala(),
      note: "",
    },
  });

  const memberName = React.useCallback(
    (id: string | null) => {
      if (!id) return "Unattributed";
      const member = members.data.find((row) => row.user_id === id || row.id === id);
      return member?.profiles?.full_name ?? `Account ${id.slice(0, 8)}`;
    },
    [members.data],
  );

  const years = React.useMemo(() => {
    const set = new Set(contributions.data.map((row) => monthKey(row.received_at).slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [contributions.data]);

  const rows = React.useMemo(
    () =>
      yearFilter === "all"
        ? contributions.data
        : contributions.data.filter((row) => monthKey(row.received_at).startsWith(yearFilter)),
    [contributions.data, yearFilter],
  );

  const campaignTotals = React.useMemo(() => groupTotals(rows, (row) => row.campaign, (key) => key), [rows]);
  const monthTotals = React.useMemo(
    () =>
      groupTotals(
        rows,
        (row) => monthKey(row.received_at),
        (key) => monthLabel(`${key}-01T12:00:00Z`),
      ).sort((a, b) => b.key.localeCompare(a.key)),
    [rows],
  );

  const thisYearTotals = React.useMemo(() => {
    const year = String(currentYearInKampala());
    const byCurrency = new Map<string, number>();
    contributions.data
      .filter((row) => monthKey(row.received_at).startsWith(year))
      .forEach((row) => byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + Number(row.amount)));
    return Array.from(byCurrency.entries()).map(([currency, total]) => formatMoney(total, currency));
  }, [contributions.data]);

  const exportRows = rows.map((row) => ({
    received_at: row.received_at,
    member: memberName(row.member_id),
    campaign: row.campaign,
    amount: row.amount,
    currency: row.currency,
    method: row.method ?? "",
    reference: row.reference ?? "",
    note: row.note ?? "",
  }));

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    setReview(values);
  });

  React.useEffect(() => {
    const subscription = form.watch(() => {
      setReview((current) => (current ? null : current));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const record = async () => {
    if (!review) return;
    setSaving(true);
    setFormError(null);
    try {
      await recordContribution({
        memberId: review.memberId || undefined,
        campaign: review.campaign,
        amount: review.amount,
        currency: review.currency.trim().toUpperCase(),
        method: review.method || undefined,
        reference: review.reference || undefined,
        receivedAt: review.receivedAt,
        note: review.note || undefined,
      });
      toast.success("Contribution recorded", {
        description: `${formatMoney(review.amount, review.currency.trim().toUpperCase())} — ${review.campaign}.`,
      });
      setReview(null);
      form.reset({
        memberId: "",
        campaign: "",
        amount: undefined,
        currency: review.currency.trim().toUpperCase(),
        method: "",
        reference: "",
        receivedAt: todayInKampala(),
        note: "",
      });
      contributions.reload();
    } catch (cause) {
      const message = errorMessage(cause, "The contribution could not be recorded.");
      setFormError(message);
      toast.error("Not recorded", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Contributions"
        description="Money received, recorded against a campaign. Totals below are sums of these rows, grouped by campaign and month; nothing is modelled or projected."
        meta={
          <>
            <span>{rows.length} receipts in view</span>
            <span>This calendar year: {thisYearTotals.length > 0 ? thisYearTotals.join(" · ") : formatMoney(0, "UGX")}</span>
            <span>{canRecord ? "Your role can record contributions" : "Your role can read but not record"}</span>
          </>
        }
      />

      {!canRecord ? (
        <Notice tone="info" title="Read-only" className="mb-4">
          Recording a contribution needs the record_contributions permission. The form is hidden, and the database would
          refuse the call from this account.
        </Notice>
      ) : (
        <Panel title="Record a contribution" description="Amount, campaign, currency and date are required." className="mb-4">
          <form onSubmit={submit} noValidate>
            <div className="grid gap-3 md:grid-cols-3">
              <Field
                id="contribution-member"
                label="Member"
                hint={members.error ? "The member register could not be read; record without a member." : "Optional — leave blank for an unattributed receipt."}
                error={form.formState.errors.memberId?.message}
              >
                {(field) => (
                  <Select {...field} {...form.register("memberId")} className="text-[15px]" disabled={members.loading}>
                    <option value="">{members.loading ? "Loading members…" : "No member (unattributed)"}</option>
                    {members.data.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.profiles?.full_name ?? "Unnamed profile"}
                        {member.member_no ? ` · ${member.member_no}` : ""}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field id="contribution-campaign" label="Campaign or fund" required error={form.formState.errors.campaign?.message}>
                {(field) => <Input {...field} {...form.register("campaign")} className="text-[15px]" placeholder="Bursary fund" />}
              </Field>

              <Field id="contribution-amount" label="Amount" required error={form.formState.errors.amount?.message}>
                {(field) => (
                  <Input
                    {...field}
                    {...form.register("amount", {
                      setValueAs: (value: unknown) => (value === "" || value === null ? undefined : Number(value)),
                    })}
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className="text-[15px] tabular-nums"
                    placeholder="500000"
                  />
                )}
              </Field>

              <Field id="contribution-currency" label="Currency" required error={form.formState.errors.currency?.message}>
                {(field) => (
                  <Input
                    {...field}
                    {...form.register("currency")}
                    className="text-[15px] uppercase"
                    maxLength={3}
                    list="currency-codes"
                  />
                )}
              </Field>
              <datalist id="currency-codes">
                <option value="UGX" />
                <option value="USD" />
                <option value="GBP" />
                <option value="EUR" />
                <option value="KES" />
              </datalist>

              <Field id="contribution-method" label="Method" error={form.formState.errors.method?.message}>
                {(field) => (
                  <Select {...field} {...form.register("method")} className="text-[15px]">
                    <option value="">Not recorded</option>
                    {METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field id="contribution-reference" label="Reference" hint="Receipt, transaction or cheque number." error={form.formState.errors.reference?.message}>
                {(field) => <Input {...field} {...form.register("reference")} className="font-mono text-[13px]" placeholder="MM-88213" />}
              </Field>

              <Field id="contribution-received" label="Received" required error={form.formState.errors.receivedAt?.message}>
                {(field) => <Input {...field} {...form.register("receivedAt")} type="date" className="text-[15px] tabular-nums" />}
              </Field>

              <Field id="contribution-note" label="Note" error={form.formState.errors.note?.message} className="md:col-span-3">
                {(field) => <Textarea {...field} {...form.register("note")} className="min-h-16 text-[15px]" rows={2} />}
              </Field>
            </div>

            {formError ? (
              <Notice tone="error" title="The contribution was not recorded" className="mt-3">
                {formError}
              </Notice>
            ) : null}

            {review ? (
              <div className="mt-3 border border-navy bg-paper p-3">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">Check before recording</p>
                <p className="mt-1 text-[15px] font-semibold text-navy">
                  {formatMoney(review.amount, review.currency.trim().toUpperCase())} — {review.campaign}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-navy">
                  {memberName(review.memberId || null)} · received {review.receivedAt}
                  {review.reference ? ` · reference ${review.reference}` : ""}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate">
                  This writes a receipt row. It cannot be edited or deleted from this screen.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => void record()} disabled={saving}>
                    {saving ? "Recording…" : "Confirm and record"}
                  </Button>
                  <Button variant="quiet" size="sm" onClick={() => setReview(null)} disabled={saving}>
                    Back to the form
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t border-paper-dim pt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  Review contribution
                </Button>
                <p className="mt-1 text-[13px] text-slate">You will see the figures once more before anything is written.</p>
              </div>
            )}
          </form>
        </Panel>
      )}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 bg-white p-3 quiet-border">
        <div className="flex flex-col gap-1">
          <label htmlFor="contribution-year" className="text-[13px] font-semibold text-navy">
            Year
          </label>
          <Select
            id="contribution-year"
            className="h-10 w-40 text-[15px]"
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          >
            <option value="all">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate">{rows.length} receipts</span>
          <CsvExportButton
            rows={exportRows}
            filename={`kosa-contributions-${yearFilter === "all" ? "all" : yearFilter}.csv`}
            disabled={contributions.loading || Boolean(contributions.error)}
          />
        </div>
      </div>

      <TableSection
        caption="Receipts"
        description="Newest received date first. The CSV matches this view."
        head={["Received", "Member", "Campaign", "Amount", "Method", "Reference"]}
        rowCount={rows.length}
        loading={contributions.loading}
        error={contributions.error}
        onRetry={contributions.reload}
        emptyTitle={contributions.data.length === 0 ? "No contributions recorded" : "No receipts in this year"}
        emptyBody={
          contributions.data.length === 0
            ? "Record the first receipt above; totals appear as soon as one row exists."
            : "Choose another year to see the rest of the ledger."
        }
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <Td className="whitespace-nowrap tabular-nums text-[13px]">{formatDate(row.received_at)}</Td>
            <Td className="text-[14px]">{memberName(row.member_id)}</Td>
            <Td className="text-[14px]">
              {row.campaign}
              {row.note ? <span className="mt-0.5 block text-[13px] text-slate">{row.note}</span> : null}
            </Td>
            <Td className="whitespace-nowrap font-semibold tabular-nums">{formatMoney(row.amount, row.currency)}</Td>
            <Td className="text-[14px]">{row.method ?? "—"}</Td>
            <Td className="font-mono text-[13px]">{row.reference ?? "—"}</Td>
          </tr>
        ))}
      </TableSection>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Totals by campaign" description="One row per campaign and currency; sums are of the receipts in view." bodyClassName="p-0">
          <TotalsTable totals={campaignTotals} loading={contributions.loading} error={contributions.error} firstColumn="Campaign" />
        </Panel>
        <Panel title="Totals by month" description="Received date grouped by month in Kampala time." bodyClassName="p-0">
          <TotalsTable totals={monthTotals} loading={contributions.loading} error={contributions.error} firstColumn="Month" />
        </Panel>
      </div>
    </>
  );
}

function TotalsTable({
  totals,
  loading,
  error,
  firstColumn,
}: {
  totals: Total[];
  loading: boolean;
  error: string | null;
  firstColumn: string;
}) {
  if (loading) {
    return (
      <div className="px-4 py-6">
        <Spinner label="Adding up" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <Notice tone="error" title="Totals unavailable">
          {error}
        </Notice>
      </div>
    );
  }
  if (totals.length === 0) {
    return <p className="px-4 py-6 text-[14px] text-slate">Nothing to total yet.</p>;
  }
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>{firstColumn}</Th>
          <Th className="text-right">Receipts</Th>
          <Th className="text-right">Total</Th>
        </tr>
      </thead>
      <tbody>
        {totals.map((row) => (
          <tr key={`${row.key}-${row.currency}`}>
            <Td className="text-[14px]">{row.label}</Td>
            <Td className="text-right text-[14px] tabular-nums">{row.count}</Td>
            <Td className="whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(row.total, row.currency)}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
