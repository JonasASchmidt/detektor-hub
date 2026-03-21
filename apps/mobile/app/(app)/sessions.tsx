import { View, Text, StyleSheet } from "react-native";

/** Placeholder — will be replaced with the full sessions list screen. */
export default function SessionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Feldsessions — kommt bald</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { color: "#2d2d2d", fontSize: 16 },
});
