"use client";

import Link from "next/link";
import * as React from "react";
import { RequireAuth } from "@/components/portal/guards";
import {
  APPLICATION_LABELS,
  MetaRow,
  PageTitle,
  Panel,
  StatusPill,
  WELFARE_LABELS,
  applicationTone,
  membershipTone,
  MEMBERSHIP_LABELS,
  useLoad,
  welfareTone,
} from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import {
  getMyApplication,
  listAnnouncements,
  listEvents,
  listMyWelfareRequests,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dayParts, formatDate, formatTime, isFuture, relativeDays } from "@/lib/format";

const QUICK_LINKS = [
  { href: "/portal/profile/", label: "Your profile", note: "Profession, year and directory visibility" },
  { href: "/portal/application/", label: "Membership application", note: "Status and reviewer notes" },
  { href: "/portal/directory/", label: "Alumni directory", note: "Find members by year or profession" },
  { href: "/portal/events/", label: "Events", note: "RSVP and see your registrations" },
  { href: "/portal/welfare/", label: "Welfare desk", note: "Apply for support, in confidence" },
  { href: "/portal/mentorship/", label: "Mentorship", note: "Offer to mentor or ask for one" },
];

function Dashboard() {
  const { profile, membership, memberStatus, session, loading } = useAuth();

  const loaded = useLoad(session ? `dashboard:${session.user.id}` : "dashboard:none", async () => {
    if (!session) return null;
    const [application, events, announcements, welfare] = await Promise.all([
      getMyApplication(),
      listEvents(),
      listAnnouncements(),
      listMyWelfareRequests(),
    ]);
    return { application, events, announcements, welfare };
  });

  if (loading) return <PageLoading label="Loading your dashboard" />;

  const data = loaded.data;
  const firstName = (profile?.preferred_name || profile?.full_name || "").split(" ")[0];
  const nextEvent = data?.events
    .filter((event) => event.is_published && isFuture(event.starts_at))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const announcements = [...(data?.announcements ?? [])]
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.published_at.localeCompare(a.published_at);
    })
    .slice(0, 3);

  const openWelfare = data?.welfare.find(
    (request) => request.status === "submitted" || request.status === "reviewing" || request.status === "approved",
  );

  return (
    <>
      <PageTitle
        title={firstName ? `Welcome back, ${firstName}` : "Your dashboard"}
        lede="Your membership record, what is coming up, and anything you have open with the association."
      />

      {!profile ? (
        <Notice tone="warning" title="Your profile has not been created yet" className="mb-6">
          Other members cannot see you in the directory until it exists.{" "}
          <Link href="/portal/profile/" className="underline decoration-2 underline-offset-4">
            Set up your profile
          </Link>
          .
        </Notice>
      ) : null}

      {loaded.error ? (
        <Notice tone="error" title="Some of the dashboard could not load" className="mb-6">
          {loaded.error}{" "}
          <button
            type="button"
            onClick={loaded.reload}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel
            title="Membership"
            description="Only the membership officer can change any of this."
            action={
              <Button asChild variant="quiet" size="sm">
                <Link href="/portal/application/">Application</Link>
              </Button>
            }
          >
            <dl>
              <MetaRow label="Status">
                {membership ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={membershipTone(membership.status)}>
                      {MEMBERSHIP_LABELS[membership.status]}
                    </StatusPill>
                    <span className="text-[14px] text-slate">
                      {membership.status === "active"
                        ? "Full access to member areas."
                        : membership.status === "pending"
                          ? "Awaiting the membership officer's decision."
                          : membership.status === "lapsed"
                            ? "Member areas are closed until restored."
                            : "Member areas are closed while suspended."}
                    </span>
                  </span>
                ) : data?.application ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={applicationTone(data.application.status)}>
                      {APPLICATION_LABELS[data.application.status]}
                    </StatusPill>
                    <span className="text-[14px] text-slate">No membership record yet.</span>
                  </span>
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="neutral">Not a member</StatusPill>
                    <Link
                      href="/portal/application/"
                      className="text-[14px] underline decoration-2 underline-offset-4"
                    >
                      Start the application
                    </Link>
                  </span>
                )}
              </MetaRow>
              <MetaRow label="Member number">
                {membership?.member_no ?? <span className="text-slate">Not issued yet</span>}
              </MetaRow>
              <MetaRow label="Year of completion">
                {membership?.cohort_year ?? profile?.graduation_year ?? (
                  <span className="text-slate">Not recorded</span>
                )}
              </MetaRow>
              <MetaRow label="Joined">
                {membership?.joined_at ? formatDate(membership.joined_at) : (
                  <span className="text-slate">
                    {memberStatus === "pending" ? "Recorded when your application is approved" : "—"}
                  </span>
                )}
              </MetaRow>
            </dl>
          </Panel>

          <Panel
            title="Next event"
            action={
              <Button asChild variant="quiet" size="sm">
                <Link href="/portal/events/">All events</Link>
              </Button>
            }
          >
            {loaded.loading && !data ? (
              <Spinner label="Loading events" />
            ) : nextEvent ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex w-20 shrink-0 flex-col items-center border border-paper-dim px-3 py-2 text-center">
                  <span className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-wide text-slate">
                    {dayParts(nextEvent.starts_at).weekday}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-[28px] font-extrabold leading-none text-navy">
                    {dayParts(nextEvent.starts_at).day}
                  </span>
                  <span className="text-[13px] text-slate">{dayParts(nextEvent.starts_at).month}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-display)] text-[17px] font-bold leading-snug text-navy">
                    {nextEvent.title}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate">
                    {formatDate(nextEvent.starts_at)} at {formatTime(nextEvent.starts_at)} EAT
                    {nextEvent.venue ? ` · ${nextEvent.venue}` : ""}
                  </p>
                  <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-navy">
                    {nextEvent.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/portal/events/#event-${nextEvent.id}`}>RSVP for this event</Link>
                    </Button>
                    <span className="text-[13px] text-slate">{relativeDays(nextEvent.starts_at)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No upcoming events are published">
                Confirmed dates appear here as soon as the events team publishes them. Past events stay
                listed under Events with your registration history.
              </EmptyState>
            )}
          </Panel>

          <Panel
            title="Announcements"
            action={
              <Button asChild variant="quiet" size="sm">
                <Link href="/portal/announcements/">Read all</Link>
              </Button>
            }
            bodyClassName="px-0 py-0"
          >
            {loaded.loading && !data ? (
              <div className="px-5 py-5">
                <Spinner label="Loading announcements" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="px-5 py-5">
                <EmptyState title="No announcements yet">
                  Notices from the executive and the welfare desk will appear here, pinned first when they
                  are important.
                </EmptyState>
              </div>
            ) : (
              <ul>
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className="border-b border-paper-dim px-5 py-4 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {announcement.is_pinned ? (
                        <StatusPill tone="neutral">Pinned</StatusPill>
                      ) : null}
                      <p className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                        {announcement.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[13px] text-slate">
                      {formatDate(announcement.published_at)} · {relativeDays(announcement.published_at)}
                    </p>
                    <p className="mt-2 line-clamp-3 max-w-prose text-[14px] leading-relaxed text-navy">
                      {announcement.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel
            title="Welfare"
            action={
              <Button asChild variant="quiet" size="sm">
                <Link href="/portal/welfare/">Open</Link>
              </Button>
            }
          >
            {loaded.loading && !data ? (
              <Spinner label="Loading your welfare requests" />
            ) : openWelfare ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={welfareTone(openWelfare.status)}>
                    {WELFARE_LABELS[openWelfare.status]}
                  </StatusPill>
                  <span className="text-[13px] text-slate">
                    submitted {formatDate(openWelfare.created_at)}
                  </span>
                </div>
                <p className="mt-3 text-[15px] font-semibold leading-snug text-navy">
                  {openWelfare.summary}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-slate">
                  {openWelfare.is_confidential
                    ? "Marked confidential: only the welfare desk sees the details."
                    : "The welfare desk can see this request."}
                </p>
                <Link
                  href="/portal/welfare/"
                  className="mt-3 inline-block text-[14px] text-navy underline decoration-2 underline-offset-4"
                >
                  See the full timeline
                </Link>
              </div>
            ) : (
              <EmptyState title="No open welfare request">
                If you ever need help with bereavement, medical costs, education or sudden hardship, the
                welfare desk takes requests here. Nothing is submitted until you send it.
              </EmptyState>
            )}
          </Panel>

          <Panel title="Quick links" bodyClassName="px-0 py-0">
            <ul>
              {QUICK_LINKS.map((link) => (
                <li key={link.href} className="border-b border-paper-dim last:border-b-0">
                  <Link href={link.href} className="block px-5 py-3 hover:bg-paper">
                    <span className="block font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate">{link.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function PortalDashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
