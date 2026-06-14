import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "../../lib/api";
import { GREEN, WHATSAPP_GREEN, modeTheme } from "../../lib/constants";
import { useCart } from "../../store/cart";
import { useT } from "../../lib/i18n";

interface Business {
  name: string;
  phone: string;
  address: string;
  mapUrl: string;
  whatsapp: string;
  hours: string;
}

export default function ContactScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const mode = useCart((s) => s.mode);
  const theme = modeTheme(mode);
  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Business>("/api/business")
      .then(setBiz)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const waUrl = biz?.whatsapp
    ? `https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(`Hello ${biz.name}, I have a question.`)}`
    : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: theme.main }} />
      <View style={[styles.header, { backgroundColor: theme.main }]}>
        <Text style={styles.brand}>Ganesh Trading Company</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.main} />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.title}>{t("contactTitle")}</Text>
          <Text style={styles.subtitle}>{t("contactSubtitle")}</Text>

          {!!biz?.phone && (
            <InfoRow icon="call" label={t("phone")} value={biz.phone} color={theme.main} bg={theme.light} />
          )}
          {!!biz?.address && (
            <InfoRow icon="location" label={t("address")} value={biz.address} color={theme.main} bg={theme.light} />
          )}
          {!!biz?.hours && <InfoRow icon="time" label={t("hours")} value={biz.hours} color={theme.main} bg={theme.light} />}

          <View style={{ gap: 10, marginTop: 8 }}>
            {!!biz?.phone && (
              <Pressable
                style={[styles.btn, styles.btnOutline]}
                onPress={() => Linking.openURL(`tel:${biz.phone.replace(/\s/g, "")}`)}
              >
                <Ionicons name="call" size={18} color={theme.main} />
                <Text style={styles.btnOutlineText}>{t("callShop")}</Text>
              </Pressable>
            )}
            {!!biz?.mapUrl && (
              <Pressable
                style={[styles.btn, styles.btnOutline]}
                onPress={() => Linking.openURL(biz.mapUrl)}
              >
                <Ionicons name="navigate" size={18} color={theme.main} />
                <Text style={styles.btnOutlineText}>{t("getDirections")}</Text>
              </Pressable>
            )}
            {!!waUrl && (
              <Pressable style={[styles.btn, { backgroundColor: WHATSAPP_GREEN }]} onPress={() => Linking.openURL(waUrl)}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.btnText}>{t("chatWhatsApp")}</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function InfoRow({ icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: GREEN, paddingVertical: 14, alignItems: "center" },
  brand: { color: "#fff", fontSize: 20, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#6b7280", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" },
  rowLabel: { color: "#6b7280", fontSize: 12 },
  rowValue: { fontWeight: "700", fontSize: 15 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 10, paddingVertical: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnOutline: { borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
  btnOutlineText: { color: "#111827", fontWeight: "800", fontSize: 16 },
});
