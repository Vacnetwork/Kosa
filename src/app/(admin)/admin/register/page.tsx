"use client";

import * as React from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, DetailItem, Panel } from "@/components/admin/admin-page-header";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { FilterBar, FilterField, TableSection } from "@/components/admin/table-section";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Td } from "@/components/ui/table";
import { listAlumniRoster, updateAlumniRosterPerson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AlumniRosterPerson } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * The alumni register: the association's own list of old students, kept apart
 * from membership records. Everyone here was written down by the committee from
 * its records; none of them created an account, so nothing in this table is a
 * membership and nothing here is published on the public site.
 *
 * Reading it is a committee permission (`manage_members`), enforced by RLS on
 * public.alumni_roster, not by this screen.
 */
export default function AdminRegisterPage() {
  return (
    <AdminGate permission="manage_members" screen="Alumni register">
      <RegisterScreen />
    </AdminGate>
  );
}

function RegisterScreen() {
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [year, setYear] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useAdminData<AlumniRosterPerson[]>(
    () => listAlumniRoster({ query: query || undefined, year: year === "all" ? "all" : Number(year), limit: 1000 }),
    [query, year],
    [],
  );

  const years = React.useMemo(() => {
    const found = new Set<number>();
    data.forEach((person) => {
      if (person.end_year) found.add(person.end_year);
      if (person.start_year) found.add(person.start_year);
    });
    return [...found].sort((a, b) => b - a);
  }, [data]);

  const selected = data.find((person) => person.id === selectedId) ?? null;
  const filtered = query.length > 0 || year !== "all";

  const exportRows = data.map((person) => ({
    first_name: person.first_name,
    last_name: person.last_name,
    start_year: person.start_year ?? "",
    end_year: person.end_year ?? "",
    phone: person.phone ?? "",
    notes: person.notes ?? "",
    source: person.source,
  }));

  return (
    <>
      <AdminPageHeader
        title="Alumni register"
        description="The association's own list of old students, imported from the committee's records. Readable and editable by the committee; never published, and never the same thing as a membership record."
        meta={
          <>
            <span>{data.length} people in this view</span>
            <span>Imported registers are added with scripts/import-alumni.mjs</span>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 bg-white p-3 quiet-border">
        <FilterBar>
          <FilterField id="register-search" label="Search name, number or note">
            <Input
              id="register-search"
              className="w-64 text-[15px]"
              placeholder="e.g. Nakajwaya or 0772"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FilterField>
          <FilterField id="register-year" label="Year">
            <Select
              id="register-year"
              className="w-40 text-[15px]"
              value={year}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setYear(event.target.value)}
            >
              <option value="all">All years</option>
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FilterField>
          {filtered ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setSearch("");
                setYear("all");
              }}
            >
              Clear
            </Button>
          ) : null}
        </FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate">{loading ? "Loading…" : `${data.length} shown`}</span>
          <CsvExportButton rows={exportRows} filename="kosa-alumni-register.csv" disabled={loading || Boolean(error)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <TableSection
          caption="Register"
          description={
            filtered
              ? "Filtered view. The CSV export matches these rows."
              : "Everyone the association has a record for, most recent year first."
          }
          head={["Name", "Entry", "Completion", "Phone", "Notes"]}
          rowCount={data.length}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle={filtered ? "No one matches this view" : "The register is empty"}
          emptyBody={
            filtered
              ? "Clear the search or choose another year."
              : "Import the committee's list with scripts/import-alumni.mjs, or add people as they are traced."
          }
        >
          {data.map((person) => {
            const active = person.id === selectedId;
            return (
              <tr key={person.id} className={cn(active ? "bg-paper" : undefined)}>
                <Td>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(active ? null : person.id)}
                    className="text-left font-semibold text-navy underline decoration-transparent underline-offset-4 hover:decoration-navy"
                  >
                    {person.first_name} {person.last_name}
                  </button>
                  {person.start_year === null && person.end_year === null ? (
                    <span className="mt-0.5 block text-[13px] text-slate">No year recorded</span>
                  ) : null}
                </Td>
                <Td className="tabular-nums">{person.start_year ?? "—"}</Td>
                <Td className="tabular-nums">{person.end_year ?? "—"}</Td>
                <Td className="whitespace-nowrap font-mono text-[13px] tabular-nums">{person.phone ?? "—"}</Td>
                <Td className="max-w-[22ch] truncate text-[13px] text-slate">{person.notes ?? ""}</Td>
              </tr>
            );
          })}
        </TableSection>

        {selected ? (
          <PersonDetail key={selected.id} person={selected} onSaved={reload} onClose={() => setSelectedId(null)} />
        ) : (
          <Panel title="Person" description="Choose a name in the register to open the record.">
            <p className="text-[14px] leading-relaxed text-slate">
              Names in this register come from the committee&rsquo;s own records. They are not members: nobody here
              has an account, a membership number or a directory listing until they join.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate">
              A phone number kept here is how a year gets traced. Edits are saved against your account.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}

function PersonDetail({
  person,
  onSaved,
  onClose,
}: {
  person: AlumniRosterPerson;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [phone, setPhone] = React.useState(person.phone ?? "");
  const [notes, setNotes] = React.useState(person.notes ?? "");
  const [startYear, setStartYear] = React.useState(person.start_year ? String(person.start_year) : "");
  const [endYear, setEndYear] = React.useState(person.end_year ? String(person.end_year) : "");
  const [saving, setSaving] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const dirty =
    phone !== (person.phone ?? "") ||
    notes !== (person.notes ?? "") ||
    startYear !== (person.start_year ? String(person.start_year) : "") ||
    endYear !== (person.end_year ? String(person.end_year) : "");

  const save = async () => {
    setSaving(true);
    setFailure(null);
    try {
      const toYear = (value: string) => (value.trim() === "" ? null : Number(value.trim()));
      await updateAlumniRosterPerson(person.id, {
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        start_year: toYear(startYear),
        end_year: toYear(endYear),
      });
      toast.success("Saved to the register.");
      onSaved();
    } catch (cause) {
      setFailure(errorMessage(cause, "Could not save this person."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={`${person.first_name} ${person.last_name}`}
      description="Update the contact details the committee holds."
      actions={
        <Button variant="quiet" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        <DetailItem label="Year of entry">{person.start_year ?? "—"}</DetailItem>
        <DetailItem label="Year of completion">{person.end_year ?? "—"}</DetailItem>
        <DetailItem label="Source">{person.source}</DetailItem>
        <DetailItem label="Updated">{person.updated_at ? formatDate(person.updated_at) : "—"}</DetailItem>
      </dl>

      <div className="mt-4 grid gap-3">
        <label className="block text-[13px] font-semibold text-navy" htmlFor="roster-phone">
          Phone
          <Input
            id="roster-phone"
            className="mt-1 text-[15px]"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0772 000000"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[13px] font-semibold text-navy" htmlFor="roster-start">
            Entry year
            <Input
              id="roster-start"
              className="mt-1 text-[15px] tabular-nums"
              inputMode="numeric"
              value={startYear}
              onChange={(event) => setStartYear(event.target.value)}
              placeholder="1976"
            />
          </label>
          <label className="block text-[13px] font-semibold text-navy" htmlFor="roster-end">
            Completion
            <Input
              id="roster-end"
              className="mt-1 text-[15px] tabular-nums"
              inputMode="numeric"
              value={endYear}
              onChange={(event) => setEndYear(event.target.value)}
              placeholder="1979"
            />
          </label>
        </div>
        <label className="block text-[13px] font-semibold text-navy" htmlFor="roster-notes">
          Notes
          <Textarea
            id="roster-notes"
            className="mt-1 text-[15px]"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Teacher; lives in Masaka"
          />
        </label>
      </div>

      {failure ? (
        <Notice tone="error" className="mt-3" title="Not saved">
          {failure}
        </Notice>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <p className="text-[13px] text-slate">{dirty ? "Unsaved changes" : "No changes"}</p>
      </div>
    </Panel>
  );
}
