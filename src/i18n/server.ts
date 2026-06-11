import "server-only";
import { cookies } from "next/headers";
import { Locale, DEFAULT_LOCALE, isLocale, translate } from "./dictionaries";

/** Reads the selected locale from the cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Returns a translate function bound to the current request's locale. */
export async function getServerT() {
  const locale = await getLocale();
  return (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
}
