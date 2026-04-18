import type { Product, ProductCategory, ProductWithCategory } from "../types";
import { slugify } from "../utils";
import type { SB } from "./types";

export async function listProducts(
  sb: SB,
  businessId: string,
  opts?: { search?: string; categoryId?: string; activeOnly?: boolean },
): Promise<ProductWithCategory[]> {
  let q = sb
    .from("products")
    .select("*, product_categories(id, name)")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (opts?.activeOnly) q = q.eq("is_active", true);
  if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts?.search && opts.search.trim().length > 0) {
    q = q.or(`name.ilike.%${opts.search}%,sku.ilike.%${opts.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithCategory[];
}

export async function getProduct(sb: SB, id: string): Promise<Product | null> {
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProduct(
  sb: SB,
  businessId: string,
  input: {
    name: string;
    sku?: string;
    category_id?: string | null;
    unit?: string;
    price: number;
    cost: number;
    stock?: number;
    low_stock_threshold?: number;
  },
): Promise<Product> {
  const sku = input.sku?.trim() || autoSku(input.name);
  const { data, error } = await sb
    .from("products")
    .insert({
      business_id: businessId,
      name: input.name,
      sku,
      category_id: input.category_id ?? null,
      unit: input.unit ?? "pcs",
      price: input.price,
      cost: input.cost,
      stock: input.stock ?? 0,
      low_stock_threshold: input.low_stock_threshold ?? 5,
    })
    .select("*")
    .single();
  if (error) throw error;

  if ((input.stock ?? 0) > 0) {
    await sb.from("stock_movements").insert({
      business_id: businessId,
      product_id: data.id,
      delta: input.stock ?? 0,
      reason: "initial count",
      source_type: "initial",
    });
  }
  return data;
}

export async function updateProduct(
  sb: SB,
  productId: string,
  patch: Partial<Product>,
): Promise<Product> {
  const { data, error } = await sb
    .from("products")
    .update(patch)
    .eq("id", productId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(sb: SB, productId: string): Promise<void> {
  const { error } = await sb.from("products").update({ is_active: false }).eq("id", productId);
  if (error) throw error;
}

/** Product categories */
export async function listProductCategories(
  sb: SB,
  businessId: string,
): Promise<ProductCategory[]> {
  const { data, error } = await sb
    .from("product_categories")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createProductCategory(
  sb: SB,
  businessId: string,
  name: string,
): Promise<ProductCategory> {
  const { data, error } = await sb
    .from("product_categories")
    .insert({ business_id: businessId, name })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductCategory(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("product_categories").delete().eq("id", id);
  if (error) throw error;
}

function autoSku(name: string): string {
  const base = slugify(name).slice(0, 10).toUpperCase().replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "SKU"}-${rand}`;
}
