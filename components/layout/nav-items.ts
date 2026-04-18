import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  LucideIcon,
  Receipt,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

import type { UserRole } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    roles: ["owner", "admin"],
    primary: true,
  },
  { href: "/pos", label: "POS", icon: ShoppingCart, roles: ["owner", "admin", "cashier"], primary: true },
  { href: "/products", label: "Products", icon: Tag, roles: ["owner", "admin"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["owner", "admin"], primary: true },
  { href: "/inventory/reconcile", label: "Reconcile", icon: ClipboardCheck, roles: ["owner", "admin"] },
  { href: "/transactions", label: "Transactions", icon: Receipt, roles: ["owner", "admin"], primary: true },
  { href: "/expenses", label: "Expenses", icon: Wallet, roles: ["owner", "admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["owner"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] },
];

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}

export function bottomNavForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role) && i.primary);
}
