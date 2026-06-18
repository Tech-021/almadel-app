import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Vibration,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
const scanSound = require("../../assets/sound/scanner-beep.mp3");
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  barcode: string;
  name: string;
  price: number;
  stock: number;
};

type Mode = "sale" | "receive";
type ToastType = "success" | "error" | "info" | "warning";

type ToastState = {
  message: string;
  type: ToastType;
};

const SCAN_COOLDOWN_MS = 1800;

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<Mode>("sale");
  const [canScan, setCanScan] = useState(true);
  const [message, setMessage] = useState("Scan a barcode to start.");

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingStock, setSavingStock] = useState(false);

  const scanLockRef = useRef(false);
  const lastScanRef = useRef<{ barcode: string; time: number } | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-18)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanPlayer = useAudioPlayer(scanSound);
  const showToast = useCallback(
    (toastMessage: string, type: ToastType = "info") => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToast({
        message: toastMessage,
        type,
      });

      toastOpacity.setValue(0);
      toastTranslateY.setValue(-18);

      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      toastTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslateY, {
            toValue: -18,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setToast(null);
          }
        });
      }, 2200);
    },
    [toastOpacity, toastTranslateY]
  );


  const playScanSound = useCallback(() => {
    try {
      scanPlayer.seekTo(0);
      scanPlayer.play();
      Vibration.vibrate(50);
    } catch (error) {
      console.log("Scan sound error:", error);
    }
  }, [scanPlayer]);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, barcode, name, price, stock")
      .order("name", { ascending: true });

    if (error) {
      console.log("Fetch products error:", error);
      setMessage("Could not load products from database.");
      showToast("Could not load products.", "error");
      setLoadingProducts(false);
      return;
    }

    setProducts(data || []);
    setLoadingProducts(false);
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([barcode, quantity]) => {
        const product = products.find((item) => item.barcode === barcode);

        if (!product) return null;

        return {
          ...product,
          quantity,
          total: product.price * quantity,
        };
      })
      .filter(Boolean) as Array<Product & { quantity: number; total: number }>;
  }, [cart, products]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  const totalCartQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

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

    const product = products.find((item) => item.barcode === barcode);

    try {
      if (!product) {
        const text = `Product not found: ${barcode}`;
        setMessage(text);
        showToast("Product not found.", "error");
        return;
      }

      if (mode === "receive") {
        setSavingStock(true);

        const newStock = product.stock + 1;

        const { error } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("barcode", barcode);

        if (error) {
          console.log("Receive stock error:", error);
          const text = `Could not update stock for ${product.name}.`;
          setMessage(text);
          showToast(text, "error");
          return;
        }
        playScanSound();
        const text = `${product.name} stock increased by 1.`;
        setMessage(text);
        showToast(text, "success");

        await fetchProducts();
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
      playScanSound();
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
      for (const item of cartItems) {
        const newStock = item.stock - item.quantity;

        if (newStock < 0) {
          const text = `Not enough stock for ${item.name}.`;
          setMessage(text);
          showToast(text, "error");
          setSavingStock(false);
          return;
        }

        const { error } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("barcode", item.barcode);

        if (error) {
          console.log("Checkout stock error:", error);
          const text = `Could not update stock for ${item.name}.`;
          setMessage(text);
          showToast(text, "error");
          setSavingStock(false);
          return;
        }
      }

      setCart({});

      const text = `Sale completed. Total: Rs ${totalPrice}`;
      setMessage(text);
      showToast("Sale completed successfully.", "success");

      await fetchProducts();
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

  const getToastIcon = (type: ToastType) => {
    if (type === "success") return "✓";
    if (type === "error") return "!";
    if (type === "warning") return "!";
    return "i";
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>

        <Text style={styles.permissionText}>
          This app needs camera access to scan product barcodes.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
            const result = await requestPermission();
            console.log("Camera permission result:", result);
          }}
        >
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.type === "success" && styles.toastSuccess,
            toast.type === "error" && styles.toastError,
            toast.type === "warning" && styles.toastWarning,
            toast.type === "info" && styles.toastInfo,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <View style={styles.toastIcon}>
            <Text style={styles.toastIconText}>{getToastIcon(toast.type)}</Text>
          </View>

          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loadingProducts} onRefresh={fetchProducts} />
        }
      >
        <Text style={styles.pageTitle}>Barcode Inventory System</Text>

        <Text style={styles.pageSubtitle}>
          Scan products, calculate price, and update stock.
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Products</Text>
            <Text style={styles.statValue}>{products.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cart Items</Text>
            <Text style={styles.statValue}>{totalCartQuantity}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValueSmall}>Rs {totalPrice}</Text>
          </View>
        </View>

        <View style={styles.modeBox}>
          <Pressable
            style={[styles.modeButton, mode === "sale" && styles.activeMode]}
            onPress={() => setMode("sale")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "sale" && styles.activeModeText,
              ]}
            >
              Sale Mode
            </Text>
          </Pressable>

          <Pressable
            style={[styles.modeButton, mode === "receive" && styles.activeMode]}
            onPress={() => setMode("receive")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "receive" && styles.activeModeText,
              ]}
            >
              Receive Stock
            </Text>
          </Pressable>
        </View>

        <View style={styles.cameraCard}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={
              canScan && !savingStock ? handleBarcodeScanned : undefined
            }
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "qr",
              ],
            }}
          />

          <View style={styles.cameraOverlay} />

          <View style={styles.scanFrame}>
            <View style={styles.scanCornerTopLeft} />
            <View style={styles.scanCornerTopRight} />
            <View style={styles.scanCornerBottomLeft} />
            <View style={styles.scanCornerBottomRight} />
            <View style={styles.scanLine} />
          </View>

          <View style={styles.scanStatusPill}>
            <View
              style={[
                styles.statusDot,
                canScan && !savingStock
                  ? styles.statusDotReady
                  : styles.statusDotBusy,
              ]}
            />

            <Text style={styles.scanStatusText}>
              {savingStock
                ? "Saving..."
                : canScan
                  ? "Ready to scan"
                  : "Processing scan..."}
            </Text>
          </View>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cart</Text>

          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in cart.</Text>
          ) : (
            cartItems.map((item) => (
              <View key={item.barcode} style={styles.cartRow}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    Rs {item.price} × {item.quantity}
                  </Text>
                </View>

                <Text style={styles.itemTotal}>Rs {item.total}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>

          {loadingProducts ? (
            <Text style={styles.emptyText}>Loading products...</Text>
          ) : products.length === 0 ? (
            <Text style={styles.emptyText}>No products found in database.</Text>
          ) : (
            products.map((product) => (
              <View key={product.barcode} style={styles.inventoryRow}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemMeta}>Barcode: {product.barcode}</Text>
                  <Text style={styles.itemMeta}>Price: Rs {product.price}</Text>
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
    letterSpacing: -0.5,
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
    paddingBottom: 44,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.8,
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
    borderRadius: 18,
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
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.12)",
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
    shadowColor: "#22C55E",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  messageText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
    letterSpacing: -0.4,
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
    letterSpacing: -0.2,
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
    letterSpacing: -0.5,
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
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
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
    borderRadius: 26,
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
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  toast: {
    position: "absolute",
    top: 14,
    left: 18,
    right: 18,
    zIndex: 999,
    elevation: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },

  toastSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },

  toastError: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },

  toastWarning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },

  toastInfo: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  toastIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },

  toastIconText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  toastText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
});