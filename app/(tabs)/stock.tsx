import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AdminInput } from "@/components/admin/admin-input";
import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { BarcodeScannerCard } from "@/components/admin/barcode-scanner-card";
import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProducts } from "@/hooks/use-products";
import type { Product, StockAdjustmentDraft } from "@/types/inventory";

const emptyDraft: StockAdjustmentDraft = {
  barcode: "",
  quantity: "1",
  note: "",
};

export default function StockScreen() {
  const { addStock, findByBarcodeLive, loading } = useProducts();
  const [draft, setDraft] = useState<StockAdjustmentDraft>(emptyDraft);
  const [product, setProduct] = useState<Product | null>(null);
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  const updateDraft = (key: keyof StockAdjustmentDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleScan = async (barcode: string) => {
    try {
      const foundProduct = await findByBarcodeLive(barcode);
      setDraft((current) => ({ ...current, barcode }));
      setProduct(foundProduct ?? null);

      if (!foundProduct) {
        Alert.alert("Product not found", "Add this product first before adding stock.");
      }
    } catch (error) {
      Alert.alert("Lookup failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const resetForNextScan = () => {
    setDraft(emptyDraft);
    setProduct(null);
  };

  const submit = async () => {
    try {
      await addStock(draft);
      Alert.alert("Stock updated", "The stock quantity has been added.");
      setDraft(emptyDraft);
      setProduct(null);
    } catch (error) {
      Alert.alert("Could not update stock", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AdminScreenShell
      eyebrow="Admin"
      subtitle="Scan an existing product and add received quantity to inventory."
      title="Add Stock"
    >
      <BarcodeScannerCard active={!product} onScanned={handleScan} title="Scan product to receive stock" />

      {product && (
        <View style={[styles.productPanel, { backgroundColor: palette.successSoft }]}>
          <View style={styles.productHeader}>
            <View style={styles.productContent}>
              <Text style={[styles.productName, { color: palette.text }]}>{product.name}</Text>
              <Text style={styles.productMeta}>Current stock: {product.stock}</Text>
              <Text style={styles.productMeta}>Barcode: {product.barcode}</Text>
            </View>

            <Pressable style={[styles.rescanButton, { backgroundColor: palette.card }]} onPress={resetForNextScan}>
              <Text style={styles.rescanButtonText}>Scan another</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.formPanel, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <AdminInput label="Barcode" onChangeText={(value) => updateDraft("barcode", value)} value={draft.barcode} />
        <AdminInput keyboardType="numeric" label="Quantity to add" onChangeText={(value) => updateDraft("quantity", value)} value={draft.quantity} />
        <AdminInput label="Note" onChangeText={(value) => updateDraft("note", value)} placeholder="Supplier, invoice, or reason" value={draft.note} />

        <Pressable style={[styles.submitButton, loading && styles.disabledButton]} disabled={loading} onPress={submit}>
          <Text style={styles.submitText}>{loading ? "Saving..." : "Add stock"}</Text>
        </Pressable>
      </View>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  formPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  productPanel: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  productContent: {
    flex: 1,
  },
  productName: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 5,
  },
  productMeta: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.7,
  },
  rescanButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#A7F3D0",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  rescanButtonText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
  },
});
