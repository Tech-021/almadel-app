import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

import { useScanFeedback } from "@/hooks/use-scan-feedback";

type BarcodeScannerCardProps = {
  active?: boolean;
  onScanned: (barcode: string) => void;
  title: string;
};

const SCAN_COOLDOWN_MS = 2500;
const SAME_BARCODE_COOLDOWN_MS = 5000;

export function BarcodeScannerCard({ active = true, onScanned, title }: BarcodeScannerCardProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const isFocused = useIsFocused();
  const lastScanRef = useRef<{ barcode: string; time: number } | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playScanFeedback } = useScanFeedback();

  useFocusEffect(
    useCallback(() => {
      setLocked(false);
      setCameraKey((key) => key + 1);

      return () => {
        if (unlockTimerRef.current) {
          clearTimeout(unlockTimerRef.current);
        }
        setLocked(false);
      };
    }, [])
  );

  const handleScan = ({ data }: { data: string }) => {
    if (!active || !isFocused || locked) return;

    const barcode = data.trim();
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
    }, SCAN_COOLDOWN_MS);
  };

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
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, locked && styles.statusDotBusy]} />
          <Text style={styles.statusText}>{!active ? "Paused" : locked ? "Reading" : "Ready"}</Text>
        </View>
      </View>

      <View style={styles.cameraWrap}>
        {isFocused && (
          <CameraView
            key={cameraKey}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
            }}
            facing="back"
            onBarcodeScanned={!active || locked ? undefined : handleScan}
            style={styles.camera}
          />
        )}

        <View style={styles.frame} />
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
});
