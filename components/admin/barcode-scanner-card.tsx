import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.card}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={24} color="#0F766E" />
        </View>

        <Text style={styles.cardTitle}>Camera permission needed</Text>
        <Text style={styles.cardText}>Allow camera access to scan a product barcode.</Text>

        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>{title}</Text>
          {helper && <Text style={styles.helperText}>{helper}</Text>}
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, locked && styles.statusDotBusy]} />
          <Text style={styles.statusText}>{statusText}</Text>
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

        <View style={styles.frame} />
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
          style={styles.manualInput}
          value={manualBarcode}
        />
        <Pressable style={styles.manualButton} onPress={submitManualBarcode}>
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
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
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
    borderRadius: 8,
    height: 240,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "#020617",
    justifyContent: "center",
  },
  cameraPlaceholderText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },
  frame: {
    borderColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 3,
    bottom: 56,
    left: 42,
    position: "absolute",
    right: 42,
    top: 56,
  },
  permissionButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
    justifyContent: "center",
    width: 52,
  },
});
