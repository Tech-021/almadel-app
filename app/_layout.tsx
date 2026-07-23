import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import "react-native-reanimated";

import { ToastProvider } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { initializing, session } = useAuth();
  const backgroundColor = colorScheme === "dark" ? "#080D18" : "#F6F8FC";

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  if (initializing) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View
          style={[
            styles.loadingScreen,
            { backgroundColor },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colorScheme === "dark" ? "#93C5FD" : "#2563EB"}
          />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          animation: "none",
          contentStyle: {
            backgroundColor,
          },
          headerShown: false,
        }}
      >
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
        </Stack.Protected>

        <Stack.Protected guard={session}>
          <Stack.Screen name="home" />
          <Stack.Screen name="sale" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar
        animated={false}
        backgroundColor={backgroundColor}
        style={colorScheme === "dark" ? "light" : "dark"}
      />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
