import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MobileSession } from "@/hooks/useSessions";

interface SessionCardProps {
  session: MobileSession;
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

  const findingCount = session.findings.length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>{session.name}</Text>

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
            <Text style={styles.metaText}>
              {findingCount} {findingCount === 1 ? "Fund" : "Funde"}
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
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
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
});
