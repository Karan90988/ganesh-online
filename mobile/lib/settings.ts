import { useEffect, useState } from "react";
import { apiGet } from "./api";

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

/** Fetches public store settings (delivery + min order) for cart/checkout. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  useEffect(() => {
    apiGet<StoreSettings>("/api/settings")
      .then(setSettings)
      .catch(() => {});
  }, []);
  return settings;
}
