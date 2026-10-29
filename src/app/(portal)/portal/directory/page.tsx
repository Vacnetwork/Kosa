"use client";

import * as React from "react";
import { RequireAuth, RequireMember } from "@/components/portal/guards";
import { PageTitle, Panel, useDebounced, useLoad } from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { getAlumniProfile, listCohorts, searchAlumni } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;

function MemberDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useLoad(`alumni:${id}`, () => getAlumniProfile(id));
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const member = detail.data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/45 px-4 py-8"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-detail-title"
        className="w-full max-w-[620px] bg-white quiet-border"
      >
        <div className="flex items-start justify-between gap-4 border-b border-paper-dim px-5 py-4">
          <h2
            id="member-detail-title"
            className="font-[family-name:var(--font-display)] text-[19px] font-bold leading-snug text-navy"
          >
            {member?.full_name ?? "Member"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-[14px] text-navy underline decoration-2 underline-offset-4"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5">
          {detail.loading ? (
            <Spinner label="Loading member" />
          ) : detail.error ? (
            <Notice tone="error" title="Could not load this member">
              {detail.error}
            </Notice>
          ) : !member ? (
            <EmptyState title="This member is no longer listed">
              They may have hidden their profile since the list was loaded.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate">Year</dt>
                  <dd className="text-navy">{member.graduation_year ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate">Profession</dt>
                  <dd className="text-navy">{member.profession ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate">Employer</dt>
                  <dd className="text-navy">{member.employer ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate">Location</dt>
                  <dd className="text-navy">
                    {[member.city, member.country].filter(Boolean).join(", ") || "Not recorded"}
                  </dd>
                </div>
              </dl>

              {member.bio ? (
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-slate">About</p>
                  <p className="mt-1 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-navy">
                    {member.bio}
                  </p>
                </div>
              ) : (
                <p className="text-[14px] text-slate">This member has not written a biography.</p>
              )}

              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-slate">Interests</p>
                {member.interests.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {member.interests.map((interest) => (
                      <li
                        key={interest}
                        className="border border-paper-dim bg-paper px-2 py-1 text-[13px] text-navy"
                      >
                        {interest}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[14px] text-slate">No interests listed.</p>
                )}
              </div>

              <div className="border-t border-paper-dim pt-4">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-slate">Contact</p>
                {member.canContact ? (
                  <div className="mt-1 flex flex-col gap-1 text-[15px] text-navy">
                    {member.email ? (
                      <a href={`mailto:${member.email}`} className="underline decoration-2 underline-offset-4">
                        {member.email}
                      </a>
                    ) : null}
                    {member.phone ? (
                      <a href={`tel:${member.phone}`} className="underline decoration-2 underline-offset-4">
                        {member.phone}
                      </a>
                    ) : null}
                    {!member.email && !member.phone ? (
                      <p className="text-[14px] text-slate">
                        This member has allowed contact but has not added an address or number.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 max-w-prose text-[14px] leading-relaxed text-slate">
                    This member has not shared contact details with the directory. Reach them through the
                    association instead.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DirectoryScreen() {
  const { session } = useAuth();
  const [query, setQuery] = React.useState("");
  const [year, setYear] = React.useState("");
  const [profession, setProfession] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const closeDetail = React.useCallback(() => setSelected(null), []);

  const debouncedQuery = useDebounced(query, 300);
  const debouncedProfession = useDebounced(profession, 300);
  const debouncedLocation = useDebounced(location, 300);

  const years = useLoad("directory-cohorts", () => listCohorts());

  const params = React.useMemo(
    () => ({
      query: debouncedQuery.trim(),
      year: year ? Number(year) : null,
      profession: debouncedProfession.trim(),
      location: debouncedLocation.trim(),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [debouncedQuery, year, debouncedProfession, debouncedLocation, page],
  );

  const results = useLoad(session ? `directory:${JSON.stringify(params)}` : "directory:none", () =>
    session ? searchAlumni(params) : Promise.resolve({ rows: [], total: 0 }),
  );

  const rows = results.data?.rows ?? [];
  const total = results.data?.total ?? 0;
  const first = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE + PAGE_SIZE, total);
  const hasFilters = Boolean(query || year || profession || location);

  function clearFilters() {
    setQuery("");
    setYear("");
    setProfession("");
    setLocation("");
    setPage(0);
  }

  return (
    <>
      <PageTitle
        title="Alumni directory"
        lede="Active members, searchable by year, profession and place. Each person controls what appears here."
      />

      <Panel
        title="Find a member"
        description="Leave the filters empty to browse everyone listed."
        className="mb-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label
              htmlFor="directory-query"
              className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
            >
              Name, profession or interest
            </label>
            <Input
              id="directory-query"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="e.g. Aciro, engineering, bursary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="directory-year"
              className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
            >
              Graduation year
            </label>
            <Select
              id="directory-year"
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setPage(0);
              }}
            >
              <option value="">Any year</option>
              {(years.data ?? []).map((year) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))}
            </Select>
            {years.error ? (
              <p className="text-[13px] text-slate">Years could not be loaded; other filters still work.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="directory-profession"
              className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
            >
              Profession
            </label>
            <Input
              id="directory-profession"
              value={profession}
              onChange={(event) => {
                setProfession(event.target.value);
                setPage(0);
              }}
              placeholder="e.g. nurse"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="directory-location"
              className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
            >
              City or town
            </label>
            <Input
              id="directory-location"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setPage(0);
              }}
              placeholder="e.g. Gulu"
            />
          </div>

          <div className="flex items-end lg:col-span-2">
            {hasFilters ? (
              <Button type="button" variant="quiet" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            ) : (
              <span className="text-[13px] text-slate">Showing members who chose to be listed.</span>
            )}
          </div>
        </div>
      </Panel>

      {results.error ? (
        <Notice tone="error" title="Could not load the directory" className="mb-6">
          {results.error}{" "}
          <button
            type="button"
            onClick={results.reload}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-slate" aria-live="polite">
          {results.loading && !results.data
            ? "Searching…"
            : total === 0
              ? "No members found"
              : `Showing ${first}–${last} of ${total} members`}
        </p>
        {results.loading && results.data ? <Spinner label="Updating" /> : null}
      </div>

      {results.loading && !results.data ? (
        <div className="bg-white px-5 py-10 quiet-border">
          <Spinner label="Loading members" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No members match those filters" : "No members are listed yet"}
          action={
            hasFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear the filters
              </Button>
            ) : undefined
          }
        >
          {hasFilters
            ? "Try a broader search, or remove the year and place filters. Members who hide their profile never appear here."
            : "Members appear here as soon as they choose to be listed. If you expected to see people, the membership officer can check whether they have hidden their profiles."}
        </EmptyState>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Year</Th>
              <Th>Profession</Th>
              <Th>City</Th>
              <Th>
                <span className="sr-only">Details</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <tr key={member.id} className="hover:bg-paper/70">
                <Td>
                  <button
                    type="button"
                    onClick={() => setSelected(member.id)}
                    className="text-left font-[family-name:var(--font-display)] text-[15px] font-bold text-navy underline decoration-2 underline-offset-4"
                  >
                    {member.full_name}
                  </button>
                  {member.employer ? (
                    <span className="mt-0.5 block text-[13px] text-slate">{member.employer}</span>
                  ) : null}
                </Td>
                <Td>{member.graduation_year ?? "—"}</Td>
                <Td>{member.profession ?? "—"}</Td>
                <Td>{member.city ?? "—"}</Td>
                <Td>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={() => setSelected(member.id)}
                    aria-label={`Open ${member.full_name}'s profile`}
                  >
                    View
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={page === 0 || results.loading}
          >
            Previous
          </Button>
          <span className="text-[13px] text-slate">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => value + 1)}
            disabled={last >= total || results.loading}
          >
            Next
          </Button>
        </div>
      ) : null}

      <p className={cn("mt-6 max-w-prose text-[13px] leading-relaxed text-slate")}>
        Contact details are shown only where the member has chosen to share them with other active members.
        Nothing on this page can reveal a hidden profile: the database refuses to return it.
      </p>

      {selected ? <MemberDetail id={selected} onClose={closeDetail} /> : null}
    </>
  );
}

export default function PortalDirectoryPage() {
  return (
    <RequireAuth>
      <RequireMember title="The directory is for approved members">
        <DirectoryScreen />
      </RequireMember>
    </RequireAuth>
  );
}
