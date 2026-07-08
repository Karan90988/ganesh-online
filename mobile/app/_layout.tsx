import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { registerForPushToken } from '../lib/push';
import { API_BASE_URL } from '../lib/config';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Show notifications while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  // Register this device for push notifications on launch,
  // then tell the backend so it can reach this device for broadcasts.
  useEffect(() => {
    registerForPushToken()
      .then((token) => {
        if (token) {
          fetch(`${API_BASE_URL}/api/devices/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // The app is designed light; force the light theme so screens stay readable
  // even when the phone is in dark mode.
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
