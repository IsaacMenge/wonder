"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  variant?: "success" | "error" | "info";
  duration?: number; // ms
}

interface ToastContextValue {
  addToast: (msg: string, opts?: Omit<Toast, "id" | "message">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback<ToastContextValue["addToast"]>((message, opts) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = {
      id,
      message,
      variant: opts?.variant ?? "info",
      duration: opts?.duration ?? 4000,
    };
    setToasts((prev) => [...prev, toast]);
    // auto-remove
    setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `px-4 py-3 rounded shadow-lg text-sm text-white ` +
              (t.variant === "error"
                ? "bg-red-600"
                : t.variant === "success"
                ? "bg-green-600"
                : "bg-gray-800")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
