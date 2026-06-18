import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { initializing, role, session } = useAuth();
  const isAdmin = role === 'admin';

  if (initializing || !session) {
    return null;
  }

  return (
    <Tabs
      initialRouteName={isAdmin ? 'dashboard' : 'index'}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: isAdmin ? null : undefined,
          lazy: false,
          title: 'Sale',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          href: isAdmin ? null : undefined,
          lazy: false,
          title: 'Receive',
          tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Add',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-stacked-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
