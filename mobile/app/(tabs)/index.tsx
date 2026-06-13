import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, formatCurrency } from "../../lib/api";
import { CategoryDTO, ProductDTO } from "../../lib/types";
import { GREEN } from "../../lib/constants";
import { useCart } from "../../store/cart";
import { useT, useLocaleStore, LOCALES, LOCALE_LABELS } from "../../lib/i18n";
import { PromoBanner } from "../../components/promo-banner";

export default function HomeLanding() {
  const router = useRouter();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const setMode = useCart((s) => s.setMode);
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [popular, setPopular] = useState<ProductDTO[]>([]);

  useEffect(() => {
    apiGet<CategoryDTO[]>("/api/categories").then(setCategories).catch(() => {});
    apiGet<{ products: ProductDTO[] }>("/api/home-products").then((d) => setPopular(d.products)).catch(() => {});
  }, []);

  const openMode = (m: "RETAIL" | "WHOLESALE") => {
    setMode(m);
    router.push("/browse");
  };
  const openCategory = (slug: string) => {
    setMode("RETAIL");
    router.push({ pathname: "/browse", params: { category: slug } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: GREEN }} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand} numberOfLines={1}>Ganesh Trading Company</Text>
        <View style={styles.langRow}>
          {LOCALES.map((l) => (
            <Pressable key={l} onPress={() => setLocale(l)} style={[styles.lang, locale === l && styles.langActive]}>
              <Text style={[styles.langText, locale === l && styles.langTextActive]}>{LOCALE_LABELS[l]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {t("heroTitle1")} <Text style={{ color: GREEN }}>{t("heroTitle2")}</Text>
          </Text>
          <Text style={styles.heroSub}>{t("heroSubtitle")}</Text>
        </View>

        {/* Rotating promo banner */}
        <PromoBanner />

        {/* Mode cards */}
        <View style={styles.modeCol}>
          <ModeCard
            title={t("shopRetail")}
            desc={t("retailDesc")}
            delivery={t("retailDelivery")}
            deliveryIcon="flash"
            cta={t("startShopping")}
            badge={t("retailBadge")}
            badgeStyle="green"
            icon="bag-handle"
            onPress={() => openMode("RETAIL")}
          />
          <ModeCard
            title={t("shopWholesale")}
            desc={t("wholesaleDesc")}
            delivery={t("wholesaleDelivery")}
            deliveryIcon="today"
            cta={t("bulkPrices")}
            badge={t("wholesaleBadge")}
            badgeStyle="amber"
            icon="cube"
            onPress={() => openMode("WHOLESALE")}
          />
        </View>

        {/* Shop by category */}
        <Text style={styles.sectionTitle}>{t("shopByCategory")}</Text>
        <View style={styles.catGrid}>
          {categories.map((c) => (
            <Pressable key={c.id} style={styles.catTile} onPress={() => openCategory(c.slug)}>
              <View style={styles.catImageBox}>
                <Text style={styles.catInitial}>{c.name.charAt(0).toUpperCase()}</Text>
                {!!c.imageUrl && <Image source={c.imageUrl} style={styles.catImg} contentFit="cover" />}
              </View>
              <Text numberOfLines={2} style={styles.catName}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Popular products */}
        <View style={styles.popularHead}>
          <Text style={styles.sectionTitle}>{t("popular")}</Text>
          <Pressable onPress={() => openMode("RETAIL")}>
            <Text style={styles.viewAll}>{t("viewAll")} →</Text>
          </Pressable>
        </View>
        <View style={styles.prodGrid}>
          {popular.map((item) => {
            const showMrp = item.mrp > item.retailPrice;
            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })}
              >
                <View style={styles.imageWrap}>
                  <Text style={styles.imageInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                  {!!item.imageUrl && (
                    <Image source={item.imageUrl} style={styles.imageAbs} contentFit="cover" transition={150} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text numberOfLines={2} style={styles.name}>
                    {item.name}
                  </Text>
                  <Text style={styles.price}>{formatCurrency(item.retailPrice)}</Text>
                  {showMrp && (
                    <View style={styles.priceMeta}>
                      <Text style={styles.mrp}>MRP {formatCurrency(item.mrp)}</Text>
                      <Text style={styles.savePill}>Save {formatCurrency(item.mrp - item.retailPrice)}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function ModeCard({
  title,
  desc,
  delivery,
  deliveryIcon,
  cta,
  badge,
  badgeStyle,
  icon,
  onPress,
}: {
  title: string;
  desc: string;
  delivery: string;
  deliveryIcon: any;
  cta: string;
  badge: string;
  badgeStyle: "green" | "amber";
  icon: any;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.modeCard} onPress={onPress}>
      <View style={[styles.badge, badgeStyle === "green" ? styles.badgeGreen : styles.badgeAmber]}>
        <Text style={[styles.badgeText, { color: badgeStyle === "green" ? "#fff" : "#92400e" }]}>{badge}</Text>
      </View>
      <View style={styles.modeIcon}>
        <Ionicons name={icon} size={22} color={GREEN} />
      </View>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeDesc}>{desc}</Text>
      <View style={styles.deliveryPill}>
        <Ionicons name={deliveryIcon} size={13} color={GREEN} />
        <Text style={styles.deliveryText}>{delivery}</Text>
      </View>
      <Text style={styles.modeCta}>{cta} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: GREEN,
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
  langTextActive: { color: GREEN },

  hero: { backgroundColor: "#f0fdf4", paddingHorizontal: 18, paddingVertical: 12, alignItems: "center" },
  heroTitle: { fontSize: 20, fontWeight: "900", textAlign: "center", color: "#111827" },
  heroSub: { color: "#6b7280", textAlign: "center", marginTop: 5, fontSize: 12 },

  modeCol: { padding: 12, gap: 10 },
  modeCard: {
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  deliveryPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f0fdf4", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  deliveryText: { color: GREEN, fontWeight: "700", fontSize: 12 },
  badge: { position: "absolute", top: 10, right: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeGreen: { backgroundColor: GREEN },
  badgeAmber: { backgroundColor: "#fde68a" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  modeIcon: { width: 42, height: 42, borderRadius: 999, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  modeTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modeDesc: { color: "#6b7280", fontSize: 12, marginTop: 1 },
  modeCta: { color: GREEN, fontWeight: "800", fontSize: 14, marginTop: 6 },

  sectionTitle: { fontSize: 18, fontWeight: "800", paddingHorizontal: 14, marginTop: 8, marginBottom: 10 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10 },
  catTile: { width: "33.33%", padding: 6 },
  catImageBox: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  catInitial: { fontSize: 40, fontWeight: "800", color: GREEN, opacity: 0.55 },
  catImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  catName: { textAlign: "center", fontSize: 12, fontWeight: "600", marginTop: 6 },

  popularHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 14 },
  viewAll: { color: GREEN, fontWeight: "800", fontSize: 13 },
  prodGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, gap: 0 },
  card: { width: "50%", padding: 5 },
  imageWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  imageInitial: { fontSize: 44, fontWeight: "800", color: GREEN, opacity: 0.55 },
  imageAbs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  cardBody: { paddingTop: 6, gap: 2 },
  name: { fontSize: 13, fontWeight: "600", minHeight: 34 },
  price: { fontSize: 15, fontWeight: "800", color: GREEN },
  priceMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  mrp: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  savePill: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: 10, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
});
