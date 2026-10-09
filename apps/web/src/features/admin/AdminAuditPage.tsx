import { useState } from 'react';
import { AUDIT_ACTION_LABELS } from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { errorText } from '@/features/projects/server-error';
import { useAudit, type AuditFilters } from './api';
import { formatDateTime, tableClass, tdClass, thClass } from './format';

const show = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

/** SCR-ADMIN-04 Audit log (BR-ADMIN-14, BR-ADMIN-15): read only, newest first, 50 per page. */
export function AdminAuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const audit = useAudit(filters);
  const entries = audit.data?.pages.flatMap((page) => page.data) ?? [];
  const set = (patch: Partial<AuditFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <>
      <PageHeader title="Audit log" description="Sign-ins and admin actions" />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <SelectField
            label="Action"
            value={filters.action ?? ''}
            onChange={(e) => set({ action: e.target.value || undefined })}
            className="w-56"
          >
            <option value="">All actions</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Project key"
            value={filters.projectKey ?? ''}
            onChange={(e) => set({ projectKey: e.target.value.trim().toUpperCase() || undefined })}
            className="w-32"
          />
          <TextField
            label="From"
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => set({ from: e.target.value || undefined })}
            className="w-40"
          />
          <TextField
            label="To"
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => set({ to: e.target.value || undefined })}
            className="w-40"
          />
          <label className="flex h-9 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={!!filters.asAdmin}
              onChange={(e) => set({ asAdmin: e.target.checked || undefined })}
              className="size-4 accent-[var(--primary)]"
            />
            Only actions made as Admin
          </label>
        </div>
        {audit.isError && <Alert>{errorText(audit.error)}</Alert>}
        {audit.isSuccess && entries.length === 0 && <EmptyState title="No audit entries match" />}
        {entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <caption className="sr-only">Audit entries</caption>
              <thead>
                <tr>
                  <th className={thClass}>Time</th>
                  <th className={thClass}>Actor</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Target</th>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Change</th>
                  <th className={thClass}>IP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                      <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                    </td>
                    <td className={tdClass}>
                      {e.actor?.name ?? 'Unknown'}
                      {e.actedAs === 'ADMIN' && (
                        <Badge tone="admin" className="ml-2">
                          as Admin
                        </Badge>
                      )}
                    </td>
                    <td className={tdClass}>{e.actionLabel}</td>
                    <td className={tdClass}>{e.targetName}</td>
                    <td className={`${tdClass} font-mono`}>{e.projectKey ?? '—'}</td>
                    <td className={tdClass}>
                      {e.after ? (
                        <ul>
                          {Object.keys(e.after).map((field) => (
                            <li key={field}>
                              {field}:{' '}
                              {e.before && field in e.before && (
                                <>
                                  <del className="text-muted-foreground">
                                    {show(e.before[field])}
                                  </del>{' '}
                                  →{' '}
                                </>
                              )}
                              {show(e.after![field])}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>{e.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {audit.hasNextPage && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void audit.fetchNextPage()}
            disabled={audit.isFetchingNextPage}
          >
            Load more
          </Button>
        )}
      </Card>
    </>
  );
}
