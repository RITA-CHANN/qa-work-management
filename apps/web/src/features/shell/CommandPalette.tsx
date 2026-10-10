import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { msg, type SearchGroup, type SearchResult } from '@qawm/shared';
import { Dialog } from '@/components/ui/dialog';
import { inputClass } from '@/components/ui/field';
import { useDebounced } from '@/lib/use-debounced';
import { cn } from '@/lib/utils';
import { useSearch } from './api';

const GROUP_LABELS: Record<SearchGroup, string> = {
  project: 'Projects',
  release: 'Releases',
  milestone: 'Sprints',
  user: 'Users',
};

/**
 * ⌘K / Ctrl+K search (BR-SHELL-06): combobox + listbox pattern. Arrow keys move, Enter opens,
 * Esc closes. Results come from the API, so they follow the same access rules.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query, 150);
  const search = useSearch(debounced);
  const navigate = useNavigate();
  const listId = useId();
  const results = search.data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  // The dialog's showModal() runs first (child effect) and focuses its first button; move focus to the input.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function choose(result: SearchResult | undefined) {
    if (!result) return;
    onClose();
    setQuery('');
    void navigate(result.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[active]);
    }
  }

  const groups = (Object.keys(GROUP_LABELS) as SearchGroup[])
    .map((group) => ({ group, items: results.filter((r) => r.group === group) }))
    .filter((g) => g.items.length > 0);
  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <Dialog open={open} onClose={onClose} title="Search" className="max-w-xl">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
        />
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Search projects, releases and sprints"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? optionId(active) : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a project, release or sprint…"
          className={cn(inputClass, 'h-10 pl-9')}
        />
      </div>
      <div id={listId} role="listbox" aria-label="Results" className="max-h-96 overflow-y-auto">
        {groups.map(({ group, items }) => (
          <div key={group} role="group" aria-label={GROUP_LABELS[group]} className="mb-2">
            <p aria-hidden="true" className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {GROUP_LABELS[group]}
            </p>
            {items.map((result) => {
              const index = results.indexOf(result);
              return (
                <div
                  key={`${result.group}-${result.id}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(result)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2',
                    index === active && 'bg-accent text-accent-foreground',
                  )}
                >
                  <span className="truncate font-medium">{result.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {result.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {debounced.trim() && search.isSuccess && results.length === 0 && (
          <p role="status" className="px-2 py-6 text-center text-muted-foreground">
            {msg('MSG-SHELL-01', { query: debounced.trim() })}
          </p>
        )}
      </div>
    </Dialog>
  );
}
