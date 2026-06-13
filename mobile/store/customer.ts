import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

/** "Remember me" profile saved on the device so returning customers don't
 *  re-type their details. No login. */
export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      profile: null,
      saveProfile: (p) => set({ profile: p }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: "gtc-customer", storage: createJSONStorage(() => AsyncStorage) }
  )
);
