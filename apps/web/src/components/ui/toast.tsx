import { useCallback, useState, type ReactNode } from 'react';
import { ToastContext } from './use-toast';

type Toast = { id: number; text: string };

/** Short success messages ("Changes saved", MSG-PROJECT-19) in a polite live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <p key={toast.id} className="rounded-md border bg-background px-4 py-2 text-sm shadow-md">
            {toast.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
