import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/hooks/use-auth';

export default function TabLayout() {
  const { initializing, session } = useAuth();

  if (initializing || !session) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
