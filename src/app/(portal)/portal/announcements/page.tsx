"use client";

import * as React from "react";
import { RequireAuth } from "@/components/portal/guards";
import { PageTitle, StatusPill, useLoad } from "@/components/portal/kit";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { listAnnouncements } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, relativeDays } from "@/lib/format";

type Audience = "all" | "members" | "admins";

const FILTERS: { value: Audience; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "members", label: "Members" },
  { value: "admins", label: "Officers" },
];

function AnnouncementsScreen() {
  const { session } = useAuth();
  const [audience, setAudience] = React.useState<Audience>("all");

  const data = useLoad(session ? `announcements:${session.user.id}` : "announcements:none", () =>
    session ? listAnnouncements() : Promise.resolve([]),
  );

  const rows = React.useMemo(() => {
    const all = [...(data.data ?? [])];
    all.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.published_at.localeCompare(a.published_at);
    });
    return audience === "all" ? all : all.filter((row) => row.audience === audience);
  }, [data.data, audience]);

  const counts = React.useMemo(() => {
    const all = data.data ?? [];
    return {
      all: all.length,
      members: all.filter((row) => row.audience === "members").length,
      admins: all.filter((row) => row.audience === "admins").length,
    };
  }, [data.data]);

  return (
    <>
      <PageTitle
        title="Announcements"
        lede="Notices from the executive, the welfare desk and the events team. Pinned notices stay at the top."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = audience === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setAudience(filter.value)}
              aria-pressed={active}
              className={
                active
                  ? "border border-navy bg-navy px-3 py-1.5 font-[family-name:var(--font-display)] text-[13px] font-bold text-white"
                  : "border border-paper-dim bg-white px-3 py-1.5 font-[family-name:var(--font-display)] text-[13px] font-bold text-navy hover:border-navy"
              }
            >
              {filter.label}
              {counts[filter.value] > 0 ? (
                <span className={active ? "ml-2 text-white/70" : "ml-2 text-slate"}>
                  {counts[filter.value]}
                </span>
              ) : null}
            </button>
          );
        })}
        {data.loading && data.data ? (
          <span className="ml-2">
            <Spinner label="Updating" />
          </span>
        ) : null}
      </div>

      {data.error ? (
        <Notice tone="error" title="Could not load announcements" className="mb-6">
          {data.error}{" "}
          <button
            type="button"
            onClick={data.reload}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      ) : null}

      {data.loading && !data.data ? (
        <div className="bg-white px-5 py-10 quiet-border">
          <Spinner label="Loading announcements" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={audience === "all" ? "No announcements yet" : "Nothing in this section yet"}>
          {audience === "all"
            ? "Notices appear here when an officer publishes one. Anything pinned is shown first, on this page and on your dashboard."
            : "Switch back to Everything to see the notices that are available to you."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((announcement) => (
            <li key={announcement.id} className="bg-white quiet-border">
              <article className="px-5 py-5 md:px-6 md:py-6">
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.is_pinned ? <StatusPill tone="neutral">Pinned</StatusPill> : null}
                  <StatusPill tone="neutral">
                    {announcement.audience === "members" ? "Members" : "Officers"}
                  </StatusPill>
                  <time
                    dateTime={announcement.published_at}
                    className="text-[13px] text-slate"
                    title={formatDate(announcement.published_at)}
                  >
                    {formatDate(announcement.published_at)} · {relativeDays(announcement.published_at)}
                  </time>
                </div>

                <h2 className="mt-3 font-[family-name:var(--font-display)] text-[20px] font-bold leading-snug text-navy md:text-[22px]">
                  {announcement.title}
                </h2>

                <div className="mt-3 max-w-[68ch] whitespace-pre-line text-[16px] leading-[1.65] text-navy">
                  {announcement.body}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 max-w-prose text-[13px] leading-relaxed text-slate">
        Announcements are read-only here. What you can see is decided by the database: officer-only notices
        are never sent to a member&apos;s browser.
      </p>
    </>
  );
}

export default function PortalAnnouncementsPage() {
  return (
    <RequireAuth>
      <AnnouncementsScreen />
    </RequireAuth>
  );
}
