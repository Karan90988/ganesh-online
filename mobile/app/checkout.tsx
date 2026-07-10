import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
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
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [waSent, setWaSent] = useState(false);

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (result && /inactive|background/.test(appState.current) && next === "active") {
        setWaSent(true);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [result]);

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
    setDetectedAddress(null);
    setLocationCoords(null);
  }

  function clearLocation() {
    setDetectedAddress(null);
    setLocationCoords(null);
  }

  async function useCurrentLocation() {
    setLocating(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied. Please enter your address manually.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place) {
        const parts = [
          place.name,
          place.street,
          place.district,
          place.subregion,
          place.city,
          place.postalCode,
        ].filter(Boolean);
        setDetectedAddress(parts.join(", "));
        setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
    } catch {
      setErrorMsg("Couldn't fetch location. Please enter your address manually.");
    } finally {
      setLocating(false);
    }
  }

  async function submit() {
    setErrorMsg(null);
    if (name.trim().length < 2) return setErrorMsg(t("errName"));
    if (!/^[6-9]\d{9}$/.test(mobile)) return setErrorMsg(t("errMobile"));
    if (mode === "WHOLESALE" && shopName.trim().length < 5) return setErrorMsg("Please enter your shop name and address.");
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
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
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
        {!waSent && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: WHATSAPP_GREEN }]}
            onPress={() => Linking.openURL(result.whatsappUrl)}
          >
            <Text style={styles.primaryBtnText}>{t("sendWhatsApp")}</Text>
          </Pressable>
        )}
        <Pressable
          style={waSent ? [styles.primaryBtn, { backgroundColor: theme.main }] : undefined}
          onPress={() => router.replace("/")}
        >
          <Text style={waSent ? styles.primaryBtnText : [styles.link, { color: theme.main }]}>
            {t("continueShopping")}
          </Text>
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

      {/* Address block — same structure for both modes */}
      <View style={{ gap: 10 }}>
        {/* Step 1: Location button */}
        <Pressable
          onPress={useCurrentLocation}
          disabled={locating}
          style={[styles.locationBtn, { borderColor: theme.main }]}
        >
          {locating ? (
            <ActivityIndicator size={14} color={theme.main} />
          ) : (
            <Text style={styles.locationBtnIcon}>📍</Text>
          )}
          <Text style={[styles.locationBtnText, { color: theme.main }]}>
            {locating ? "Detecting location…" : "Use current location (optional)"}
          </Text>
        </Pressable>

        {/* Step 2: Detected location card */}
        {detectedAddress && (
          <View style={styles.detectedCard}>
            <Text style={styles.detectedLabel}>📍 Detected location</Text>
            <View style={styles.detectedRow}>
              <Text style={styles.detectedText} numberOfLines={3}>{detectedAddress}</Text>
              <Pressable onPress={clearLocation} style={styles.clearBtn} hitSlop={8}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 3: Required address input */}
        {mode === "WHOLESALE" ? (
          <Field label="Shop Name / Address *">
            <TextInput
              style={[styles.input, { height: 96, textAlignVertical: "top" }]}
              value={shopName}
              onChangeText={setShopName}
              multiline
              placeholder="e.g. Sharma Kirana Store, Shop No. 5, Market Road, Vasai"
            />
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
      </View>

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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24, backgroundColor: "#fff" },
  subtitle: { color: "#6b7280", fontSize: 13 },
  welcome: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12 },
  welcomeText: { fontWeight: "600", color: "#374151", flex: 1 },
  welcomeClear: { fontWeight: "700" },
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
  primaryBtn: { borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, borderStyle: "dashed" },
  locationBtnIcon: { fontSize: 15 },
  locationBtnText: { fontSize: 14, fontWeight: "600" },
  detectedCard: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 12, gap: 4 },
  detectedLabel: { fontSize: 11, fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5 },
  detectedRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detectedText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  clearBtn: { paddingTop: 1 },
  clearBtnText: { fontSize: 14, color: "#9ca3af", fontWeight: "700" },
  successTitle: { fontSize: 24, fontWeight: "900" },
  successMsg: { color: "#374151", textAlign: "center" },
  link: { fontWeight: "700" },
});
