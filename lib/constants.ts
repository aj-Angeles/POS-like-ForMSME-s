import type { PaymentMethod, UserRole } from "./types";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; requiresExternal: boolean }[] =
  [
    { value: "cash", label: "Cash", requiresExternal: false },
    { value: "gcash", label: "GCash", requiresExternal: true },
    { value: "maya", label: "Maya", requiresExternal: true },
    { value: "bank_transfer", label: "Bank Transfer", requiresExternal: true },
    { value: "card", label: "Card", requiresExternal: true },
    { value: "other", label: "Other", requiresExternal: false },
  ];

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access. Can manage users, settings, and all reports.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage inventory, sales, expenses. Cannot manage users or settings.",
  },
  { value: "cashier", label: "Cashier", description: "POS screen only. Can process sales." },
];

export const UNITS = ["pcs", "kg", "g", "L", "mL", "box", "pack", "set", "dozen"];

export const INDUSTRIES = [
  "Retail",
  "Food & Beverage",
  "Services",
  "Health & Beauty",
  "Hardware",
  "Agriculture",
  "Other",
];

export const CURRENCIES = [
  { code: "PHP", symbol: "₱" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "JPY", symbol: "¥" },
  { code: "GBP", symbol: "£" },
  { code: "SGD", symbol: "S$" },
  { code: "IDR", symbol: "Rp" },
  { code: "MYR", symbol: "RM" },
  { code: "THB", symbol: "฿" },
  { code: "VND", symbol: "₫" },
];

export const DEFAULT_THEME = {
  primary: "172 66% 42%",
  accent: "172 66% 95%",
  radius: "0.6rem",
};
