import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ToastType = "error" | "info" | "success" | "warning";

type ToastState = {
  description?: string;
  id: number;
  title: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: Record<ToastType, (title: string, description?: string) => void>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcon: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  error: "alert-circle",
  info: "information-circle",
  success: "checkmark-circle",
  warning: "warning",
};

const toastTone: Record<
  ToastType,
  { accent: string; background: string; border: string }
> = {
  error: {
    accent: "#DC2626",
    background: "#FFF1F2",
    border: "#FDA4AF",
  },
  info: {
    accent: "#2563EB",
    background: "#EFF6FF",
    border: "#93C5FD",
  },
  success: {
    accent: "#0F766E",
    background: "#ECFDF5",
    border: "#5EEAD4",
  },
  warning: {
    accent: "#D97706",
    background: "#FFFBEB",
    border: "#FCD34D",
  },
};

export function ToastProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];
  const [currentToast, setCurrentToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 180,
        toValue: -16,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setCurrentToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setCurrentToast({
        description,
        id: Date.now(),
        title,
        type,
      });
      opacity.setValue(0);
      translateY.setValue(-16);

      Animated.parallel([
        Animated.timing(opacity, {
          duration: 220,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(hideToast, 3200);
    },
    [hideToast, opacity, translateY],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: {
        error: (title, description) => showToast("error", title, description),
        info: (title, description) => showToast("info", title, description),
        success: (title, description) =>
          showToast("success", title, description),
        warning: (title, description) =>
          showToast("warning", title, description),
      },
    }),
    [showToast],
  );
  const tone = currentToast ? toastTone[currentToast.type] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {currentToast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.host,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable
            accessibilityRole="alert"
            onPress={hideToast}
            style={[
              styles.toast,
              {
                backgroundColor: tone?.background ?? palette.card,
                borderColor: tone?.border ?? palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View
              style={[
                styles.accentRail,
                { backgroundColor: tone?.accent ?? palette.accent },
              ]}
            />
            <View
              style={[
                styles.iconShell,
                { backgroundColor: tone?.accent ?? palette.accent },
              ]}
            >
              <Ionicons
                color="#FFFFFF"
                name={toastIcon[currentToast.type]}
                size={21}
              />
            </View>

            <View style={styles.content}>
              <Text style={[styles.title, { color: palette.text }]}>
                {currentToast.title}
              </Text>
              {currentToast.description ? (
                <Text style={[styles.description, { color: palette.muted }]}>
                  {currentToast.description}
                </Text>
              ) : null}
            </View>

            <Ionicons name="close" size={20} color={palette.muted} />
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}

const styles = StyleSheet.create({
  host: {
    left: 12,
    position: "absolute",
    right: 12,
    top: 46,
    zIndex: 9999,
  },
  toast: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    elevation: 16,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 26,
  },
  accentRail: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 6,
  },
  iconShell: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    marginLeft: 4,
    width: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  description: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 3,
  },
});
