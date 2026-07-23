import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScanFeedback } from "@/hooks/use-scan-feedback";
import { InventoryTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { WelcomeBackButton } from "@/components/navigation/welcome-back-button";
import { useToast } from "@/components/ui/toaster";

type Product = {
  id: number;
  barcode: string;
  name: string;
  price: number;
  stock: number;
};

type Mode = "sale" | "receive";

const SCAN_COOLDOWN_MS = 1800;

export default function HomeScreen() {
  return <StaffInventoryScreen fixedMode="sale" />;
}

type StaffInventoryScreenProps = {
  fixedMode: Mode;
};

export function StaffInventoryScreen({ fixedMode }: StaffInventoryScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  const [mode] = useState<Mode>(fixedMode);
  const [canScan, setCanScan] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("Scan a barcode to start.");

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingStock, setSavingStock] = useState(false);

  const scanLockRef = useRef(false);
  const lastScanRef = useRef<{ barcode: string; time: number } | null>(null);

  const { playScanFeedback } = useScanFeedback();
  const { toast } = useToast();
  const scannerReady = Boolean(scannerOpen && canScan && !savingStock);
  const productsByBarcode = useMemo(() => {
    return new Map(products.map((product) => [product.barcode, product]));
  }, [products]);

  useFocusEffect(
    useCallback(() => {
      scanLockRef.current = false;
      lastScanRef.current = null;
      setCanScan(true);

      return () => {
        scanLockRef.current = true;
        setScannerOpen(false);
      };
    }, [])
  );

  const showToast = useCallback(
    (
      toastMessage: string,
      type: "error" | "info" | "success" | "warning" = "info",
    ) => {
      toast[type](toastMessage);
    },
    [toast],
  );

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    setLoadingProducts(true);

    try {
      const data = await api.getProducts(token, forceRefresh);
      setProducts(data);
    } catch (error) {
      console.log("Fetch products error:", error);
      setMessage("Could not load products from database.");
      showToast("Could not load products.", "error");
    } finally {
      setLoadingProducts(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([barcode, quantity]) => {
        const product = productsByBarcode.get(barcode);

        if (!product) return null;

        return {
          ...product,
          quantity,
          total: product.price * quantity,
        };
      })
      .filter(Boolean) as (Product & { quantity: number; total: number })[];
  }, [cart, productsByBarcode]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  const totalCartQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalStockQuantity = useMemo(() => {
    return products.reduce((sum, item) => sum + item.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((item) => item.stock <= 5).length;
  }, [products]);

  const releaseScanner = useCallback(() => {
    setTimeout(() => {
      scanLockRef.current = false;
      setCanScan(true);
    }, SCAN_COOLDOWN_MS);
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    const barcode = data.trim();
    const now = Date.now();

    if (!barcode) return;

    if (scanLockRef.current || savingStock) return;

    const lastScan = lastScanRef.current;

    if (
      lastScan &&
      lastScan.barcode === barcode &&
      now - lastScan.time < SCAN_COOLDOWN_MS
    ) {
      return;
    }

    scanLockRef.current = true;
    lastScanRef.current = {
      barcode,
      time: now,
    };

    setCanScan(false);
    playScanFeedback();

    const product = productsByBarcode.get(barcode);

    try {
      if (!product) {
        const text = `Product not found: ${barcode}`;
        setMessage(text);
        showToast("Product not found.", "error");
        return;
      }

      if (mode === "receive") {
        setSavingStock(true);

        try {
          await api.receiveOneStock(barcode, token);
        } catch (error) {
          console.log("Receive stock error:", error);
          const text = `Could not update stock for ${product.name}.`;
          setMessage(text);
          showToast(text, "error");
          return;
        }
        const text = `${product.name} stock increased by 1.`;
        setMessage(text);
        showToast(text, "success");

        await fetchProducts(true);
        return;
      }

      const alreadyInCart = cart[barcode] || 0;

      if (alreadyInCart >= product.stock) {
        const text = `No more stock available for ${product.name}.`;
        setMessage(text);
        showToast(text, "warning");
        return;
      }

      setCart((prevCart) => ({
        ...prevCart,
        [barcode]: (prevCart[barcode] || 0) + 1,
      }));
      const text = `${product.name} added to cart.`;
      setMessage(text);
      showToast(text, "success");
    } finally {
      setSavingStock(false);
      releaseScanner();
    }
  };

  const processCheckout = async () => {
    setSavingStock(true);
    setMessage("Saving sale...");

    try {
      await api.checkout(cartItems, token);

      setCart({});

      const text = `Sale completed. Total: Rs ${totalPrice}`;
      setMessage(text);
      showToast("Sale completed successfully.", "success");

      await fetchProducts(true);
    } finally {
      setSavingStock(false);
    }
  };

  const checkout = () => {
    if (cartItems.length === 0) {
      setMessage("Cart is empty.");
      showToast("Cart is empty.", "warning");
      return;
    }

    Alert.alert(
      "Complete Sale",
      `Total items: ${totalCartQuantity}\nTotal amount: Rs ${totalPrice}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete Sale",
          onPress: processCheckout,
        },
      ]
    );
  };

  const clearCart = () => {
    if (cartItems.length === 0) {
      showToast("Cart is already empty.", "info");
      return;
    }

    Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setCart({});
          setMessage("Cart cleared.");
          showToast("Cart cleared.", "info");
        },
      },
    ]);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        setMessage("Camera permission is required to scan products.");
        showToast("Camera permission is required.", "warning");
        return;
      }
    }

    scanLockRef.current = false;
    lastScanRef.current = null;
    setCanScan(true);
    setScannerOpen(true);
  };

  const closeScanner = () => {
    scanLockRef.current = true;
    setScannerOpen(false);
    setCanScan(true);
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.loadingText, { color: palette.text }]}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <Modal
        animationType="slide"
        onRequestClose={closeScanner}
        transparent
        visible={scannerOpen}
      >
        <View style={styles.scannerSheetBackdrop}>
          <Pressable style={styles.scannerSheetDismissArea} onPress={closeScanner} />

          <View style={styles.scannerSheet}>
            <View style={styles.scannerSheetHeader}>
              <View>
                <Text style={styles.scannerSheetTitle}>
                  {mode === "sale" ? "Sale Scanner" : "Receive Scanner"}
                </Text>
                <Text style={styles.scannerSheetSubtitle}>Keep barcode inside the frame.</Text>
              </View>

              <Pressable style={styles.scannerSheetCloseButton} onPress={closeScanner}>
                <Text style={styles.scannerSheetCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.scannerSheetCameraWrap}>
              <CameraView
                style={styles.scannerSheetCamera}
                facing="back"
                onBarcodeScanned={scannerReady ? handleBarcodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "code128",
                  ],
                }}
              />

              <View style={styles.scannerModalOverlay} />

              <View style={styles.scannerSheetFrame}>
                <View style={styles.scanCornerTopLeft} />
                <View style={styles.scanCornerTopRight} />
                <View style={styles.scanCornerBottomLeft} />
                <View style={styles.scanCornerBottomRight} />
                <View style={styles.scanLine} />
              </View>
            </View>

            <View style={styles.scannerSheetStatus}>
              <View
                style={[
                  styles.statusDot,
                  canScan && !savingStock ? styles.statusDotReady : styles.statusDotBusy,
                ]}
              />
              <Text style={styles.scannerSheetStatusText}>
                {savingStock ? "Saving..." : canScan ? "Ready to scan" : "Processing scan..."}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.container}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={loadingProducts}
            onRefresh={() => fetchProducts(true)}
          />
        }
      >
        <WelcomeBackButton />

        <Text style={[styles.pageTitle, { color: palette.text }]}>
          {mode === "sale" ? "Sale Mode" : "Receive Stock"}
        </Text>

        <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
          {mode === "sale"
            ? "Scan products, build the cart, and complete the sale."
            : "Scan existing products to increase stock by one."}
        </Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.statLabel, { color: palette.muted }]}>Products</Text>
            <Text style={[styles.statValue, { color: palette.text }]}>{products.length}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              {mode === "sale" ? "Cart Items" : "Total Stock"}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {mode === "sale" ? totalCartQuantity : totalStockQuantity}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              {mode === "sale" ? "Total" : "Low Stock"}
            </Text>
            <Text style={styles.statValueSmall}>
              {mode === "sale" ? `Rs ${totalPrice}` : lowStockCount}
            </Text>
          </View>
        </View>

        <View style={[styles.scannerLaunchCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.scannerLaunchIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="scan" size={24} color={palette.accent} />
          </View>

          <View style={styles.scannerLaunchContent}>
            <Text style={[styles.scannerLaunchTitle, { color: palette.text }]}>
              {mode === "sale" ? "Ready for sale scan" : "Ready for stock scan"}
            </Text>
            <Text style={[styles.scannerLaunchText, { color: palette.muted }]}>
              Open the scanner when you are ready to scan a product barcode.
            </Text>
          </View>

          <Pressable style={[styles.openScannerButton, { backgroundColor: palette.accent }]} onPress={openScanner}>
            <Text style={styles.openScannerButtonText}>
              {permission.granted ? "Open Scanner" : "Allow Camera"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.messageBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.messageText, { color: palette.text }]}>{message}</Text>
        </View>

        {mode === "sale" && (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Cart</Text>

          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in cart.</Text>
          ) : (
            cartItems.map((item) => (
              <View key={item.barcode} style={styles.cartRow}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: palette.text }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: palette.muted }]}>
                    Rs {item.price} x {item.quantity}
                  </Text>
                </View>

                <Text style={[styles.itemTotal, { color: palette.text }]}>Rs {item.total}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: palette.text }]}>Total</Text>
            <Text style={styles.totalValue}>Rs {totalPrice}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.checkoutButton,
                savingStock && styles.disabledButton,
              ]}
              onPress={checkout}
              disabled={savingStock}
            >
              <Text style={styles.checkoutButtonText}>
                {savingStock ? "Saving..." : "Checkout"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.clearButton, savingStock && styles.disabledLightButton]}
              onPress={clearCart}
              disabled={savingStock}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          </View>
        </View>
        )}

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Inventory</Text>

          {loadingProducts ? (
            <Text style={styles.emptyText}>Loading products...</Text>
          ) : products.length === 0 ? (
            <Text style={styles.emptyText}>No products found in database.</Text>
          ) : (
            products.map((product) => (
              <View key={product.barcode} style={styles.inventoryRow}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: palette.text }]}>{product.name}</Text>
                  <Text style={[styles.itemMeta, { color: palette.muted }]}>Barcode: {product.barcode}</Text>
                  <Text style={[styles.itemMeta, { color: palette.muted }]}>Price: Rs {product.price}</Text>
                </View>

                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>{product.stock}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF2F7",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF2F7",
  },

  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: "#EEF2F7",
  },

  permissionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0,
  },

  permissionText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 6,
    letterSpacing: 0,
  },

  pageSubtitle: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 18,
    lineHeight: 22,
    fontWeight: "500",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  statValueSmall: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },

  modeBox: {
    flexDirection: "row",
    backgroundColor: "#DDE5F0",
    borderRadius: 18,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  modeButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  activeMode: {
    backgroundColor: "#0F172A",
  },

  modeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },

  activeModeText: {
    color: "#FFFFFF",
  },

  cameraCard: {
    height: 305,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#020617",
    marginBottom: 16,
    position: "relative",
  },

  scannerLaunchCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },

  scannerLaunchIcon: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46,
  },

  scannerLaunchIconText: {
    color: "#0F766E",
    fontSize: 16,
    fontWeight: "900",
  },

  scannerLaunchContent: {
    flex: 1,
  },

  scannerLaunchTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },

  scannerLaunchText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },

  openScannerButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },

  openScannerButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  scannerSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    justifyContent: "flex-end",
  },

  scannerSheetDismissArea: {
    flex: 1,
  },

  scannerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  scannerSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  scannerSheetTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  scannerSheetSubtitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  scannerSheetCloseButton: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  scannerSheetCloseText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },

  scannerSheetCameraWrap: {
    height: 310,
    backgroundColor: "#020617",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },

  scannerSheetCamera: {
    flex: 1,
  },

  scannerModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.12)",
  },

  scannerSheetFrame: {
    position: "absolute",
    top: 70,
    left: 34,
    right: 34,
    height: 150,
    borderRadius: 24,
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },

  scannerSheetStatus: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  scannerSheetStatusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.12)",
  },

  closeScannerButton: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 4,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  closeScannerButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  scanFrame: {
    position: "absolute",
    top: 66,
    left: 38,
    right: 38,
    height: 150,
    borderRadius: 24,
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },

  scanCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 24,
  },

  scanCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 24,
  },

  scanCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
  },

  scanCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 24,
  },

  scanLine: {
    height: 4,
    backgroundColor: "#22C55E",
    marginHorizontal: 20,
    borderRadius: 99,
  },

  scanStatusPill: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },

  statusDotReady: {
    backgroundColor: "#22C55E",
  },

  statusDotBusy: {
    backgroundColor: "#F59E0B",
  },

  scanStatusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  messageBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  messageText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
    letterSpacing: 0,
  },

  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 12,
    fontWeight: "600",
  },

  cartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },

  inventoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },

  itemContent: {
    flex: 1,
  },

  itemName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
    letterSpacing: 0,
  },

  itemMeta: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 19,
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 0,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  checkoutButton: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  clearButton: {
    width: 92,
    backgroundColor: "#FFF1F2",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },

  clearButtonText: {
    color: "#E11D48",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },

  disabledLightButton: {
    opacity: 0.6,
  },

  stockBadge: {
    minWidth: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  stockText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2563EB",
  },

  primaryButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

});
