"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { LOCALES, LOCALE_LABELS, Locale } from "@/i18n/dictionaries";

/** Compact language selector (English / Hindi / Marathi). */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="relative flex items-center">
      <Globe className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-9 cursor-pointer rounded-lg border-2 border-input bg-background pl-7 pr-2 text-sm font-semibold outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
