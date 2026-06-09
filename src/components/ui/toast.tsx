"use client";

import * as React from "react";
import { create } from "zustand";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => {
      const id = Date.now() + Math.random();
      setTimeout(() => {
        set((s2) => ({ toasts: s2.toasts.filter((x) => x.id !== id) }));
      }, 4000);
      return { toasts: [...s.toasts, { ...t, id }] };
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Convenience hook: const toast = useToast(); toast.success("Saved"). */
export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (title: string, description?: string) =>
      push({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      push({ title, description, variant: "error" }),
    info: (title: string, description?: string) =>
      push({ title, description, variant: "info" }),
  };
}

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[95vw] max-w-md -translate-x-1/2 flex-col gap-2 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-background p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2",
            t.variant === "success" && "border-green-200",
            t.variant === "error" && "border-red-200"
          )}
          role="status"
        >
          <div className="mt-0.5">{ICONS[t.variant]}</div>
          <div className="flex-1">
            <p className="font-semibold leading-tight">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
