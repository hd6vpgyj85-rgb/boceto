import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import "./Toast.css";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

type ShowToast = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ShowToast | null>(null);

const VISIBLE_MS = 3200;
const EXIT_MS = 280;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const show = useCallback<ShowToast>(
    (message, type = "success") => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-2), { id, message, type, leaving: false }]);
      window.setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <button
            type="button"
            key={t.id}
            className={`toast toast-${t.type} ${t.leaving ? "toast-leaving" : ""}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-icon">{t.type === "success" ? <CheckIcon /> : t.type === "error" ? <AlertIcon /> : <InfoIcon />}</span>
            <span className="toast-message">{t.message}</span>
            <span className="toast-progress" style={{ animationDuration: `${VISIBLE_MS}ms` }} />
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path className="toast-check-path" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <line x1="12" y1="7" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <line x1="12" y1="11" x2="12" y2="17" />
      <circle cx="12" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}
