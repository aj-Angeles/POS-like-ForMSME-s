import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Business, UserRole } from "@/lib/types";

type SessionState = {
  userId: string | null;
  email: string | null;
  business: Business | null;
  role: UserRole | null;
  availableBusinesses: Business[];
  setSession: (s: Partial<SessionState>) => void;
  switchBusiness: (business: Business, role: UserRole) => void;
  clear: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      business: null,
      role: null,
      availableBusinesses: [],
      setSession: (s) => set(s),
      switchBusiness: (business, role) => set({ business, role }),
      clear: () =>
        set({ userId: null, email: null, business: null, role: null, availableBusinesses: [] }),
    }),
    { name: "msme-pos-session" },
  ),
);
