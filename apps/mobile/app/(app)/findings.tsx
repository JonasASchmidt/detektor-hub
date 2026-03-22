import { View, Text, StyleSheet } from "react-native";

/** Placeholder — will be replaced with the full findings list screen. */
export default function FindingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Funde — kommt bald</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { color: "#2d2d2d", fontSize: 16 },
});
