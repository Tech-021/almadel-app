import { ReactNode } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type AdminScreenShellProps = {
  children: ReactNode;
  eyebrow: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  subtitle: string;
  title: string;
};

export function AdminScreenShell({
  children,
  eyebrow,
  onRefresh,
  refreshing = false,
  subtitle,
  title,
}: AdminScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    padding: 18,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 6,
  },
});
