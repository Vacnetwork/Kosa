"use client";

import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditPanel } from "@/components/admin/audit-panel";
import { Notice } from "@/components/ui/notice";

export default function AdminAuditPage() {
  return (
    <AdminGate screen="Audit log">
      <AdminPageHeader
        title="Audit log"
        description="Who did what, to which record, and when. Written by the database on every privileged call: approving an application, changing a status, granting a role, recording money, deciding welfare."
        meta={
          <>
            <span>Newest first</span>
            <span>At most 300 entries per query</span>
            <span>Filter by action or entity, then export the filtered rows</span>
          </>
        }
      />

      <Notice tone="info" className="mb-4">
        The detail column holds the arguments the function recorded, as JSON. It is shown as stored — nothing here is
        reformatted into a friendlier story.
      </Notice>

      <AuditPanel filterable exportable stickyHeader title="Entries" description="Filtered by the database, not in the browser." />
    </AdminGate>
  );
}
