import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSessions } from "@/hooks/useSessions";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/context/AuthContext";
import { useNetInfo } from "@/hooks/useNetInfo";
import { getPendingSessions } from "@/lib/db";
import { syncLocalSession } from "@/lib/sync";
import type { SyncProgress } from "@/lib/sync";

export default function SessionsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sessions, isLoading, error, refresh } = useSessions();
  const { isOnline } = useNetInfo();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Refresh whenever this tab comes back into focus
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const pendingCount = sessions.filter((s) => s.isPending).length;

  /** Sync all pending sessions — triggered manually by the user. */
  async function handleSyncAll() {
    if (!isOnline) {
      Alert.alert("Offline", "Keine Verbindung. Bitte versuche es später noch einmal.");
      return;
    }
    setSyncing(true);
    setSyncMessage("Ausstehende Begehungen synchronisieren …");
    try {
      const pending = await getPendingSessions();
      for (let i = 0; i < pending.length; i++) {
        const s = pending[i];
        setSyncMessage(`${s.name} (${i + 1}/${pending.length}) …`);
        const onProgress = (p: SyncProgress) => setSyncMessage(p.message);
        await syncLocalSession(s.id, [], new Date().toISOString(), onProgress);
      }
      setSyncMessage(null);
      await refresh();
    } catch (err) {
      setSyncMessage(null);
      Alert.alert(
        "Sync fehlgeschlagen",
        err instanceof Error ? err.message : "Unbekannter Fehler."
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Begehungen</Text>
          {user?.name ? (
            <Text style={styles.headerSub}>{user.name}</Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {/* Offline indicator */}
          {isOnline === false && (
            <View style={styles.offlinePill}>
              <Ionicons name="cloud-offline-outline" size={13} color="#f97316" />
              <Text style={styles.offlinePillText}>Offline</Text>
            </View>
          )}
          {/* Sync button — only when there are pending sessions and we're online */}
          {pendingCount > 0 && isOnline && (
            <TouchableOpacity
              style={[styles.iconButton, styles.syncButton]}
              onPress={handleSyncAll}
              disabled={syncing}
            >
              {syncing
                ? <ActivityIndicator color="#f97316" size="small" />
                : <Ionicons name="cloud-upload-outline" size={20} color="#f97316" />}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push({ pathname: "/(app)/session/new" })}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync status bar */}
      {syncing && syncMessage && (
        <View style={styles.syncBar}>
          <ActivityIndicator color="#f97316" size="small" />
          <Text style={styles.syncBarText} numberOfLines={1}>{syncMessage}</Text>
        </View>
      )}

      {/* Pending banner */}
      {pendingCount > 0 && !syncing && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={isOnline ? handleSyncAll : undefined}
          activeOpacity={isOnline ? 0.7 : 1}
        >
          <Ionicons name="time-outline" size={16} color="#f97316" />
          <Text style={styles.pendingBannerText}>
            {pendingCount} {pendingCount === 1 ? "Begehung" : "Begehungen"} ausstehend
            {isOnline ? " — Tippen zum Synchronisieren" : " — wartet auf Verbindung"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {isLoading && sessions.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2d2d2d" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={36} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onPress={() =>
                router.push({ pathname: "/(app)/session/[id]", params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="map-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Noch keine Begehungen</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push({ pathname: "/(app)/session/new" })}
              >
                <Text style={styles.createButtonText}>Session erstellen</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2d2d2d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offlinePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f97316",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  syncButton: {
    backgroundColor: "rgba(249,115,22,0.15)",
  },
  syncBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  syncBarText: {
    fontSize: 13,
    color: "#f97316",
    flex: 1,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  pendingBannerText: {
    fontSize: 13,
    color: "#f97316",
    flex: 1,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2d2d2d",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2d2d2d",
    borderRadius: 8,
    marginTop: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
