import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../lib/api";
import { GREEN } from "../lib/constants";
import { registerForPushToken } from "../lib/push";

/** Shop-owner only: opt this device into "new order" push alerts (secret-gated). */
export default function OwnerAlertsScreen() {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(enable: boolean) {
    setMsg(null);
    if (!secret.trim()) {
      setMsg({ ok: false, text: "Enter the owner code." });
      return;
    }
    setBusy(true);
    try {
      const token = await registerForPushToken();
      if (!token) {
        setMsg({ ok: false, text: "Please allow notifications for this app, then try again." });
        return;
      }
      await apiPost("/api/owner-devices", { token, secret: secret.trim(), enable });
      setMsg({
        ok: true,
        text: enable
          ? "✅ Order alerts enabled on this device."
          : "Order alerts disabled on this device.",
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not update alerts." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: "Shop Owner Alerts" }} />

      <View style={styles.iconWrap}>
        <Ionicons name="notifications" size={36} color={GREEN} />
      </View>
      <Text style={styles.title}>New-order alerts</Text>
      <Text style={styles.subtitle}>
        Enable push notifications on this device so you get an alert the moment a customer places an
        order. Enter the owner code to continue.
      </Text>

      <TextInput
        style={styles.input}
        value={secret}
        onChangeText={setSecret}
        placeholder="Owner code"
        secureTextEntry
        autoCapitalize="none"
      />

      {msg && (
        <Text style={[styles.msg, msg.ok ? styles.msgOk : styles.msgErr]}>{msg.text}</Text>
      )}

      <Pressable style={[styles.btn, busy && styles.btnDisabled]} disabled={busy} onPress={() => submit(true)}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enable alerts</Text>}
      </Pressable>
      <Pressable disabled={busy} onPress={() => submit(false)}>
        <Text style={styles.link}>Disable on this device</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, gap: 12 },
  iconWrap: { alignSelf: "center", width: 72, height: 72, borderRadius: 999, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", marginTop: 12 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#6b7280", textAlign: "center", lineHeight: 20 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, marginTop: 6 },
  msg: { borderRadius: 8, padding: 10, fontWeight: "600", textAlign: "center" },
  msgOk: { backgroundColor: "#ecfdf5", color: "#065f46" },
  msgErr: { backgroundColor: "#fef2f2", color: "#b91c1c" },
  btn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  link: { color: "#6b7280", fontWeight: "700", textAlign: "center", paddingVertical: 10 },
});
