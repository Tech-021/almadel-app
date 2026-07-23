import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { Product, ProductDraft, StockAdjustmentDraft } from "@/types/inventory";

export function useProducts(autoLoad = true) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    try {
      const data = await api.getProducts(token, forceRefresh);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (autoLoad) {
      fetchProducts();
    }
  }, [autoLoad, fetchProducts]);

  const productsByBarcode = useMemo(() => {
    return new Map(products.map((product) => [product.barcode, product]));
  }, [products]);

  const findByBarcode = useCallback(
    (barcode: string) => productsByBarcode.get(barcode.trim()),
    [productsByBarcode]
  );

  const findByBarcodeLive = useCallback(
    async (barcode: string) => {
      return api.getProductByBarcode(barcode.trim(), token);
    },
    [token]
  );

  const addProduct = useCallback(
    async (draft: ProductDraft) => {
      await api.addProduct(draft, token);
      await fetchProducts(true);
    },
    [fetchProducts, token]
  );

  const addStock = useCallback(
    async (draft: StockAdjustmentDraft) => {
      await api.addStock(draft, token);
      await fetchProducts(true);
    },
    [fetchProducts, token]
  );

  const deleteProduct = useCallback(
    async (productId: number) => {
      await api.deleteProduct(productId, token);
      await fetchProducts(true);
    },
    [fetchProducts, token]
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 5),
    [products]
  );

  return {
    addProduct,
    addStock,
    deleteProduct,
    fetchProducts,
    findByBarcode,
    findByBarcodeLive,
    loading,
    lowStockProducts,
    products,
  };
}
