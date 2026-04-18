import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats `amount` with the business currency symbol. */
export function formatMoney(amount: number, symbol = "₱"): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${symbol}${abs.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats a number to N decimals without currency. */
export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
