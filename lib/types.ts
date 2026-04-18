/**
 * Domain types. Derived from the generated Supabase types so column changes
 * propagate automatically.
 */
import type { Database } from "./supabase/database.types";

type T = Database["public"]["Tables"];

export type Business = T["businesses"]["Row"];
export type Membership = T["memberships"]["Row"];
export type Product = T["products"]["Row"];
export type ProductCategory = T["product_categories"]["Row"];
export type Expense = T["expenses"]["Row"];
export type ExpenseCategory = T["expense_categories"]["Row"];
export type Transaction = T["transactions"]["Row"];
export type TransactionItem = T["transaction_items"]["Row"];
export type StockMovement = T["stock_movements"]["Row"];
export type ReconciliationSnapshot = T["reconciliation_snapshots"]["Row"];
export type ReconciliationItem = T["reconciliation_items"]["Row"];
export type UserInvite = T["user_invites"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type MovementSource = Database["public"]["Enums"]["movement_source"];

export type BusinessTheme = {
  primary: string; // "H S% L%"
  accent: string; //  "H S% L%"
  radius: string; // e.g. "0.6rem"
};

export type CartItem = {
  product_id: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_discount: number;
  stock_on_hand: number;
};

export type TransactionWithItems = Transaction & {
  transaction_items: TransactionItem[];
  cashier_name?: string | null;
};

export type ProductWithCategory = Product & {
  product_categories?: Pick<ProductCategory, "id" | "name"> | null;
};

export type ExpenseWithCategory = Expense & {
  expense_categories?: Pick<ExpenseCategory, "id" | "name"> | null;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export type Period = "today" | "week" | "month" | "custom";

export type DashboardSummary = {
  gross_sales: number;
  expenses_total: number;
  net_income: number;
  transaction_count: number;
  average_order_value: number;
};

export type PaymentMethodBreakdown = {
  method: PaymentMethod;
  total: number;
  count: number;
};

export type TopProduct = {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type SeriesPoint = {
  date: string; // ISO yyyy-mm-dd
  gross: number;
  expenses: number;
  net: number;
  cogs: number;
  gross_profit: number;
};
