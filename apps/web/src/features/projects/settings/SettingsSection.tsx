import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * One settings section: a <section> labelled by its <h2>. Focus moves to the heading when the section
 * opens, so keyboard and screen-reader users land on the new content (SCR-PROJECT-06 Accessibility).
 */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[var(--radius)] border bg-card p-5 shadow-card"
    >
      <h2
        id={titleId}
        ref={headingRef}
        tabIndex={-1}
        className="mb-4 text-[15px] font-semibold outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
