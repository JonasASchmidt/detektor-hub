/**
 * Session detail screen — loads a session by ID and opens FieldMode.
 *
 * ID conventions:
 *   - 'local_xxx'  → session is pending in SQLite, fetch from local DB
 *   - anything else → session is synced, fetch from /api/mobile/sessions/:id
 */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { apiFetch } from "@/lib/api";
import { getLocalSession } from "@/lib/db";
import FieldMode from "@/components/FieldMode";

interface SessionData {
  id: string;
  name: string;
  namingScheme: string | null;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (id.startsWith("local_")) {
          // ── Pending local session ─────────────────────────────────────────
          const local = await getLocalSession(id);
          if (!local) throw new Error("Nicht gefunden.");
          setSession({
            id: local.id,
            name: local.name,
            namingScheme: local.namingScheme,
          });
        } else {
          // ── Synced server session ─────────────────────────────────────────
          const res = await apiFetch(`/api/mobile/sessions/${id}`);
          if (!res.ok) throw new Error();
          const { fieldSession } = await res.json();
          setSession({
            id: fieldSession.id,
            name: fieldSession.name,
            namingScheme: fieldSession.namingScheme ?? null,
          });
        }
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
