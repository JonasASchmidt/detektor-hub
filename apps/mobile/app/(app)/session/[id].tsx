import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { apiFetch } from "@/lib/api";
import FieldMode from "@/components/FieldMode";

interface SessionData {
  id: string;
  name: string;
  namingScheme: string | null;
}

/** Loads the session by ID and opens FieldMode with it pre-selected. */
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/field-sessions/${id}`);
        if (!res.ok) throw new Error();
        const { fieldSession } = await res.json();
        setSession({ id: fieldSession.id, name: fieldSession.name, namingScheme: fieldSession.namingScheme ?? null });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2d2d2d" />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Session nicht gefunden.</Text>
      </View>
    );
  }

  return <FieldMode initialSession={session} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  errorText: { color: "#888", fontSize: 15 },
});
