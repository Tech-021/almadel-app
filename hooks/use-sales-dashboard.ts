import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { Product, SaleRecord } from "@/types/inventory";

export function useSalesDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    try {
      const data = await api.getDashboard(token, forceRefresh);
      setProducts(data.products);
      setSales(data.sales);
    } catch (error) {
      console.log("Fetch dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = useMemo(() => {
    const totalSales = sales.reduce(
      (sum, sale) => sum + (sale.total_amount ?? 0),
      0,
    );
    const totalItemsSold = sales.reduce(
      (sum, sale) => sum + (sale.total_items ?? 0),
      0,
    );
    const stockValue = products.reduce(
      (sum, product) => sum + product.price * product.stock,
      0,
    );
    const lowStockCount = products.filter(
      (product) => product.stock <= 5,
    ).length;

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
    salesLogAvailable: true,
  };
}
