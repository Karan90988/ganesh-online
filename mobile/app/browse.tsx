import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, formatCurrency } from "../lib/api";
import { CategoryDTO, Pagination, ProductDTO } from "../lib/types";
import { GREEN, UNIT_LABELS, modeTheme } from "../lib/constants";
import { leadPrice } from "../lib/cart-lines";
import { useCart, modeCount } from "../store/cart";
import { useT } from "../lib/i18n";

export default function BrowseScreen() {
  const router = useRouter();
  const t = useT();
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const mode = useCart((s) => s.mode);
  const setMode = useCart((s) => s.setMode);
  const cartCount = useCart((s) => modeCount(s.items, s.mode));
  const insets = useSafeAreaInsets();
  const theme = modeTheme(mode);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [search, setSearch] = useState((params.q as string) || "");
  const [category, setCategory] = useState((params.category as string) || "");
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    apiGet<CategoryDTO[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(
    async (page: number, append: boolean) => {
      const myReq = ++reqId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const p = new URLSearchParams({ page: String(page), pageSize: "20" });
        if (search.trim()) p.set("search", search.trim());
        if (category) p.set("category", category);
        const data = await apiGet<{ products: ProductDTO[]; pagination: Pagination }>(
          `/api/products?${p.toString()}`
        );
        if (myReq === reqId.current) {
          setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
          setPagination(data.pagination);
        }
      } catch {
        // ignore; keep prior list
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [search, category]
  );

  useEffect(() => {
    const tmr = setTimeout(() => load(1, false), 300);
    return () => clearTimeout(tmr);
  }, [load]);

  const loadMore = () => {
    if (pagination && pagination.page < pagination.totalPages && !loadingMore) {
      load(pagination.page + 1, true);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: theme.main }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.main }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {mode === "WHOLESALE" ? t("wholesaleProducts") : t("retailProducts")}
        </Text>
        <Pressable onPress={() => router.push("/cart")} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="cart" size={24} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        {(["RETAIL", "WHOLESALE"] as const).map((m) => {
          const active = mode === m;
          const c = modeTheme(m);
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.toggle, active && { backgroundColor: c.main, borderColor: c.main }]}
            >
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                {m === "RETAIL" ? t("retail") : t("wholesale")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
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

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={category === ""} color={theme.main} onPress={() => setCategory("")} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={category === c.slug}
              color={theme.main}
              onPress={() => setCategory(c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.main} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>{t("noProducts")}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.main} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => {
            const price = leadPrice(item, mode);
            const showMrp = item.mrp > price;
            const oos = item.status === "OUT_OF_STOCK" || item.stockQuantity <= 0;
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })}
              >
                <View style={[styles.imageWrap, { backgroundColor: theme.light }]}>
                  <Text style={[styles.imageInitial, { color: theme.main }]}>{item.name.charAt(0).toUpperCase()}</Text>
                  {!!item.imageUrl && (
                    <Image source={item.imageUrl} style={styles.imageAbs} contentFit="cover" transition={150} />
                  )}
                  {oos && (
                    <View style={styles.oosOverlay}>
                      <Text style={styles.oosText}>{t("outOfStock")}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text numberOfLines={2} style={styles.name}>
                    {item.name}
                  </Text>
                  <Text style={[styles.price, { color: theme.main }]}>
                    {formatCurrency(price)}
                    <Text style={styles.unit}> / {UNIT_LABELS[item.unit]}</Text>
                  </Text>
                  {showMrp && (
                    <View style={styles.priceMeta}>
                      <Text style={styles.mrp}>MRP {formatCurrency(item.mrp)}</Text>
                      <Text style={[styles.savePill, { backgroundColor: theme.light, color: theme.main }]}>
                        Save {formatCurrency(item.mrp - price)}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function Chip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 10, gap: 8 },
  iconBtn: { padding: 6 },
  title: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  badge: { position: "absolute", top: -2, right: -4, backgroundColor: "#fff", borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: GREEN, fontSize: 11, fontWeight: "800" },
  toggleRow: { flexDirection: "row", gap: 8, padding: 10, justifyContent: "center" },
  toggle: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: "#e5e7eb" },
  toggleActive: { backgroundColor: GREEN, borderColor: GREEN },
  toggleText: { fontWeight: "700", color: "#6b7280" },
  toggleTextActive: { color: "#fff" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 12, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  chipsWrap: { height: 56, justifyContent: "center" },
  chips: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  chip: { paddingHorizontal: 18, height: 38, justifyContent: "center", borderRadius: 999, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: "#1f2937", fontWeight: "700", fontSize: 14 },
  chipTextActive: { color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40 },
  list: { padding: 10 },
  row: { gap: 10 },
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden", marginBottom: 10 },
  imageWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" },
  imageInitial: { fontSize: 44, fontWeight: "800", color: GREEN, opacity: 0.55 },
  imageAbs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  oosOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" },
  oosText: { backgroundColor: "#fff", color: "#374151", fontWeight: "700", fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  cardBody: { padding: 8, gap: 2 },
  name: { fontSize: 13, fontWeight: "600", minHeight: 34 },
  price: { fontSize: 15, fontWeight: "800", color: GREEN },
  unit: { fontSize: 11, fontWeight: "400", color: "#6b7280" },
  priceMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  mrp: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  savePill: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: 10, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
});
