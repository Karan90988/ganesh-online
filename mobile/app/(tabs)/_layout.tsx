import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { modeTheme } from "../../lib/constants";
import { useT } from "../../lib/i18n";
import { useCart, modeCount } from "../../store/cart";

export default function TabLayout() {
  const t = useT();
  const mode = useCart((s) => s.mode);
  const cartCount = useCart((s) => modeCount(s.items, s.mode));
  const theme = modeTheme(mode);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.65)",
        tabBarStyle: { backgroundColor: theme.main, borderTopColor: theme.dark },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("cart"),
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: t("tabContact"),
          tabBarIcon: ({ color, size }) => <Ionicons name="call" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
