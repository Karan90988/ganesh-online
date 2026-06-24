"use client";

import { useEffect, useState } from "react";

export interface StoreSettings {
  retailFreeDeliveryThreshold: number;
  retailDeliveryCharge: number;
  wholesaleMinOrderValue: number;
}

const DEFAULTS: StoreSettings = {
  retailFreeDeliveryThreshold: 500,
  retailDeliveryCharge: 40,
  wholesaleMinOrderValue: 1499,
};

/** Fetches public store settings (delivery + min order) for checkout. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) setSettings(j.data);
      })
      .catch(() => {});
  }, []);
  return settings;
}
