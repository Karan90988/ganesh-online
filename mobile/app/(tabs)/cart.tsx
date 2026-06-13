import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { formatCurrency } from "../../lib/api";
import { GREEN, MIN_ORDER_VALUE } from "../../lib/constants";
import { useCart, linesForMode, modeTotal } from "../../store/cart";
import { useT } from "../../lib/i18n";
import { QtyInput } from "../../components/qty-input";

export default function CartTab() {
  const router = useRouter();
  const t = useT();
  const mode = useCart((s) => s.mode);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const insets = useSafeAreaInsets();

  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);
  const minValue = MIN_ORDER_VALUE[mode];
  const belowMin = total < minValue;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: GREEN }} />
      <View style={styles.header}>
        <Text style={styles.brand}>
          {t("cart")} · {mode === "WHOLESALE" ? t("wholesale") : t("retail")}
        </Text>
      </View>

      {lines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{t("cartEmpty")}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace("/")}>
            <Text style={styles.primaryBtnText}>{t("browse")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
            {lines.map((line) => (
              <View key={line.key} style={styles.row}>
                <View style={styles.thumb}>
                  <Text style={styles.thumbInitial}>{line.name.charAt(0).toUpperCase()}</Text>
                  {!!line.imageUrl && (
                    <Image source={line.imageUrl} style={styles.thumbAbs} contentFit="cover" />
                  )}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text numberOfLines={2} style={styles.name}>
                    {line.displayName}
                  </Text>
                  <Text style={styles.unitPrice}>
                    {formatCurrency(line.unitPrice)} / {line.unitLabel}
                  </Text>
                  <QtyInput
                    value={line.quantity}
                    min={line.minQty}
                    unitLabel={line.unitLabel}
                    onChange={(q) => setQuantity(line.key, q)}
                  />
                </View>
                <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                  <Pressable onPress={() => removeLine(line.key)} hitSlop={6}>
                    <Text style={styles.remove}>{t("remove")}</Text>
                  </Pressable>
                  <Text style={styles.lineTotal}>{formatCurrency(line.unitPrice * line.quantity)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
            {belowMin ? (
              <>
                <Text style={styles.minNote}>
                  {t("minNotice", { more: formatCurrency(minValue - total), min: formatCurrency(minValue) })}
                </Text>
                <Pressable style={[styles.primaryBtn, styles.btnDisabled]} disabled>
                  <Text style={styles.btnDisabledText}>{t("proceed")}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={() => router.push("/checkout")}>
                <Text style={styles.primaryBtnText}>{t("proceed")}</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: GREEN, paddingVertical: 14, alignItems: "center" },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 8 },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbInitial: { fontSize: 28, fontWeight: "800", color: GREEN, opacity: 0.5 },
  thumbAbs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  name: { fontWeight: "700", fontSize: 13 },
  unitPrice: { color: "#6b7280", fontSize: 12 },
  remove: { color: "#b91c1c", fontWeight: "600", fontSize: 12 },
  lineTotal: { fontWeight: "800" },
  footer: { borderTopWidth: 1, borderTopColor: "#e5e7eb", padding: 16, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "900" },
  minNote: { backgroundColor: "#fffbeb", color: "#92400e", padding: 10, borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: "600" },
  primaryBtn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { backgroundColor: "#e5e7eb" },
  btnDisabledText: { color: "#9ca3af", fontWeight: "800", fontSize: 16 },
});
