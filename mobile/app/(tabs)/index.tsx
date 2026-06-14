import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, formatCurrency } from "../../lib/api";
import { CategoryDTO, ProductDTO } from "../../lib/types";
import { modeTheme, UNIT_LABELS } from "../../lib/constants";
import { leadPrice } from "../../lib/cart-lines";
import { useCart } from "../../store/cart";
import { useT, useLocaleStore, LOCALES, LOCALE_LABELS } from "../../lib/i18n";
import { PromoBanner } from "../../components/promo-banner";

export default function HomeLanding() {
  const router = useRouter();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const mode = useCart((s) => s.mode);
  const setMode = useCart((s) => s.setMode);
  const insets = useSafeAreaInsets();
  const theme = modeTheme(mode);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [trending, setTrending] = useState<ProductDTO[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiGet<CategoryDTO[]>("/api/categories").then(setCategories).catch(() => {});
    apiGet<{ products: ProductDTO[] }>("/api/trending-products")
      .then((d) => setTrending(d.products))
      .catch(() => {});
  }, []);

  const openCategory = (slug: string) => {
    router.push({ pathname: "/browse", params: { category: slug } });
  };
  const submitSearch = () => {
    const q = search.trim();
    if (q) router.push({ pathname: "/browse", params: { q } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: theme.main }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.main }]}>
        <Text style={styles.brand} numberOfLines={1}>
          Ganesh Trading Company
        </Text>
        <View style={styles.langRow}>
          {LOCALES.map((l) => (
            <Pressable key={l} onPress={() => setLocale(l)} style={[styles.lang, locale === l && styles.langActive]}>
              <Text style={[styles.langText, locale === l && { color: theme.main }]}>{LOCALE_LABELS[l]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Retail / Wholesale section tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.main }]}>
        <SectionTab
          label={t("shopRetail")}
          sub={t("retailDelivery")}
          icon="bag-handle"
          active={mode === "RETAIL"}
          color={modeTheme("RETAIL").main}
          onPress={() => setMode("RETAIL")}
        />
        <SectionTab
          label={t("shopWholesale")}
          sub={t("wholesaleDelivery")}
          icon="cube"
          active={mode === "WHOLESALE"}
          color={modeTheme("WHOLESALE").main}
          onPress={() => setMode("WHOLESALE")}
        />
      </View>

      <ScrollView style={{ backgroundColor: theme.light }} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Rotating promo banner */}
        <PromoBanner />

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {/* Shop by category */}
        <Text style={styles.sectionTitle}>{t("shopByCategory")}</Text>
        <View style={styles.catGrid}>
          {categories.map((c) => (
            <Pressable key={c.id} style={styles.catTile} onPress={() => openCategory(c.slug)}>
              <View style={[styles.catImageBox, { backgroundColor: "#fff" }]}>
                <Text style={[styles.catInitial, { color: theme.main }]}>{c.name.charAt(0).toUpperCase()}</Text>
                {!!c.imageUrl && <Image source={c.imageUrl} style={styles.catImg} contentFit="cover" />}
              </View>
              <Text numberOfLines={2} style={styles.catName}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Trending products — horizontal slider */}
        {trending.length > 0 && (
          <>
            <View style={styles.trendHead}>
              <Ionicons name="trending-up" size={18} color={theme.main} />
              <Text style={[styles.sectionTitle, { marginTop: 0, paddingHorizontal: 0 }]}>{t("trending")}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendRow}
            >
              {trending.map((item) => {
                const price = leadPrice(item, mode);
                const showMrp = item.mrp > price;
                return (
                  <Pressable
                    key={item.id}
                    style={styles.trendCard}
                    onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })}
                  >
                    <View style={styles.trendImageWrap}>
                      <Text style={[styles.trendInitial, { color: theme.main }]}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                      {!!item.imageUrl && (
                        <Image source={item.imageUrl} style={styles.imageAbs} contentFit="cover" transition={150} />
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.trendName}>
                      {item.name}
                    </Text>
                    <Text style={[styles.trendPrice, { color: theme.main }]}>
                      {formatCurrency(price)}
                      <Text style={styles.trendUnit}> / {UNIT_LABELS[item.unit]}</Text>
                    </Text>
                    {showMrp && (
                      <View style={styles.priceMeta}>
                        <Text style={styles.mrp}>MRP {formatCurrency(item.mrp)}</Text>
                        <Text style={styles.savePill}>Save {formatCurrency(item.mrp - price)}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTab({
  label,
  sub,
  icon,
  active,
  color,
  onPress,
}: {
  label: string;
  sub: string;
  icon: any;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <View style={styles.tabTitleRow}>
        <Ionicons name={icon} size={16} color={active ? color : "#fff"} />
        <Text style={[styles.tabLabel, { color: active ? color : "#fff" }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.tabSub, { color: active ? "#6b7280" : "rgba(255,255,255,0.85)" }]} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { color: "#fff", fontSize: 16, fontWeight: "800", flexShrink: 1, marginRight: 8 },
  langRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, padding: 2, flexShrink: 0 },
  lang: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  langActive: { backgroundColor: "#fff" },
  langText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  // Section tabs
  tabRow: { flexDirection: "row", paddingHorizontal: 10, paddingBottom: 10, gap: 8 },
  tab: { flex: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  tabLabel: { fontSize: 14, fontWeight: "800" },
  tabSub: { fontSize: 10, fontWeight: "600", marginTop: 1 },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 12, marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  sectionTitle: { fontSize: 18, fontWeight: "800", paddingHorizontal: 14, marginTop: 14, marginBottom: 10 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10 },
  catTile: { width: "33.33%", padding: 6 },
  catImageBox: { width: "100%", aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  catInitial: { fontSize: 40, fontWeight: "800", opacity: 0.55 },
  catImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  catName: { textAlign: "center", fontSize: 12, fontWeight: "600", marginTop: 6 },

  // Trending slider
  trendHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, marginTop: 16, marginBottom: 10 },
  trendRow: { paddingHorizontal: 12, gap: 10 },
  trendCard: { width: 150, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 8 },
  trendImageWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", borderRadius: 10, overflow: "hidden" },
  trendInitial: { fontSize: 40, fontWeight: "800", opacity: 0.55 },
  imageAbs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  trendName: { fontSize: 13, fontWeight: "600", marginTop: 6, minHeight: 34 },
  trendPrice: { fontSize: 15, fontWeight: "800" },
  trendUnit: { fontSize: 11, fontWeight: "400", color: "#6b7280" },
  priceMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 },
  mrp: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  savePill: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: 10, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
});
