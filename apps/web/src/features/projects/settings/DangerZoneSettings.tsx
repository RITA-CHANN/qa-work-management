import { useId, useState, type ReactNode } from 'react';
import { msg } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useProjectAccess } from '../access';
import { useProjectAction } from '../api';
import { ArchiveProjectDialog, DeleteProjectDialog } from '../ProjectDialogs';
import { useProjectOutlet } from '../project-outlet';
import { errorText } from '../server-error';
import { SettingsSection } from './SettingsSection';

/**
 * Settings › Danger zone (SCR-PROJECT-06): archive or restore, and delete once archived (BR-PROJECT-08,
 * BR-PROJECT-09). Uses the same dialogs as the header's More menu (SCR-PROJECT-02).
 */
export function DangerZoneSettings() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const restore = useProjectAction(project.key, 'restore');
  const toast = useToast();
  const [dialog, setDialog] = useState<'archive' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const archived = !!project.archivedAt;
  const canArchive = access.canEvenArchived('project:archive');
  const canDelete = access.canEvenArchived('project:delete');

  async function doRestore() {
    setError(null);
    try {
      await restore.mutateAsync();
      toast(msg('MSG-PROJECT-19'));
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  return (
    <SettingsSection title="Danger zone">
      {error && <Alert className="mb-2">{error}</Alert>}
      <div className="flex flex-col divide-y">
        {canArchive &&
          (archived ? (
            <DangerRow title="Restore project" text="Makes the project editable again.">
              <Button
                variant="outline"
                onClick={() => void doRestore()}
                disabled={restore.isPending}
              >
                Restore
              </Button>
            </DangerRow>
          ) : (
            <DangerRow
              title="Archive project"
              text="Read-only for everyone until restored. Needed before delete."
            >
              <Button variant="outline" onClick={() => setDialog('archive')}>
                Archive…
              </Button>
            </DangerRow>
          ))}
        {canDelete && (
          <DangerRow
            title="Delete project"
            text={
              archived
                ? 'Removes the project for good. Only possible while it has no releases.'
                : 'Archive the project first.'
            }
          >
            {(textId) => (
              <Button
                variant="destructive"
                disabled={!archived}
                aria-describedby={archived ? undefined : textId}
                onClick={() => setDialog('delete')}
              >
                Delete…
              </Button>
            )}
          </DangerRow>
        )}
      </div>

      <ArchiveProjectDialog
        project={project}
        open={dialog === 'archive'}
        onClose={() => setDialog(null)}
      />
      <DeleteProjectDialog
        project={project}
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
      />
    </SettingsSection>
  );
}

/** One action: its name and effect on the left, its button on the right. */
function DangerRow({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  /** The button; a function gets the text's id, to link it as the reason a button is disabled. */
  children: ReactNode | ((textId: string) => ReactNode);
}) {
  const textId = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p id={textId} className="text-sm text-muted-foreground">
          {text}
        </p>
      </div>
      {typeof children === 'function' ? children(textId) : children}
    </div>
  );
}
