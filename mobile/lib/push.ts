import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

let cachedToken: string | null = null;

/** The Expo push token captured at startup (null until registered / if denied). */
export function getCachedPushToken(): string | null {
  return cachedToken;
}

/**
 * Requests notification permission and returns the device's Expo push token.
 * Returns null on simulators, if permission is denied, or on error.
 */
export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      lightColor: "#16a34a",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    cachedToken = token.data;
    return token.data;
  } catch {
    return null;
  }
}
