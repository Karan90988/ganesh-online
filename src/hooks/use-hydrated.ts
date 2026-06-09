"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client. Used to avoid
 * hydration mismatches when reading from persisted Zustand state (localStorage).
 */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
