import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Product, SaleRecord } from "@/types/inventory";

export function useSalesDashboard() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [salesLogAvailable, setSalesLogAvailable] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [{ data: productData, error: productError }, { data: salesData, error: salesError }] =
        await Promise.all([
          supabase.from("products").select("id, barcode, name, price, stock"),
          supabase
            .from("sales")
            .select("id, total_amount, total_items, created_at")
            .order("created_at", { ascending: false })
            .limit(25),
        ]);

      if (productError) {
        throw new Error(productError.message);
      }

      setProducts(productData ?? []);

      if (salesError) {
        console.log("Sales dashboard log unavailable:", salesError);
        setSales([]);
        setSalesLogAvailable(false);
      } else {
        setSales(salesData ?? []);
        setSalesLogAvailable(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount ?? 0), 0);
    const totalItemsSold = sales.reduce((sum, sale) => sum + (sale.total_items ?? 0), 0);
    const stockValue = products.reduce(
      (sum, product) => sum + product.price * product.stock,
      0
    );
    const lowStockCount = products.filter((product) => product.stock <= 5).length;

    return {
      lowStockCount,
      stockValue,
      totalItemsSold,
      totalProducts: products.length,
      totalSales,
      totalSalesCount: sales.length,
    };
  }, [products, sales]);

  return {
    fetchDashboard,
    loading,
    metrics,
    products,
    sales,
    salesLogAvailable,
  };
}
