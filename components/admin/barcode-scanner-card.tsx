import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScanFeedback } from "@/hooks/use-scan-feedback";

type BarcodeScannerCardProps = {
  active?: boolean;
  helper?: string;
  manualPlaceholder?: string;
  onScanned: (barcode: string) => void;
  resetKey?: number;
  title: string;
};

const SCAN_COOLDOWN_MS = 2500;
const SAME_BARCODE_COOLDOWN_MS = 5000;

export function BarcodeScannerCard({
  active = true,
  helper,
  manualPlaceholder = "Enter barcode manually",
  onScanned,
  resetKey = 0,
  title,
}: BarcodeScannerCardProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [manualBarcode, setManualBarcode] = useState("");
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];
  const isFocused = useIsFocused();
  const lastScanRef = useRef<{ barcode: string; time: number } | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playScanFeedback } = useScanFeedback();
  const scanEnabled = Boolean(permission?.granted && active && isFocused && !locked);

  const resetScanner = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
    }

    lastScanRef.current = null;
    setLocked(false);
    setManualBarcode("");
    setCameraKey((key) => key + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetScanner();

      return () => {
        if (unlockTimerRef.current) {
          clearTimeout(unlockTimerRef.current);
        }
        unlockTimerRef.current = null;
      };
    }, [resetScanner])
  );

  useEffect(() => {
    resetScanner();
  }, [resetKey, resetScanner]);

  const commitBarcode = useCallback(
    (rawBarcode: string) => {
      if (!active || !isFocused || locked) return;

      const barcode = rawBarcode.trim();
      const now = Date.now();
      const lastScan = lastScanRef.current;

      if (barcode.length < 4) return;

      if (
        lastScan &&
        lastScan.barcode === barcode &&
        now - lastScan.time < SAME_BARCODE_COOLDOWN_MS
      ) {
        return;
      }

      lastScanRef.current = { barcode, time: now };
      setLocked(true);
      playScanFeedback();
      onScanned(barcode);

      unlockTimerRef.current = setTimeout(() => {
        setLocked(false);
        unlockTimerRef.current = null;
      }, SCAN_COOLDOWN_MS);
    },
    [active, isFocused, locked, onScanned, playScanFeedback]
  );

  const handleScan = ({ data }: { data: string }) => {
    commitBarcode(data);
  };

  const submitManualBarcode = () => {
    commitBarcode(manualBarcode);
  };

  const statusText = !active ? "Paused" : locked ? "Captured" : scanEnabled ? "Ready" : "Opening";

  if (!active) {
    return null;
  }

  if (!permission) {
    return (
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={[styles.permissionIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="camera-outline" size={24} color={palette.accent} />
        </View>

        <Text style={[styles.cardTitle, { color: palette.text }]}>Camera permission needed</Text>
        <Text style={[styles.cardText, { color: palette.muted }]}>Allow camera access to scan a product barcode.</Text>

        <Pressable style={[styles.permissionButton, { backgroundColor: palette.accent }]} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
          {helper && <Text style={[styles.helperText, { color: palette.muted }]}>{helper}</Text>}
        </View>
        <View style={[styles.statusPill, { backgroundColor: palette.mutedSoft }]}>
          <View style={[styles.statusDot, locked && styles.statusDotBusy]} />
          <Text style={[styles.statusText, { color: palette.text }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.cameraWrap}>
        {scanEnabled && (
          <CameraView
            key={cameraKey}
            active={scanEnabled}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
            }}
            facing="back"
            onBarcodeScanned={handleScan}
            style={styles.camera}
          />
        )}

        <View style={styles.cameraShade} />
        <View style={styles.frame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          <View style={styles.scanLine} />
        </View>
        {!scanEnabled && (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>Opening camera...</Text>
          </View>
        )}
      </View>

      <View style={styles.manualRow}>
        <TextInput
          autoCapitalize="none"
          keyboardType="numeric"
          onChangeText={setManualBarcode}
          placeholder={manualPlaceholder}
          placeholderTextColor="#94A3B8"
          style={[
            styles.manualInput,
            { backgroundColor: palette.mutedSoft, borderColor: palette.border, color: palette.text },
          ]}
          value={manualBarcode}
        />
        <Pressable style={[styles.manualButton, { backgroundColor: palette.accent }]} onPress={submitManualBarcode}>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  cardText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 6,
  },
  cameraWrap: {
    backgroundColor: "#020617",
    borderRadius: 20,
    height: 270,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.92)",
    justifyContent: "center",
  },
  cameraPlaceholderText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.14)",
  },
  frame: {
    bottom: 62,
    left: 38,
    position: "absolute",
    right: 38,
    top: 62,
    justifyContent: "center",
  },
  cornerTopLeft: {
    borderColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderTopLeftRadius: 22,
    borderTopWidth: 4,
    height: 34,
    left: 0,
    position: "absolute",
    top: 0,
    width: 34,
  },
  cornerTopRight: {
    borderColor: "#FFFFFF",
    borderRightWidth: 4,
    borderTopRightRadius: 22,
    borderTopWidth: 4,
    height: 34,
    position: "absolute",
    right: 0,
    top: 0,
    width: 34,
  },
  cornerBottomLeft: {
    borderBottomLeftRadius: 22,
    borderBottomWidth: 4,
    borderColor: "#FFFFFF",
    borderLeftWidth: 4,
    bottom: 0,
    height: 34,
    left: 0,
    position: "absolute",
    width: 34,
  },
  cornerBottomRight: {
    borderBottomRightRadius: 22,
    borderBottomWidth: 4,
    borderColor: "#FFFFFF",
    borderRightWidth: 4,
    bottom: 0,
    height: 34,
    position: "absolute",
    right: 0,
    width: 34,
  },
  scanLine: {
    backgroundColor: "#60A5FA",
    borderRadius: 999,
    height: 3,
    marginHorizontal: 22,
  },
  permissionButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 48,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  permissionIcon: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: "#16A34A",
    borderRadius: 99,
    height: 8,
    width: 8,
  },
  statusDotBusy: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  manualRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  manualInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  manualButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 14,
    justifyContent: "center",
    width: 52,
  },
});
