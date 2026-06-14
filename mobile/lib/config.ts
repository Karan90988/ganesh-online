import Constants from "expo-constants";

/**
 * Backend base URL.
 *  - DEV: auto-detected from the Expo dev-server host (your PC's current LAN IP),
 *    so it keeps working even when your WiFi IP changes. Port 3000 = `npm run dev`.
 *  - PROD: set PRODUCTION_API_URL to your deployed Vercel URL.
 */
const PRODUCTION_API_URL = "https://ganesh-online.vercel.app";

function devApiBase(): string {
  // e.g. "192.168.0.104:8081"  (Expo Go / Metro host)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    // older field, present in some Expo Go versions
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    "";
  const host = String(hostUri).split(":")[0];
  if (host) return `http://${host}:3000`;
  // last-resort fallback — update if auto-detect ever fails
  return "http://192.168.0.101:3000";
}

export const API_BASE_URL = __DEV__ ? devApiBase() : PRODUCTION_API_URL;
