"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, translate, DEFAULT_LOCALE } from "./dictionaries";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      // Persist for both client (instant) and server (cookie) reads.
      document.cookie = `locale=${l}; path=/; max-age=31536000`;
      try {
        localStorage.setItem("locale", l);
      } catch {}
      // Re-render server components (home, contact metadata) with the new locale.
      router.refresh();
    },
    [router]
  );

  const t = useCallback<Translate>((key, params) => translate(locale, key, params), [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience hook returning just the translate function. */
export function useT(): Translate {
  return useContext(I18nContext).t;
}
