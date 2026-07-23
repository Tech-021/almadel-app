import { StyleSheet, Text, View } from "react-native";

import { AdminScreenShell } from "@/components/admin/admin-screen-shell";
import { MetricCard } from "@/components/admin/metric-card";
import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSalesDashboard } from "@/hooks/use-sales-dashboard";

function money(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

export default function DashboardScreen() {
  const { fetchDashboard, loading, metrics, sales, salesLogAvailable } = useSalesDashboard();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <AdminScreenShell
      eyebrow="Admin"
      onRefresh={() => fetchDashboard(true)}
      refreshing={loading}
      subtitle="Sales, stock value, products, and low stock signals in one place."
      title="Dashboard"
    >
      <View style={styles.grid}>
        <MetricCard icon="cash-outline" label="Total sales" tone="green" value={money(metrics.totalSales)} />
        <MetricCard icon="receipt-outline" label="Sales logs" tone="blue" value={`${metrics.totalSalesCount}`} />
        <MetricCard icon="cube-outline" label="Products" value={`${metrics.totalProducts}`} />
        <MetricCard icon="warning-outline" label="Low stock" tone="red" value={`${metrics.lowStockCount}`} />
      </View>

      <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.panelTitle, { color: palette.text }]}>Inventory value</Text>
        <Text style={styles.panelValue}>{money(metrics.stockValue)}</Text>
        <Text style={[styles.panelMeta, { color: palette.muted }]}>{metrics.totalItemsSold} items sold from recorded sales.</Text>
      </View>

      <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.panelTitle, { color: palette.text }]}>Recent sales</Text>

        {!salesLogAvailable ? (
          <Text style={styles.emptyText}>Sales log table is not available yet.</Text>
        ) : sales.length === 0 ? (
          <Text style={styles.emptyText}>No sales recorded yet.</Text>
        ) : (
          sales.slice(0, 6).map((sale) => (
            <View key={sale.id} style={[styles.saleRow, { borderTopColor: palette.border }]}>
              <View>
                <Text style={[styles.saleTitle, { color: palette.text }]}>Sale #{sale.id}</Text>
                <Text style={[styles.saleMeta, { color: palette.muted }]}>{sale.total_items ?? 0} items</Text>
              </View>
              <Text style={styles.saleAmount}>{money(sale.total_amount ?? 0)}</Text>
            </View>
          ))
        )}
      </View>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  panelTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  panelValue: {
    color: "#0F766E",
    fontSize: 30,
    fontWeight: "900",
  },
  panelMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
  saleRow: {
    alignItems: "center",
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  saleTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  saleMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  saleAmount: {
    color: "#0F766E",
    fontSize: 15,
    fontWeight: "900",
  },
});
