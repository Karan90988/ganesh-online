"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "Last 90 days" },
];

/** Date-range selector for the dashboard. Updates the URL; the server page
 *  re-reads searchParams and recomputes all order analytics for the range. */
export function DashboardDateFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("range") || "month";
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");

  const go = (qs: string) => router.push(`/admin/dashboard?${qs}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={current === p.key ? "default" : "outline"}
          onClick={() => go(`range=${p.key}`)}
        >
          {p.label}
        </Button>
      ))}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          aria-label="From date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 w-[9.5rem]"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="date"
          aria-label="To date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 w-[9.5rem]"
        />
        <Button
          size="sm"
          variant={current === "custom" ? "default" : "outline"}
          disabled={!from || !to}
          onClick={() => go(`range=custom&from=${from}&to=${to}`)}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
