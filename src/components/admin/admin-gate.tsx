"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuth, type Permission } from "@/lib/auth";
import { PERMISSION_LABELS } from "@/components/admin/nav";

/**
 * A screen-level gate. It is honest about being a gate and nothing more: the
 * write itself is refused by the SQL function if the caller lacks the role.
 */
export function AdminGate({
  permission,
  screen,
  children,
}: {
  permission?: Permission;
  screen: string;
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  if (permission && !can(permission)) {
    return <NotYourArea screen={screen} permission={permission} />;
  }
  return <>{children}</>;
}

export function NotYourArea({ screen, permission }: { screen: string; permission?: Permission }) {
  return (
    <div className="bg-white p-6 quiet-border">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate">Not your area</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-extrabold leading-tight text-navy">
        {screen}
      </h1>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-slate">
        Your current roles do not carry {permission ? <strong className="font-semibold text-navy">{PERMISSION_LABELS[permission]}</strong> : "this permission"}
        {permission ? ` (${permission})` : null}. Nothing on this screen has been read or changed.
      </p>
      <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-slate">
        Hiding the screen is a convenience, not the control: the database checks the same permission on every
        call and rejects writes from roles that do not hold it.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="ink" size="sm">
          <Link href="/admin/">Back to overview</Link>
        </Button>
        <Button asChild variant="quiet" size="sm">
          <Link href="/">Public site</Link>
        </Button>
      </div>
    </div>
  );
}

/** Inline version for one section of a page that still has other things to show. */
export function InlineGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <Notice tone="info" title="Not in your permissions">
        This section needs {PERMISSION_LABELS[permission]} ({permission}). It has not been loaded.
      </Notice>
    );
  }
  return <>{children}</>;
}
