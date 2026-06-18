import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AdminInput } from "@/components/admin/admin-input";
import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { BarcodeScannerCard } from "@/components/admin/barcode-scanner-card";
import { useProducts } from "@/hooks/use-products";
import type { ProductDraft } from "@/types/inventory";

const emptyDraft: ProductDraft = {
  barcode: "",
  name: "",
  price: "",
  stock: "",
};

export default function AddProductScreen() {
  const { addProduct, findByBarcode, loading } = useProducts();
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [formVisible, setFormVisible] = useState(false);

  const updateDraft = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleScan = (barcode: string) => {
    const existingProduct = findByBarcode(barcode);

    setDraft({ ...emptyDraft, barcode });
    setFormVisible(true);

    if (existingProduct) {
      Alert.alert("Product already exists", `${existingProduct.name} is already in products.`);
    }
  };

  const submit = async () => {
    try {
      await addProduct(draft);
      setDraft(emptyDraft);
      setFormVisible(false);
      Alert.alert("Product added", "The form is clear and ready for the next scan.");
    } catch (error) {
      Alert.alert("Could not add product", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AdminScreenShell
      eyebrow="Admin"
      subtitle="Scan a new barcode first, then complete the product form."
      title="Add Product"
    >
      <BarcodeScannerCard active={!formVisible} onScanned={handleScan} title="Scan product barcode" />

      {formVisible && (
        <View style={styles.formPanel}>
          <Text style={styles.panelTitle}>Product details</Text>

          <AdminInput label="Barcode" onChangeText={(value) => updateDraft("barcode", value)} value={draft.barcode} />
          <AdminInput label="Product name" onChangeText={(value) => updateDraft("name", value)} placeholder="Enter product name" value={draft.name} />
          <AdminInput keyboardType="numeric" label="Price" onChangeText={(value) => updateDraft("price", value)} placeholder="0" value={draft.price} />
          <AdminInput keyboardType="numeric" label="Opening stock" onChangeText={(value) => updateDraft("stock", value)} placeholder="0" value={draft.stock} />

          <Pressable style={[styles.submitButton, loading && styles.disabledButton]} disabled={loading} onPress={submit}>
            <Text style={styles.submitText}>{loading ? "Saving..." : "Add product"}</Text>
          </Pressable>
        </View>
      )}
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
  panelTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
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
