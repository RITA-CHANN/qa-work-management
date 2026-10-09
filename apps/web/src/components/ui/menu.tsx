import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './button';

export type MenuItem = { label: string; onSelect: () => void; destructive?: boolean };

/**
 * A button that opens a list of actions (ARIA menu button pattern): arrow keys move between items,
 * Esc closes and returns focus to the button.
 */
export function Menu({
  label,
  items,
  icon,
  trigger,
  align = 'right',
}: {
  /** Accessible name of the button (and its visible text unless `trigger` is given). */
  label: string;
  items: MenuItem[];
  icon?: ReactNode;
  /** Custom visible content for the button, e.g. an avatar. */
  trigger?: ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest(`[data-menu="${menuId}"]`)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, menuId]);

  function onKeyDown(event: KeyboardEvent) {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div className="relative" data-menu={menuId} onKeyDown={onKeyDown}>
      <Button
        ref={buttonRef}
        variant={trigger ? 'ghost' : 'outline'}
        aria-label={trigger ? label : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger ?? (
          <>
            {icon}
            {label}
          </>
        )}
        <ChevronDown aria-hidden="true" className="size-4" />
      </Button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-30 mt-1 flex min-w-44 flex-col rounded-lg border bg-popover p-1 shadow-md`}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none ${
                item.destructive ? 'text-destructive' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
