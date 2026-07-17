import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AdminInput } from "@/components/admin/admin-input";
import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { BarcodeScannerCard } from "@/components/admin/barcode-scanner-card";
import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProducts } from "@/hooks/use-products";
import type { ProductDraft } from "@/types/inventory";

const emptyDraft: ProductDraft = {
  barcode: "",
  name: "",
  price: "",
  stock: "",
};

export default function AddProductScreen() {
  const { addProduct, findByBarcodeLive, loading } = useProducts();
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [formVisible, setFormVisible] = useState(false);
  const [scannerResetKey, setScannerResetKey] = useState(0);
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  const updateDraft = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleScan = async (barcode: string) => {
    try {
      const existingProduct = await findByBarcodeLive(barcode);

      if (existingProduct) {
        Alert.alert("Product already exists", `${existingProduct.name} is already in products.`);
        return;
      }

      setDraft({ ...emptyDraft, barcode });
      setFormVisible(true);
    } catch (error) {
      Alert.alert("Lookup failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const resetForNextScan = () => {
    setDraft(emptyDraft);
    setFormVisible(false);
    setScannerResetKey((key) => key + 1);
  };

  const submit = async () => {
    try {
      await addProduct(draft);
      resetForNextScan();
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
      <BarcodeScannerCard
        active={!formVisible}
        helper="Keep the barcode inside the frame. You can also enter it manually."
        manualPlaceholder="Type barcode"
        onScanned={handleScan}
        resetKey={scannerResetKey}
        title="Scan product barcode"
      />

      {formVisible && (
        <View style={[styles.formPanel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.formHeader}>
            <View>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Product details</Text>
              <Text style={[styles.panelSubtitle, { color: palette.muted }]}>Fill product details for barcode {draft.barcode}.</Text>
            </View>

            <Pressable style={[styles.rescanButton, { backgroundColor: palette.mutedSoft, borderColor: palette.border }]} onPress={resetForNextScan}>
              <Text style={[styles.rescanButtonText, { color: palette.text }]}>Scan another</Text>
            </Pressable>
          </View>

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
    elevation: 3,
  },
  panelTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  panelSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  formHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rescanButton: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  rescanButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
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
