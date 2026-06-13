import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { apiGet } from "../lib/api";
import { GREEN } from "../lib/constants";
import { useT } from "../lib/i18n";

/** Auto-rotating promo strip. Uses admin-managed messages from /api/banners,
 *  falling back to the built-in (translated) defaults if none are set. */
export function PromoBanner() {
  const t = useT();
  const defaults = [t("promo1"), t("promo2"), t("promo3")];
  const [apiMsgs, setApiMsgs] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    apiGet<{ id: string; text: string }[]>("/api/banners")
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) setApiMsgs(rows.map((b) => b.text));
      })
      .catch(() => {});
  }, []);

  const messages = apiMsgs.length ? apiMsgs : defaults;
  const count = messages.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setIndex((p) => (p + 1) % count);
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      });
    }, 1500);
    return () => clearInterval(id);
  }, [count, opacity]);

  if (count === 0) return null;

  return (
    <View style={styles.bar}>
      <Animated.Text style={[styles.text, { opacity }]} numberOfLines={1}>
        {messages[index % count]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
