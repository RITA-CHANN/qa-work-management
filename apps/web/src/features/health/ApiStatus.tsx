import { cn } from '@/lib/utils';
import { useHealth } from './use-health';

/**
 * Small "API status" indicator in the header.
 * role="status" makes it a live region and easy to find with getByRole('status').
 */
export function ApiStatus() {
  const { data, isPending, isError } = useHealth();

  const state = isPending
    ? { label: 'Checking…', dot: 'bg-muted-foreground' }
    : isError || data?.status !== 'ok'
      ? { label: 'Offline', dot: 'bg-destructive' }
      : { label: 'Online', dot: 'bg-success' };

  return (
    <p
      role="status"
      aria-label="API status"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <span aria-hidden="true" className={cn('size-2 rounded-full', state.dot)} />
      API: {state.label}
    </p>
  );
}
