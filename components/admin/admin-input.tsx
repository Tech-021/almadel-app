import { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type AdminInputProps = ComponentProps<typeof TextInput> & {
  label: string;
};

export function AdminInput({ label, ...props }: AdminInputProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 13,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    minHeight: 50,
    paddingHorizontal: 13,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },
});
