import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { apiGet, apiPost, formatCurrency } from "../../lib/api";
import { ProductDTO } from "../../lib/types";
import { GREEN, UNIT_LABELS } from "../../lib/constants";
import { getCartOptions, leadPrice } from "../../lib/cart-lines";
import { useCart, modeCount, modeTotal } from "../../store/cart";
import { useT } from "../../lib/i18n";
import { QtyInput } from "../../components/qty-input";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const t = useT();
  const mode = useCart((s) => s.mode);
  const items = useCart((s) => s.items);
  const addLine = useCart((s) => s.addLine);
  const setQuantity = useCart((s) => s.setQuantity);
  const cartCount = useCart((s) => modeCount(s.items, s.mode));
  const cartTotal = useCart((s) => modeTotal(s.items, s.mode));

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [related, setRelated] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiGet<{ product: ProductDTO; related: ProductDTO[] }>(`/api/products/${slug}`);
      setProduct(data.product);
      setRelated(data.related || []);
      // Record a view (fire-and-forget) to feed the Trending ranking.
      apiPost(`/api/products/${slug}/click`, {}).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Product" }} />
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Product" }} />
        <Text style={styles.errTitle}>Couldn&apos;t load product</Text>
        <Text style={styles.errMsg}>{error}</Text>
      </View>
    );
  }

  const outOfStock = product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0;
  const options = getCartOptions(product, mode);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Compact image */}
        <View style={styles.imageWrap}>
          <Text style={styles.imageInitial}>{product.name.charAt(0).toUpperCase()}</Text>
          {!!product.imageUrl && (
            <Image source={product.imageUrl} style={styles.imageAbs} contentFit="contain" transition={150} />
          )}
        </View>

        <View style={styles.body}>
          {product.category && <Text style={styles.category}>{product.category.name}</Text>}
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.badges}>
            <Text style={styles.badgeOutline}>
              {mode === "WHOLESALE" ? t("wholesalePricing") : t("retailPriceLabel")}
            </Text>
            <Text style={[styles.badge, outOfStock ? styles.badgeRed : styles.badgeGreen]}>
              {outOfStock ? t("outOfStock") : t("inStock")}
            </Text>
          </View>

          {/* Buy options */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {options.map((opt) => {
              const inCart = items[opt.input.key]?.quantity ?? 0;
              const showMrp = opt.input.packSize == null && product.mrp > opt.input.unitPrice;
              return (
                <View key={opt.input.key} style={styles.optCard}>
                  <View style={styles.priceRow}>
                    <Text style={styles.optPrice}>{opt.priceLabel}</Text>
                    {showMrp && <Text style={styles.mrp}>MRP {formatCurrency(product.mrp)}</Text>}
                  </View>
                  {showMrp && (
                    <Text style={styles.savePill}>
                      You save {formatCurrency(product.mrp - opt.input.unitPrice)}
                    </Text>
                  )}
                  {!!opt.packInfo && <Text style={styles.optInfo}>{opt.packInfo}</Text>}
                  {!!opt.subLabel && <Text style={styles.optSub}>{opt.subLabel}</Text>}

                  <View style={{ marginTop: 8 }}>
                    {outOfStock ? (
                      <View style={[styles.addBtn, styles.addBtnDisabled]}>
                        <Text style={styles.addBtnTextDisabled}>{t("outOfStock")}</Text>
                      </View>
                    ) : inCart === 0 ? (
                      <Pressable style={styles.addBtn} onPress={() => addLine(opt.input)}>
                        <Text style={styles.addBtnText}>{opt.buttonLabel}</Text>
                      </Pressable>
                    ) : (
                      <QtyInput
                        value={inCart}
                        min={opt.input.minQty}
                        unitLabel={opt.input.unitLabel}
                        dark
                        block
                        onChange={(q) => setQuantity(opt.input.key, q)}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {!!product.description && (
            <Text style={styles.desc} numberOfLines={3}>
              {product.description}
            </Text>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.relTitle}>More in {product.category?.name ?? "this category"}</Text>
              <View style={styles.relGrid}>
                {related.map((r) => {
                  const price = leadPrice(r, mode);
                  const showMrp = r.mrp > price;
                  return (
                    <Pressable
                      key={r.id}
                      style={styles.relCard}
                      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: r.slug } })}
                    >
                      <View style={styles.relImageWrap}>
                        <Text style={styles.relInitial}>{r.name.charAt(0).toUpperCase()}</Text>
                        {!!r.imageUrl && (
                          <Image source={r.imageUrl} style={styles.imageAbs} contentFit="cover" transition={150} />
                        )}
                      </View>
                      <Text numberOfLines={2} style={styles.relName}>
                        {r.name}
                      </Text>
                      <Text style={styles.relPrice}>
                        {formatCurrency(price)}
                        <Text style={styles.relUnit}> / {UNIT_LABELS[r.unit]}</Text>
                      </Text>
                      {showMrp && <Text style={styles.relMrp}>MRP {formatCurrency(r.mrp)}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <Pressable style={styles.viewCart} onPress={() => router.push("/cart")}>
          <Text style={styles.viewCartText}>
            {t("goToCart")} ({cartCount}) · {formatCurrency(cartTotal)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 6 },
  errTitle: { fontSize: 16, fontWeight: "700", color: "#b91c1c" },
  errMsg: { color: "#6b7280", textAlign: "center" },
  imageWrap: { width: "100%", height: 220, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" },
  imageInitial: { fontSize: 72, fontWeight: "800", color: GREEN, opacity: 0.5 },
  imageAbs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  viewCart: { backgroundColor: GREEN, padding: 16, alignItems: "center" },
  viewCartText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  body: { padding: 14, gap: 4 },
  category: { color: GREEN, fontWeight: "700", fontSize: 12 },
  name: { fontSize: 19, fontWeight: "800" },
  badges: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 6 },
  badge: { fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  badgeOutline: { fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "#d1d5db", color: "#374151", overflow: "hidden" },
  badgeGreen: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeRed: { backgroundColor: "#fee2e2", color: "#991b1b" },
  desc: { color: "#4b5563", marginTop: 8, lineHeight: 19, fontSize: 13 },
  optCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  optPrice: { fontSize: 18, fontWeight: "800", color: GREEN },
  mrp: { fontSize: 13, color: "#9ca3af", textDecorationLine: "line-through" },
  savePill: { alignSelf: "flex-start", marginTop: 4, backgroundColor: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  optInfo: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  optSub: { color: "#6b7280", fontSize: 12 },
  addBtn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  addBtnDisabled: { backgroundColor: "#e5e7eb" },
  addBtnTextDisabled: { color: "#9ca3af", fontWeight: "800", fontSize: 16 },
  relTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  relGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  relCard: { width: "50%", padding: 5 },
  relImageWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  relInitial: { fontSize: 40, fontWeight: "800", color: GREEN, opacity: 0.55 },
  relName: { fontSize: 13, fontWeight: "600", marginTop: 6, minHeight: 34 },
  relPrice: { fontSize: 14, fontWeight: "800", color: GREEN },
  relUnit: { fontSize: 11, fontWeight: "400", color: "#6b7280" },
  relMrp: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
});
