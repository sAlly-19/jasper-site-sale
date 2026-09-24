import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Slot } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "@/config/theme";
import "@/styles/compiled.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={Platform.OS === "web" ? styles.webContainer : undefined}>
      <Head>
        <title>Jasper AI HUD para Windows</title>
        <meta
          name="description"
          content="Avatar 3D com voz em tempo real e módulos de automação para Windows."
        />
      </Head>
      <View style={Platform.OS === "web" ? styles.webContainer : styles.container}>
        <StatusBar style="light" />
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webContainer: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: theme.colors.background,
    ...(Platform.OS === "web" ? ({ overflow: "visible" } as any) : {}),
  },
});
