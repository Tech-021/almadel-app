import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Product, ProductDraft, StockAdjustmentDraft } from "@/types/inventory";

function toNumber(value: string, field: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be a valid positive number.`);
  }

  return number;
}

export function useProducts(autoLoad = true) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, barcode, name, price, stock")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setProducts(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchProducts();
    }
  }, [autoLoad, fetchProducts]);

  const findByBarcode = useCallback(
    (barcode: string) => products.find((product) => product.barcode === barcode.trim()),
    [products]
  );

  const addProduct = useCallback(
    async (draft: ProductDraft) => {
      const barcode = draft.barcode.trim();
      const name = draft.name.trim();

      if (!barcode || !name) {
        throw new Error("Barcode and product name are required.");
      }

      const price = toNumber(draft.price, "Price");
      const stock = toNumber(draft.stock, "Opening stock");

      const { error } = await supabase.from("products").insert({
        barcode,
        name,
        price,
        stock,
      });

      if (error) {
        throw new Error(error.message);
      }

      await fetchProducts();
    },
    [fetchProducts]
  );

  const addStock = useCallback(
    async ({ barcode, quantity, note }: StockAdjustmentDraft) => {
      const cleanBarcode = barcode.trim();
      const amount = toNumber(quantity, "Quantity");
      const product = products.find((item) => item.barcode === cleanBarcode);

      if (!product) {
        throw new Error("Product not found for this barcode.");
      }

      if (amount <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      const nextStock = product.stock + amount;

      const { error } = await supabase
        .from("products")
        .update({ stock: nextStock })
        .eq("barcode", cleanBarcode);

      if (error) {
        throw new Error(error.message);
      }

      const { error: logError } = await supabase.from("stock_logs").insert({
        product_id: product.id,
        barcode: product.barcode,
        quantity: amount,
        previous_stock: product.stock,
        new_stock: nextStock,
        note: note.trim() || "Stock added",
        user_id: user?.id,
      });

      if (logError) {
        console.log("Stock log skipped:", logError);
      }

      await fetchProducts();
    },
    [fetchProducts, products, user?.id]
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 5),
    [products]
  );

  return {
    addProduct,
    addStock,
    fetchProducts,
    findByBarcode,
    loading,
    lowStockProducts,
    products,
  };
}
