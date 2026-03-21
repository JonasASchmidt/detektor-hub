import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SessionListItem } from "@/hooks/useSessions";

interface SessionCardProps {
  session: SessionListItem;
  onPress: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  const dateLabel = session.dateTo
    ? `${formatDate(session.dateFrom)} – ${formatDate(session.dateTo)}`
    : formatDate(session.dateFrom);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
          {/* Orange clock badge for sessions not yet synced */}
          {session.isPending && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={11} color="#f97316" />
              <Text style={styles.pendingText}>ausstehend</Text>
            </View>
          )}
        </View>

        {session.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {session.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color="#888" />
            <Text style={styles.metaText}>{dateLabel}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="search-outline" size={13} color="#888" />
            <Text style={[styles.metaText, session.isPending && styles.metaTextPending]}>
              {session.findCount} {session.findCount === 1 ? "Fund" : "Funde"}
              {session.isPending ? " lokal" : ""}
            </Text>
          </View>

          {session.zone ? (
            <View style={styles.metaItem}>
              <Ionicons name="map-outline" size={13} color="#888" />
              <Text style={styles.metaText} numberOfLines={1}>
                {session.zone.name}
              </Text>
            </View>
          ) : null}

          {session.detector ? (
            <View style={styles.metaItem}>
              <Ionicons name="radio-outline" size={13} color="#888" />
              <Text style={styles.metaText} numberOfLines={1}>
                {session.detector.company} {session.detector.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  main: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fff7ed",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#f97316",
  },
  description: {
    fontSize: 13,
    color: "#888",
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#888",
  },
  metaTextPending: {
    color: "#f97316",
  },
});
