import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Placeholder — session creation screen, to be built next. */
export default function NewSessionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Neue Begehung — kommt bald</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: { color: "#2d2d2d", fontSize: 16 },
});
