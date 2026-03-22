import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

/** Entry point — redirect based on auth state. */
export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2d2d2d" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return <Redirect href={user ? "/(app)/sessions" : "/(auth)/login"} />;
}
