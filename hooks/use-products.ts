"use client";

import { useCallback } from "react";

import { productService } from "@/lib/services";
import type { Product, ProductCategory, ProductWithCategory } from "@/lib/types";

import { useAsync } from "./use-async";
import { useSession } from "@/stores/session-store";
import { useSupabase } from "./use-supabase";

export function useProducts(opts?: { search?: string; categoryId?: string; activeOnly?: boolean }) {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useAsync<ProductWithCategory[]>(async () => {
    if (!businessId) return [];
    return productService.listProducts(sb, businessId, opts);
  }, [businessId, opts?.search, opts?.categoryId, opts?.activeOnly]);
}

export function useProductCategories() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useAsync<ProductCategory[]>(async () => {
    if (!businessId) return [];
    return productService.listProductCategories(sb, businessId);
  }, [businessId]);
}

export function useProductMutations() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  const create = useCallback(
    async (input: Parameters<typeof productService.createProduct>[2]) => {
      if (!businessId) throw new Error("No active business");
      return productService.createProduct(sb, businessId, input);
    },
    [sb, businessId],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Product>) => productService.updateProduct(sb, id, patch),
    [sb],
  );

  const remove = useCallback(
    async (id: string) => productService.deleteProduct(sb, id),
    [sb],
  );

  const createCategory = useCallback(
    async (name: string) => {
      if (!businessId) throw new Error("No active business");
      return productService.createProductCategory(sb, businessId, name);
    },
    [sb, businessId],
  );

  const deleteCategory = useCallback(
    async (id: string) => productService.deleteProductCategory(sb, id),
    [sb],
  );

  return { create, update, remove, createCategory, deleteCategory };
}
