import { create } from "zustand";

import {
  applyCartDiscount,
  cartGross,
  cartLineDiscountTotal,
  cartNet,
  computeChange,
  type CartDiscount,
} from "@/lib/business-logic/cart";
import type { CartItem, PaymentMethod } from "@/lib/types";

type State = {
  items: CartItem[];
  discount: CartDiscount;
  paymentMethod: PaymentMethod;
  amountTendered: number | null;
  externalRef: string;
  destinationAccount: string;
  notes: string;
};

type Actions = {
  add: (item: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  setLineDiscount: (productId: string, amount: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setDiscount: (d: CartDiscount) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setTendered: (n: number | null) => void;
  setExternalRef: (s: string) => void;
  setDestinationAccount: (s: string) => void;
  setNotes: (s: string) => void;
};

type Derived = {
  gross: () => number;
  net: () => number;
  change: () => number | null;
  cartDiscountApplied: () => number;
  lineDiscountTotal: () => number;
};

const initial: State = {
  items: [],
  discount: { type: "amount", value: 0 },
  paymentMethod: "cash",
  amountTendered: null,
  externalRef: "",
  destinationAccount: "",
  notes: "",
};

export const useCart = create<State & Actions & Derived>((set, get) => ({
  ...initial,

  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.product_id === item.product_id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock_on_hand) }
              : i,
          ),
        };
      }
      return { items: [...s.items, item] };
    }),

  updateQty: (id, qty) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product_id === id ? { ...i, quantity: Math.max(0, qty) } : i,
      ).filter((i) => i.quantity > 0),
    })),

  setLineDiscount: (id, amount) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product_id === id ? { ...i, line_discount: Math.max(0, amount) } : i,
      ),
    })),

  remove: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.product_id !== id) })),

  clear: () => set({ ...initial }),

  setDiscount: (d) => set({ discount: d }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setTendered: (n) => set({ amountTendered: n }),
  setExternalRef: (s) => set({ externalRef: s }),
  setDestinationAccount: (s) => set({ destinationAccount: s }),
  setNotes: (s) => set({ notes: s }),

  gross: () => cartGross(get().items),
  lineDiscountTotal: () => cartLineDiscountTotal(get().items),
  net: () => cartNet(get().items, get().discount),
  cartDiscountApplied: () => {
    const { items, discount } = get();
    const gross = cartGross(items);
    const lineDisc = cartLineDiscountTotal(items);
    return applyCartDiscount(gross - lineDisc, discount);
  },
  change: () => computeChange(cartNet(get().items, get().discount), get().amountTendered),
}));
