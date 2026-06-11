// Tiny toast system: every action gets immediate, human feedback.
import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  kind: "ok" | "err" | "info";
  text: string;
}

const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = nextId++;
    setToasts((ts) => [...ts, { id, kind, text }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
