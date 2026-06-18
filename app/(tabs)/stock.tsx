import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AdminInput } from "@/components/admin/admin-input";
import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { BarcodeScannerCard } from "@/components/admin/barcode-scanner-card";
import { useProducts } from "@/hooks/use-products";
import type { Product, StockAdjustmentDraft } from "@/types/inventory";

const emptyDraft: StockAdjustmentDraft = {
  barcode: "",
  quantity: "1",
  note: "",
};

export default function StockScreen() {
  const { addStock, findByBarcode, loading } = useProducts();
  const [draft, setDraft] = useState<StockAdjustmentDraft>(emptyDraft);
  const [product, setProduct] = useState<Product | null>(null);

  const updateDraft = (key: keyof StockAdjustmentDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleScan = (barcode: string) => {
    const foundProduct = findByBarcode(barcode);
    setDraft((current) => ({ ...current, barcode }));
    setProduct(foundProduct ?? null);

    if (!foundProduct) {
      Alert.alert("Product not found", "Add this product first before adding stock.");
    }
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
        <View style={styles.productPanel}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productMeta}>Current stock: {product.stock}</Text>
          <Text style={styles.productMeta}>Barcode: {product.barcode}</Text>
        </View>
      )}

      <View style={styles.formPanel}>
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
});
