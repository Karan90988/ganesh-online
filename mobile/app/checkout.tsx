import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { apiPost, formatCurrency } from "../lib/api";
import { GREEN, WHATSAPP_GREEN, modeTheme } from "../lib/constants";
import { useCart, linesForMode, modeTotal } from "../store/cart";
import { useCustomer } from "../store/customer";
import { useStoreSettings } from "../lib/settings";
import { getCachedPushToken } from "../lib/push";
import { useT } from "../lib/i18n";

interface OrderResult {
  enquiryId: string;
  enquiryCode: string;
  whatsappUrl: string;
  grandTotal: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const t = useT();
  const mode = useCart((s) => s.mode);
  const items = useCart((s) => s.items);
  const clearMode = useCart((s) => s.clearMode);
  const profile = useCustomer((s) => s.profile);
  const saveProfile = useCustomer((s) => s.saveProfile);
  const clearProfile = useCustomer((s) => s.clearProfile);

  const settings = useStoreSettings();
  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);

  const isRetail = mode === "RETAIL";
  const deliveryCharge =
    isRetail && total < settings.retailFreeDeliveryThreshold ? settings.retailDeliveryCharge : 0;
  const grand = total + deliveryCharge;
  const minValue = settings.wholesaleMinOrderValue;
  const belowMin = !isRetail && total < minValue;
  const theme = modeTheme(mode);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);

  // Prefill once from the saved on-device profile.
  const prefilled = useRef(false);
  useEffect(() => {
    if (profile && !prefilled.current) {
      setName(profile.name || "");
      setMobile(profile.mobile || "");
      setShopName(profile.shopName || "");
      setAddress(profile.address || "");
      prefilled.current = true;
    }
  }, [profile]);

  function forgetMe() {
    clearProfile();
    setName("");
    setMobile("");
    setShopName("");
    setAddress("");
  }

  async function submit() {
    setErrorMsg(null);
    if (name.trim().length < 2) return setErrorMsg(t("errName"));
    if (!/^[6-9]\d{9}$/.test(mobile)) return setErrorMsg(t("errMobile"));
    if (mode === "RETAIL" && address.trim().length < 10) return setErrorMsg(t("errAddress"));
    if (belowMin) return setErrorMsg(t("errMin", { min: formatCurrency(minValue) }));

    setSubmitting(true);
    try {
      const data = await apiPost<OrderResult>("/api/enquiries", {
        type: mode,
        customerName: name.trim(),
        mobile,
        shopName: mode === "WHOLESALE" ? shopName.trim() : undefined,
        deliveryAddress: mode === "RETAIL" ? address.trim() : undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, variant: l.variant })),
        pushToken: getCachedPushToken() || undefined,
      });
      saveProfile({ name: name.trim(), mobile, shopName: shopName.trim(), address: address.trim() });
      setResult(data);
      clearMode(mode);
      apiPost(`/api/enquiries/${data.enquiryId}/sent`, {}).catch(() => {});
      Linking.openURL(data.whatsappUrl).catch(() => {});
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t("errOrder"));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Stack.Screen options={{ title: t("orderSaved") }} />
        <Text style={styles.successTitle}>{t("orderSaved")} ✅</Text>
        <Text style={styles.successMsg}>
          {t("orderIdIs")} <Text style={{ fontWeight: "800" }}>{result.enquiryCode}</Text>.
        </Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: WHATSAPP_GREEN }]}
          onPress={() => Linking.openURL(result.whatsappUrl)}
        >
          <Text style={styles.primaryBtnText}>{t("sendWhatsApp")}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")}>
          <Text style={[styles.link, { color: theme.main }]}>{t("continueShopping")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: t("checkout") }} />
      <Text style={styles.subtitle}>
        {mode === "WHOLESALE" ? t("wholesaleOrder") : t("retailOrder")} — {t("paymentNote")}
      </Text>

      {profile && (
        <View style={[styles.welcome, { backgroundColor: theme.light, borderColor: theme.main }]}>
          <Text style={styles.welcomeText}>{t("welcomeBack", { name: profile.name || "" })}</Text>
          <Pressable onPress={forgetMe}>
            <Text style={[styles.welcomeClear, { color: theme.main }]}>{t("notYou")}</Text>
          </Pressable>
        </View>
      )}

      <Field label={`${t("yourName")} *`}>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t("namePlaceholder")} />
      </Field>
      <Field label={`${t("mobileNumber")} *`}>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={(tx) => setMobile(tx.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={10}
          placeholder={t("mobilePlaceholder")}
        />
      </Field>
      {mode === "WHOLESALE" ? (
        <Field label={t("shopOptional")}>
          <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder={t("shopPlaceholder")} />
        </Field>
      ) : (
        <Field label={`${t("deliveryAddress")} *`}>
          <TextInput
            style={[styles.input, { height: 96, textAlignVertical: "top" }]}
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder={t("addressPlaceholder")}
          />
        </Field>
      )}

      <View style={styles.totalBox}>
        {isRetail ? (
          <View style={{ gap: 6 }}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>{t("subtotal")}</Text>
              <Text style={styles.totalLineVal}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>{t("delivery")}</Text>
              {deliveryCharge > 0 ? (
                <Text style={styles.totalLineVal}>{formatCurrency(deliveryCharge)}</Text>
              ) : (
                <Text style={[styles.totalLineVal, { color: theme.main }]}>{t("free")}</Text>
              )}
            </View>
            <View style={[styles.totalLine, styles.totalLineGrand]}>
              <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
              <Text style={styles.totalValue}>{formatCurrency(grand)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        )}
      </View>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: WHATSAPP_GREEN }, submitting && styles.btnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t("placeOrder")}</Text>}
      </Pressable>
      <Text style={styles.note}>{t("savedNote")}</Text>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  subtitle: { color: "#6b7280", fontSize: 13 },
  welcome: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 10, padding: 12 },
  welcomeText: { fontWeight: "600", color: "#374151", flex: 1 },
  welcomeClear: { color: GREEN, fontWeight: "700" },
  label: { fontWeight: "700", fontSize: 14 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  totalBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLineLabel: { color: "#6b7280", fontSize: 14 },
  totalLineVal: { fontSize: 14, fontWeight: "600" },
  totalLineGrand: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 6, marginTop: 2 },
  totalLabel: { fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "900" },
  error: { backgroundColor: "#fef2f2", color: "#b91c1c", padding: 10, borderRadius: 8, fontWeight: "600" },
  primaryBtn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  note: { color: "#9ca3af", fontSize: 12, textAlign: "center" },
  successTitle: { fontSize: 24, fontWeight: "900" },
  successMsg: { color: "#374151", textAlign: "center" },
  link: { color: GREEN, fontWeight: "700" },
});
