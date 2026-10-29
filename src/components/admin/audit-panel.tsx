"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Td } from "@/components/ui/table";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { FilterField, TableSection } from "@/components/admin/table-section";
import { StatusPill } from "@/components/admin/status-pill";
import { errorMessage } from "@/components/admin/use-admin-data";
import { shortId } from "@/components/admin/datetime";
import { listAuditLogs } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "@/lib/types";

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

/**
 * The audit log, rendered the same way on the overview (a tail of ten), in
 * reports and on its own screen. Filters are applied by the database query,
 * not in memory, so a filtered view is the whole filtered record.
 */
export function AuditPanel({
  limit,
  filterable = false,
  exportable = false,
  stickyHeader = false,
  title = "Audit log",
  description,
  className,
}: {
  limit?: number;
  filterable?: boolean;
  exportable?: boolean;
  stickyHeader?: boolean;
  title?: string;
  description?: React.ReactNode;
  className?: string;
}) {
  const [rows, setRows] = React.useState<AuditLog[]>([]);
  const [actions, setActions] = React.useState<string[]>([]);
  const [entities, setEntities] = React.useState<string[]>([]);
  const [action, setAction] = React.useState("");
  const [entity, setEntity] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const actionId = React.useId();
  const entityId = React.useId();

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listAuditLogs({ action: action || undefined, entity: entity || undefined })
      .then((data) => {
        if (!active) return;
        setRows(limit ? data.slice(0, limit) : data);
        if (!action && !entity) {
          setActions(uniqueSorted(data.map((row) => row.action)));
          setEntities(uniqueSorted(data.map((row) => row.entity)));
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause, "Could not load the audit log."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [action, entity, limit, nonce]);

  const filtered = Boolean(action || entity);

  const exportRows = rows.map((row) => ({
    timestamp: row.created_at,
    actor: row.actor_email ?? row.actor_id ?? "system",
    action: row.action,
    entity: row.entity,
    entity_id: row.entity_id ?? "",
    detail: row.detail ? JSON.stringify(row.detail) : "",
  }));

  const filters = filterable ? (
    <div className="flex flex-wrap items-end gap-3">
      <FilterField id={actionId} label="Action">
        <Select
          id={actionId}
          className="h-10 w-48 text-[14px]"
          value={action}
          onChange={(event) => setAction(event.target.value)}
        >
          <option value="">All actions</option>
          {actions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </FilterField>
      <FilterField id={entityId} label="Entity">
        <Select
          id={entityId}
          className="h-10 w-44 text-[14px]"
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
        >
          <option value="">All entities</option>
          {entities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </FilterField>
      {filtered ? (
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            setAction("");
            setEntity("");
          }}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  ) : null;

  return (
    <TableSection
      className={className}
      caption={title}
      description={
        description ??
        "Every privileged write is recorded by the database itself: who acted, on what, and when."
      }
      head={["Time", "Actor", "Action", "Entity", "Detail"]}
      rowCount={rows.length}
      loading={loading}
      error={error}
      onRetry={() => setNonce((value) => value + 1)}
      emptyTitle={filtered ? "No entries match those filters" : "The audit log is empty"}
      emptyBody={
        filtered
          ? "Nothing has been recorded for this action and entity combination in the most recent entries."
          : "Entries appear here as soon as an administrator makes a change."
      }
      stickyHeader={stickyHeader}
      actions={
        <>
          {filters}
          {exportable ? (
            <CsvExportButton
              rows={exportRows}
              filename="kosa-audit-log.csv"
              columns={["timestamp", "actor", "action", "entity", "entity_id", "detail"]}
            />
          ) : null}
        </>
      }
      footer={
        limit && rows.length >= limit
          ? `Showing the last ${limit} of up to 300 entries, newest first.`
          : filtered
            ? `${rows.length} matching entries, newest first.`
            : `${rows.length} entries, newest first. The query returns the most recent 300.`
      }
    >
      {rows.map((row) => {
        const isOpen = expanded === row.id;
        return (
          <React.Fragment key={row.id}>
            <tr>
              <Td className="whitespace-nowrap tabular-nums text-[13px] text-slate">{formatDateTime(row.created_at)}</Td>
              <Td className="text-[14px]">
                <span className="block max-w-[26ch] truncate">{row.actor_email ?? "system"}</span>
                {row.actor_id ? <span className="block font-mono text-[13px] text-slate">{shortId(row.actor_id)}</span> : null}
              </Td>
              <Td className="whitespace-nowrap font-mono text-[13px]">{row.action}</Td>
              <Td className="text-[14px]">
                <span className="block">{row.entity}</span>
                {row.entity_id ? <span className="block font-mono text-[13px] text-slate">{shortId(row.entity_id)}</span> : null}
              </Td>
              <Td>
                {row.detail ? (
                  <Button
                    variant="quiet"
                    size="sm"
                    className="h-8 px-0 text-[13px]"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                  >
                    {isOpen ? "Hide" : "Show JSON"}
                  </Button>
                ) : (
                  <StatusPill label="none" tone="neutral" />
                )}
              </Td>
            </tr>
            {isOpen && row.detail ? (
              <tr>
                <td colSpan={5} className="border-t border-paper-dim bg-paper px-4 py-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-navy">
                    {JSON.stringify(row.detail, null, 2)}
                  </pre>
                </td>
              </tr>
            ) : null}
          </React.Fragment>
        );
      })}
    </TableSection>
  );
}
