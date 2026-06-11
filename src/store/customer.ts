"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lightweight "remember me" profile saved on the customer's own device
 * (localStorage). No login/authentication — it simply pre-fills the checkout
 * form so returning customers don't re-type their details every time.
 */
export interface CustomerProfile {
  name: string;
  mobile: string;
  shopName: string;
  address: string;
}

interface CustomerState {
  profile: CustomerProfile | null;
  saveProfile: (p: CustomerProfile) => void;
  clearProfile: () => void;
}

export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      profile: null,
      saveProfile: (p) => set({ profile: p }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: "gtc-customer" }
  )
);
