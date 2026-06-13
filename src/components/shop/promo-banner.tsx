"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/context";

/** Auto-rotating promo strip. Uses admin-managed messages from /api/banners,
 *  falling back to the built-in (translated) defaults if none are set. */
export function PromoBanner() {
  const t = useT();
  const defaults = [t("home.promo1"), t("home.promo2"), t("home.promo3")];
  const [apiMsgs, setApiMsgs] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && Array.isArray(j.data) && j.data.length) {
          setApiMsgs(j.data.map((b: { text: string }) => b.text));
        }
      })
      .catch(() => {});
  }, []);

  const messages = apiMsgs.length ? apiMsgs : defaults;

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % messages.length), 1500);
    return () => clearInterval(id);
  }, [messages.length]);

  if (messages.length === 0) return null;
  const msg = messages[index % messages.length];

  return (
    <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-full bg-primary px-5 py-2 text-center shadow-sm">
      <span
        key={`${index}-${msg}`}
        className="inline-block animate-in fade-in slide-in-from-bottom-1 text-sm font-bold text-primary-foreground duration-500"
      >
        {msg}
      </span>
    </div>
  );
}
