import { StyleSheet, Text, View } from "react-native";

import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { useProducts } from "@/hooks/use-products";

export default function ProductsScreen() {
  const { fetchProducts, loading, products } = useProducts();

  return (
    <AdminScreenShell
      eyebrow="Admin"
      onRefresh={fetchProducts}
      refreshing={loading}
      subtitle="All available products, prices, barcodes, and current stock."
      title="Products"
    >
      <View style={styles.panel}>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No products found.</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>Barcode: {product.barcode}</Text>
                <Text style={styles.productMeta}>Rs {product.price}</Text>
              </View>

              <View style={[styles.stockBadge, product.stock <= 5 && styles.lowStockBadge]}>
                <Text style={[styles.stockText, product.stock <= 5 && styles.lowStockText]}>
                  {product.stock}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    padding: 16,
  },
  productRow: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  productMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  stockBadge: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 56,
  },
  lowStockBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  stockText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "900",
  },
  lowStockText: {
    color: "#DC2626",
  },
});
