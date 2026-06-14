import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GREEN } from "../lib/constants";

/** Quantity control with +/- AND a typeable number field. `onChange` receives
 *  the new quantity (the parent decides removal when below min). */
export function QtyInput({
  value,
  min,
  unitLabel,
  onChange,
  dark = false,
  block = false,
  color = GREEN,
}: {
  value: number;
  min: number;
  unitLabel?: string;
  onChange: (qty: number) => void;
  dark?: boolean;
  block?: boolean;
  color?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const onType = (text: string) => {
    const v = text.replace(/[^0-9]/g, "");
    setDraft(v);
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= min) onChange(n);
  };
  const onBlur = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n) || n < min) setDraft(String(value));
  };

  const fg = dark ? "#fff" : "#111827";
  return (
    <View style={[styles.wrap, dark ? [styles.wrapDark, { backgroundColor: color }] : styles.wrapLight, block && styles.block]}>
      <Pressable style={styles.btn} onPress={() => onChange(value - 1)} hitSlop={6}>
        <Text style={[styles.sign, { color: fg }]}>−</Text>
      </Pressable>
      <View style={[styles.middle, dark ? styles.boxDark : [styles.boxLight, { borderColor: color }]]}>
        <Ionicons name="pencil" size={11} color={dark ? "rgba(255,255,255,0.9)" : color} style={{ marginRight: 3 }} />
        <TextInput
          value={draft}
          onChangeText={onType}
          onBlur={onBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          style={[styles.input, { color: fg }]}
        />
        {!!unitLabel && <Text style={[styles.unit, { color: dark ? "rgba(255,255,255,0.9)" : "#6b7280" }]}>{unitLabel}</Text>}
      </View>
      <Pressable style={styles.btn} onPress={() => onChange(value + 1)} hitSlop={6}>
        <Text style={[styles.sign, { color: fg }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: 10 },
  block: { alignSelf: "stretch", justifyContent: "space-between", height: 52 },
  wrapLight: { borderWidth: 2, borderColor: "#e5e7eb" },
  wrapDark: { backgroundColor: "#16a34a" },
  btn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sign: { fontSize: 22, fontWeight: "800" },
  middle: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  boxLight: { borderWidth: 1.5, borderColor: GREEN, backgroundColor: "#f0fdf4" },
  boxDark: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.22)" },
  input: { fontWeight: "800", fontSize: 16, textAlign: "center", minWidth: 26, padding: 0 },
  unit: { fontSize: 12, marginLeft: 3 },
});
