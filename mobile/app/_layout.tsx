import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth-context";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post" />
            <Stack.Screen name="user" />
            <Stack.Screen name="setup" options={{ gestureEnabled: false }} />
            <Stack.Screen name="followers" />
            <Stack.Screen name="settings" options={{ presentation: "modal" }} />
          </Stack>
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
