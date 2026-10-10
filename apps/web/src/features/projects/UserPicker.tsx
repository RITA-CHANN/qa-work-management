import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { msg, type UserOption } from '@qawm/shared';
import { FieldShell, inputClass } from '@/components/ui/field';
import { useDebounced } from '@/lib/use-debounced';
import { cn } from '@/lib/utils';
import { useUserSearch } from './api';

const optionLabel = (user: UserOption) => `${user.name} (${user.email})`;

/**
 * Pick one active user by typing part of a name or email (combobox + listbox pattern). The server returns up to
 * 20 matches, so every user can be reached however many there are (BR-PROJECT-41). Users in `unavailable` are
 * listed with its reason and can't be picked.
 */
export function UserPicker({
  label,
  value,
  onChange,
  unavailable,
  error,
}: {
  label: string;
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
  unavailable: Map<string, string>;
  error?: string;
}) {
  const [query, setQuery] = useState(value ? optionLabel(value) : '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // While a user is chosen, the box shows "Name (email)"; it is not a search term.
  const debounced = useDebounced(value ? '' : query, 200);
  const users = useUserSearch(debounced, open);
  const results = users.data ?? [];
  const expanded = open && (results.length > 0 || (users.isSuccess && !!debounced.trim()));
  const optionId = (index: number) => `${listId}-${index}`;

  function choose(user: UserOption | undefined) {
    if (!user || unavailable.has(user.id)) return;
    onChange(user);
    setQuery(optionLabel(user));
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && expanded) {
      // Enter picks the active option instead of submitting the form.
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape' && open) {
      // Close the list only, not the dialog around it.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <FieldShell label={label} error={error}>
      {({ id, describedBy }) => (
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && results.length > 0 ? optionId(active) : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            placeholder="Type a name or email"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (value) onChange(null);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className={inputClass}
          />
          <div
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            hidden={!expanded}
            className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-card p-1 shadow-lg"
          >
            {results.map((user, index) => {
              const reason = unavailable.get(user.id);
              return (
                <div
                  key={user.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  aria-disabled={reason ? true : undefined}
                  // Keep focus in the input, so the list does not close before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(user)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm',
                    reason ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer',
                    index === active && 'bg-accent text-accent-foreground',
                  )}
                >
                  <span className="truncate">{optionLabel(user)}</span>
                  {reason && <span className="shrink-0 text-xs">{reason}</span>}
                </div>
              );
            })}
            {users.isSuccess && results.length === 0 && debounced.trim() && (
              <p role="status" className="px-2 py-3 text-center text-sm text-muted-foreground">
                {msg('MSG-PROJECT-44', { query: debounced.trim() })}
              </p>
            )}
          </div>
        </div>
      )}
    </FieldShell>
  );
}
