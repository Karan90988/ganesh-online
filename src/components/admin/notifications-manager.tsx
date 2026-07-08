"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Loader2, Send, ShoppingBag, Box, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

type Channel = "RETAIL" | "WHOLESALE";

interface BroadcastLog {
  id: string;
  channel: string;
  title: string;
  body: string;
  sentCount: number;
  createdAt: string;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  RETAIL: {
    label: "Retail",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: ShoppingBag,
  },
  WHOLESALE: {
    label: "Wholesale",
    color: "#ea7c0c",
    bg: "#fff7ed",
    border: "#fed7aa",
    icon: Box,
  },
};

export function NotificationsManager() {
  const toast = useToast();
  const [channel, setChannel] = useState<Channel>("RETAIL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) {
        setDeviceCount(json.data.deviceCount);
        setLogs(json.data.logs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Both title and message are required");
      return;
    }
    const confirmed = window.confirm(
      `Send "${title}" to all ${deviceCount ?? "?"} registered devices?`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, title: title.trim(), body: body.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Sent to ${json.data.sentCount} device${json.data.sentCount !== 1 ? "s" : ""}`);
        setTitle("");
        setBody("");
        await load();
      } else {
        toast.error("Send failed", json.error);
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSending(false);
    }
  }

  const cfg = CHANNEL_CONFIG[channel];
  const Icon = cfg.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Push Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a broadcast notification to all customers who have the GaneshNow app installed.
        </p>
      </div>

      {/* Device reach banner */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div>
            <p className="font-semibold">{deviceCount ?? 0} registered device{deviceCount !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">All broadcasts go to every device regardless of channel</p>
          </div>
        )}
      </div>

      {/* Channel tabs */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Notification channel</p>
        <div className="flex gap-2">
          {(["RETAIL", "WHOLESALE"] as Channel[]).map((ch) => {
            const c = CHANNEL_CONFIG[ch];
            const active = channel === ch;
            const ChIcon = c.icon;
            return (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className="flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all"
                style={
                  active
                    ? { borderColor: c.color, backgroundColor: c.bg, color: c.color }
                    : { borderColor: "transparent", backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                }
              >
                <ChIcon className="h-4 w-4" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose */}
      <div
        className="rounded-xl border-2 bg-card p-5 space-y-4 transition-colors"
        style={{ borderColor: cfg.border }}
      >
        <div className="flex items-center gap-2 font-semibold" style={{ color: cfg.color }}>
          <Icon className="h-4 w-4" />
          Compose — {cfg.label} notification
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-title">Title</Label>
            <span className="text-xs text-muted-foreground">{title.length}/50</span>
          </div>
          <Input
            id="notif-title"
            placeholder={channel === "RETAIL" ? "Weekend Sale — Retail Customers!" : "Bulk Deal Alert — Wholesale Buyers!"}
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-body">Message</Label>
            <span className={`text-xs ${body.length > 120 ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}>
              {body.length}/150
            </span>
          </div>
          <textarea
            id="notif-body"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            rows={3}
            placeholder={channel === "RETAIL" ? "Get 10% off on fresh groceries today. Shop now!" : "New stock available. Place your wholesale order now!"}
            maxLength={150}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {body.length > 120 && (
            <p className="text-xs text-amber-600">Long messages may be cut off on some devices</p>
          )}
        </div>

        {/* Preview chip */}
        {(title || body) && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}
          >
            <p className="font-bold">{title || "Title…"}</p>
            <p className="text-muted-foreground mt-0.5">{body || "Message…"}</p>
          </div>
        )}

        <Button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim() || (deviceCount ?? 0) === 0}
          className="gap-2"
          style={{ backgroundColor: cfg.color }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? "Sending…" : `Send to all ${deviceCount ?? "?"} devices`}
        </Button>
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Recent broadcasts
          </div>
          <div className="divide-y">
            {logs.map((log) => {
              const c = CHANNEL_CONFIG[log.channel as Channel] ?? CHANNEL_CONFIG.RETAIL;
              return (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: c.bg, color: c.color }}
                      >
                        {c.label}
                      </span>
                      <span className="font-medium truncate">{log.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{log.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{log.sentCount} sent</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
