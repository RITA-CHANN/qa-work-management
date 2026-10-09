import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A modal dialog on the native <dialog> element: showModal() traps focus and makes the page behind
 * inert, Esc closes it. Focus goes back to the element that opened it (WCAG 2.2, NFR-PROJECT-07).
 * Use role="alertdialog" for confirmations (archive, delete, remove).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  role = 'dialog',
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: let React close it, so state and focus stay in sync.
        event.preventDefault();
        onClose();
      }}
      className={cn(
        'm-auto w-full max-w-lg rounded-lg border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-sm p-1 text-muted-foreground hover:bg-accent"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-6 py-4">
        {description && (
          <div id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}

/** The Cancel / confirm row at the bottom of a dialog. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}
