"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  min: number;
  unitLabel?: string;
  onCommit: (qty: number) => void;
  /** true when shown on a dark (primary) background */
  dark?: boolean;
}

/**
 * Editable quantity field for the +/- steppers. Lets the customer type an exact
 * quantity (e.g. 36) instead of tapping + repeatedly. Only commits values that
 * meet the line's minimum; typing something lower reverts on blur (use the −
 * button / trash to actually reduce/remove).
 */
export function QtyInput({ value, min, unitLabel, onCommit, dark = false }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <span className="inline-flex items-baseline justify-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={draft}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d]/g, "");
          setDraft(v);
          const n = parseInt(v, 10);
          if (!Number.isNaN(n) && n >= min) onCommit(n);
        }}
        onBlur={() => {
          const n = parseInt(draft, 10);
          if (Number.isNaN(n) || n < min) setDraft(String(value));
        }}
        style={{ width: `${Math.max(3, draft.length + 1)}ch` }}
        className={`rounded-md border px-2 py-0.5 text-center text-base font-bold outline-none transition-colors focus:ring-2 ${
          dark
            ? "border-white/50 bg-white/20 text-primary-foreground placeholder-white/70 focus:bg-white/30 focus:ring-white/70"
            : "border-input bg-background text-foreground focus:ring-ring"
        }`}
      />
      {unitLabel && (
        <span className={`text-xs font-normal ${dark ? "opacity-90" : "text-muted-foreground"}`}>
          {unitLabel}
        </span>
      )}
    </span>
  );
}
