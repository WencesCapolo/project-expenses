"use client";

import { useEffect, useRef, useState } from "react";

export interface FabAction {
  label: string;
  onSelect: () => void;
}

// Floating action button, bottom-right. Tapping it fans out a stack of actions
// and rotates the "+" into a "✕". Closes on outside click or selection.
export default function Fab({
  actions,
  label = "Agregar",
}: {
  actions: FabAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
    >
      {open && (
        <div className="flex flex-col items-end gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-md transition-colors hover:bg-surface-muted"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={`text-3xl leading-none transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
    </div>
  );
}
