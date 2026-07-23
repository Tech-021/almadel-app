import { Stack } from "expo-router";
import React from "react";

import { InventoryTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const { initializing, session } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  if (initializing || !session) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        animation: "none",
        contentStyle: { backgroundColor: palette.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="receive" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="products" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="stock" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
