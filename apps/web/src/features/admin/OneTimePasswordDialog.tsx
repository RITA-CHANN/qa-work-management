import { msg } from '@qawm/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';

/** MSG-ADMIN-02: the one-time password, shown once (BR-ADMIN-07, BR-ADMIN-12). */
export function OneTimePasswordDialog({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} title="One-time password" description={msg('MSG-ADMIN-02')}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="font-mono">{email}</dd>
        <dt className="text-muted-foreground">Password</dt>
        <dd>
          <output
            aria-label="One-time password"
            className="rounded bg-muted px-2 py-1 font-mono text-base"
          >
            {password}
          </output>
        </dd>
      </dl>
      <DialogActions>
        <Button variant="outline" onClick={() => void navigator.clipboard?.writeText(password)}>
          Copy
        </Button>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
