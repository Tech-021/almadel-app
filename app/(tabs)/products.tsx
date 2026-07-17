import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProducts } from "@/hooks/use-products";
import type { Product } from "@/types/inventory";

export default function ProductsScreen() {
  const { deleteProduct, fetchProducts, loading, products } = useProducts();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  const confirmDelete = (product: Product) => {
    Alert.alert(
      "Delete product",
      `Delete ${product.name}? This cannot be undone if the product has no sale history.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (error) {
              Alert.alert(
                "Could not delete product",
                error instanceof Error ? error.message : "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <AdminScreenShell
      eyebrow="Admin"
      onRefresh={fetchProducts}
      refreshing={loading}
      subtitle="All available products, prices, barcodes, and current stock."
      title="Products"
    >
      <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No products found.</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={[styles.productRow, { borderBottomColor: palette.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: palette.text }]}>{product.name}</Text>
                <Text style={[styles.productMeta, { color: palette.muted }]}>Barcode: {product.barcode}</Text>
                <Text style={[styles.productMeta, { color: palette.muted }]}>Rs {product.price}</Text>
              </View>

              <View style={[styles.stockBadge, product.stock <= 5 && styles.lowStockBadge]}>
                <Text style={[styles.stockText, product.stock <= 5 && styles.lowStockText]}>
                  {product.stock}
                </Text>
              </View>

              <Pressable style={styles.deleteButton} onPress={() => confirmDelete(product)}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </Pressable>
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
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  lowStockText: {
    color: "#DC2626",
  },
});
