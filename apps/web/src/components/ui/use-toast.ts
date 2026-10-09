import { createContext, useContext } from 'react';

export const ToastContext = createContext<(text: string) => void>(() => {});

/** Shows a short success message, e.g. toast(msg('MSG-PROJECT-19')). */
export function useToast() {
  return useContext(ToastContext);
}
