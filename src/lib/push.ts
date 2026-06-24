import "server-only";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Looks like a valid Expo push token. */
function isExpoToken(t: unknown): t is string {
  return typeof t === "string" && t.startsWith("ExponentPushToken");
}

/**
 * Sends an Expo push notification to one or more device tokens.
 * Best-effort: never throws, so it can't break the request that triggered it.
 */
export async function sendExpoPush(tokens: (string | null | undefined)[], msg: PushMessage): Promise<void> {
  const valid = Array.from(new Set(tokens.filter(isExpoToken)));
  if (valid.length === 0) return;

  for (let i = 0; i < valid.length; i += 100) {
    const chunk = valid.slice(i, i + 100);
    const messages = chunk.map((to) => ({
      to,
      sound: "default",
      title: msg.title,
      body: msg.body,
      data: msg.data ?? {},
    }));
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
    } catch {
      // best-effort — ignore network/Expo errors
    }
  }
}
