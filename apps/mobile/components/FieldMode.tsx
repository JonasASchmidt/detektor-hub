/**
 * FieldMode — offline-first field experience.
 *
 * All writes (sessions, finds, images) go to local SQLite first via lib/db.ts.
 * Nothing is sent to the server during the session. When the user taps
 * "Begehung beenden", syncLocalSession() / syncOrphanFinds() flushes
 * everything in one go, with a progress overlay.
 *
 * Session ID conventions:
 *   - Sessions created here have a 'local_xxx' ID until synced.
 *   - When resuming an already-synced session (initialSession.id is a real
 *     UUID), finds are stored with the server ID as session_id in SQLite.
 *     syncOrphanFinds() handles the upload in that case.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { apiFetch } from "@/lib/api";
import { applyNamingScheme } from "@/lib/namingScheme";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useNetInfo } from "@/hooks/useNetInfo";
import {
  createLocalSession,
  createLocalFind,
  cacheImageLocally,
  linkImageToFind,
  getPendingSessions,
  saveSessionRoute,
} from "@/lib/db";
import { syncLocalSession, syncOrphanFinds, SyncProgress } from "@/lib/sync";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveSession {
  id: string; // 'local_xxx' or server UUID
  name: string;
  namingScheme: string | null;
  isLocalOnly: boolean; // true = created offline, false = synced session being resumed
}

interface OpenSession {
  id: string;
  name: string;
  namingScheme: string | null;
  isLocalOnly: boolean;
  findCount: number;
}

/** A photo captured during the session but not yet submitted with a find. */
interface PendingPhoto {
  /** Camera temp URI — used for thumbnail display only. */
  thumbUri: string;
  /** Permanent path in documentDirectory — used for upload at sync. */
  localPath: string;
}

interface GpsPoint {
  lat: number;
  lng: number;
  accuracy: number;
}

interface Props {
  /** Pre-select an existing session on mount (used by session/[id].tsx). */
  initialSession?: { id: string; name: string; namingScheme: string | null };
}

// ─── GPS single-point fetch ───────────────────────────────────────────────────

async function fetchCurrentPosition(): Promise<GpsPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("GPS-Berechtigung verweigert.");
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    accuracy: Math.round(loc.coords.accuracy ?? 0),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FieldMode({ initialSession }: Props) {
  const router = useRouter();
  const { isOnline } = useNetInfo();

  // ── Session state ──────────────────────────────────────────────────────────
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    initialSession
      ? {
          id: initialSession.id,
          name: initialSession.name,
          namingScheme: initialSession.namingScheme,
          isLocalOnly: initialSession.id.startsWith("local_"),
        }
      : null
  );
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionScheme, setNewSessionScheme] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  // ── GPS tracking ──────────────────────────────────────────────────────────
  const { isTracking, points, accuracy: trackAccuracy, error: trackError, startTracking, stopTracking } =
    useLocationTracker();

  // ── Find form state ───────────────────────────────────────────────────────
  const [findName, setFindName] = useState("");
  const [description, setDescription] = useState("");
  const [conductivity, setConductivity] = useState("");
  const [gps, setGps] = useState<GpsPoint | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [cachingPhoto, setCachingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitName, setLastSubmitName] = useState<string | null>(null);
  const [sessionFindCount, setSessionFindCount] = useState(0);

  // ── Sync overlay state ────────────────────────────────────────────────────
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // ── Auto-name from naming scheme ──────────────────────────────────────────
  const autoName = useMemo(() => {
    if (!activeSession?.namingScheme) return null;
    return applyNamingScheme(activeSession.namingScheme, activeSession.name, sessionFindCount + 1);
  }, [activeSession, sessionFindCount]);

  // ─── Load resumable sessions ───────────────────────────────────────────────

  const loadOpenSessions = useCallback(async () => {
    try {
      // Local pending sessions (created offline or not yet ended)
      const local = await getPendingSessions();
      const localMapped: OpenSession[] = local.map((s) => ({
        id: s.id,
        name: s.name,
        namingScheme: s.namingScheme,
        isLocalOnly: true,
        findCount: s.findCount,
      }));

      // Server sessions without dateTo (open, already synced)
      // Only fetch if online; silently skip if offline.
      let serverSessions: OpenSession[] = [];
      if (isOnline) {
        const res = await apiFetch("/api/mobile/sessions?open=true");
        if (res.ok) {
          const { fieldSessions } = await res.json();
          serverSessions = (fieldSessions as Array<{ id: string; name: string; namingScheme: string | null; findings: unknown[] }>)
            // Exclude any that are already in local (shouldn't happen, but guard against duplicates)
            .filter((s) => !local.some((l) => l.serverId === s.id))
            .map((s) => ({
              id: s.id,
              name: s.name,
              namingScheme: s.namingScheme ?? null,
              isLocalOnly: false,
              findCount: Array.isArray(s.findings) ? s.findings.length : 0,
            }));
        }
      }

      setOpenSessions([...localMapped, ...serverSessions]);
    } catch {
      // Non-critical — show what we have
    }
  }, [isOnline]);

  useEffect(() => {
    loadOpenSessions();
  }, [loadOpenSessions]);

  // ─── Session management ────────────────────────────────────────────────────

  async function handleCreateSession() {
    if (!newSessionName.trim()) {
      Alert.alert("Fehler", "Bitte einen Namen eingeben.");
      return;
    }
    setCreatingSession(true);
    try {
      const session = await createLocalSession({
        name: newSessionName.trim(),
        namingScheme: newSessionScheme.trim() || null,
        dateFrom: new Date().toISOString(),
      });
      setActiveSession({
        id: session.id,
        name: session.name,
        namingScheme: session.namingScheme,
        isLocalOnly: true,
      });
      setNewSessionName("");
      setNewSessionScheme("");
      setShowSessionPicker(false);
      setSessionFindCount(0);
    } catch {
      Alert.alert("Fehler", "Begehung konnte nicht erstellt werden.");
    } finally {
      setCreatingSession(false);
    }
  }

  function handleSelectSession(s: OpenSession) {
    setActiveSession({
      id: s.id,
      name: s.name,
      namingScheme: s.namingScheme,
      isLocalOnly: s.isLocalOnly,
    });
    setShowSessionPicker(false);
    setSessionFindCount(0);
  }

  async function handleEndSession() {
    Alert.alert(
      "Begehung beenden",
      sessionFindCount > 0
        ? `${sessionFindCount} Funde werden jetzt synchronisiert.`
        : "Möchtest du die Begehung beenden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Beenden & Sync",
          style: "destructive",
          onPress: () => void runEndSession(),
        },
      ]
    );
  }

  async function runEndSession() {
    if (!activeSession) return;

    // Stop GPS tracking and capture the route points
    const routePoints = isTracking ? stopTracking() : points;
    const dateTo = new Date().toISOString();

    // Persist route to SQLite for local sessions so it survives a crash
    if (activeSession.isLocalOnly) {
      await saveSessionRoute(activeSession.id, routePoints).catch(() => {});
    }

    // ── Attempt sync if online ──────────────────────────────────────────────
    if (isOnline === false) {
      // Offline — data is already in SQLite, just navigate back
      Alert.alert(
        "Offline",
        "Keine Verbindung. Deine Funde sind lokal gespeichert und werden synchronisiert sobald du wieder online bist."
      );
      resetSessionState();
      router.replace("/(app)/sessions" as never);
      return;
    }

    setSyncProgress({ message: "Vorbereiten …", fraction: 0 });
    try {
      if (activeSession.isLocalOnly) {
        await syncLocalSession(activeSession.id, routePoints, dateTo, setSyncProgress);
      } else {
        await syncOrphanFinds(activeSession.id, setSyncProgress);
        // PATCH dateTo on the server session
        await apiFetch(`/api/mobile/sessions/${activeSession.id}`, {
          method: "PATCH",
          body: JSON.stringify({ dateTo }),
        });
      }
      setSyncProgress(null);
      resetSessionState();
      router.replace("/(app)/sessions" as never);
    } catch (err) {
      console.error("[FieldMode] sync failed:", err);
      setSyncProgress(null);
      Alert.alert(
        "Sync fehlgeschlagen",
        `${err instanceof Error ? err.message : "Unbekannter Fehler."}\n\nDeine Funde sind lokal gespeichert. Du kannst sie später aus der Session-Liste synchronisieren.`,
        [
          {
            text: "Trotzdem beenden",
            style: "destructive",
            onPress: () => {
              resetSessionState();
              router.replace("/(app)/sessions" as never);
            },
          },
          { text: "Zurück", style: "cancel" },
        ]
      );
    }
  }

  function resetSessionState() {
    setActiveSession(null);
    setGps(null);
    setPendingPhotos([]);
    setLastSubmitName(null);
    setSessionFindCount(0);
  }

  // ─── GPS ──────────────────────────────────────────────────────────────────

  async function handleFetchGps() {
    setGpsLoading(true);
    try {
      const point = await fetchCurrentPosition();
      setGps(point);
    } catch (err) {
      Alert.alert("GPS-Fehler", err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setGpsLoading(false);
    }
  }

  // ─── Photos ───────────────────────────────────────────────────────────────

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Berechtigung", "Kamerazugriff wurde verweigert.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setCachingPhoto(true);
    try {
      // Copy from temp camera URI to permanent app storage immediately.
      // The file is now safe even if the app is killed mid-session.
      // cacheImageLocally is synchronous (expo-file-system v19 File API).
      const localPath = cacheImageLocally(asset.uri);
      setPendingPhotos((prev) => [...prev, { thumbUri: asset.uri, localPath }]);
    } catch {
      Alert.alert("Fehler", "Foto konnte nicht gespeichert werden.");
    } finally {
      setCachingPhoto(false);
    }
  }

  // ─── Submit find ──────────────────────────────────────────────────────────

  async function handleSubmitFind() {
    if (!gps) {
      Alert.alert("Fehler", "Bitte zuerst GPS-Koordinaten abrufen.");
      return;
    }
    if (!activeSession) return;

    setSubmitting(true);
    try {
      const resolvedName = findName.trim() || autoName || null;

      // Write find to SQLite — no network needed
      const findId = await createLocalFind({
        sessionId: activeSession.id,
        name: resolvedName,
        lat: gps.lat,
        lng: gps.lng,
        description: description.trim() || null,
        conductivity: conductivity ? parseInt(conductivity, 10) : null,
        foundAt: new Date().toISOString(),
      });

      // Link cached photos to this find
      for (const photo of pendingPhotos) {
        await linkImageToFind(findId, photo.localPath);
      }

      setLastSubmitName(resolvedName ?? "");
      setSessionFindCount((c) => c + 1);
      // Reset form but keep GPS for rapid successive finds
      setFindName("");
      setDescription("");
      setConductivity("");
      setPendingPhotos([]);
    } catch {
      Alert.alert("Fehler", "Fund konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Sync progress overlay */}
      <Modal visible={syncProgress !== null} transparent animationType="fade">
        <View style={styles.syncOverlay}>
          <View style={styles.syncCard}>
            <ActivityIndicator color="#2d2d2d" size="large" />
            <Text style={styles.syncMessage}>{syncProgress?.message ?? ""}</Text>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressBar, { width: `${Math.round((syncProgress?.fraction ?? 0) * 100)}%` }]}
              />
            </View>
            <Text style={styles.syncHint}>Bitte warten — nicht schließen</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeSession ? activeSession.name : "Felderfassung"}
          </Text>
          <View style={styles.headerSubRow}>
            {isTracking && (
              <View style={styles.trackingBadge}>
                <Ionicons name="radio" size={10} color="#22c55e" />
                <Text style={styles.trackingText}>{points.length} Pkt</Text>
                {trackAccuracy !== null && (
                  <Text style={styles.trackingAccuracy}>±{trackAccuracy}m</Text>
                )}
              </View>
            )}
            {/* Offline/online indicator */}
            {isOnline === false && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline-outline" size={10} color="#f97316" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
            {activeSession && sessionFindCount > 0 && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={10} color="#888" />
                <Text style={styles.pendingText}>{sessionFindCount} lokal</Text>
              </View>
            )}
          </View>
        </View>

        {activeSession ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, isTracking && styles.headerBtnActive]}
              onPress={isTracking ? () => stopTracking() : startTracking}
            >
              <Ionicons
                name={isTracking ? "stop-circle-outline" : "navigate-outline"}
                size={18}
                color={isTracking ? "#22c55e" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleEndSession}>
              <Ionicons name="close-circle-outline" size={18} color="#f87171" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {trackError ? (
        <View style={styles.trackingError}>
          <Text style={styles.trackingErrorText}>{trackError}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Session picker / creator ── */}
          {!activeSession || showSessionPicker ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {activeSession ? "Session wechseln" : "Begehung starten"}
              </Text>

              {/* Create new session */}
              <TextInput
                style={styles.input}
                placeholder="Name der Begehung *"
                placeholderTextColor="#999"
                value={newSessionName}
                onChangeText={setNewSessionName}
              />
              <TextInput
                style={styles.input}
                placeholder="Namensschema (optional, z. B. {session}-{n:03})"
                placeholderTextColor="#999"
                value={newSessionScheme}
                onChangeText={setNewSessionScheme}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryButton, creatingSession && styles.buttonDisabled]}
                onPress={handleCreateSession}
                disabled={creatingSession}
              >
                {creatingSession
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryButtonText}>Neue Begehung starten</Text>}
              </TouchableOpacity>

              {/* Select existing open session */}
              {openSessions.length > 0 && (
                <View style={styles.sessionList}>
                  <Text style={styles.sessionListLabel}>Offene Begehungen</Text>
                  {openSessions.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.sessionItem,
                        activeSession?.id === s.id && styles.sessionItemActive,
                      ]}
                      onPress={() => handleSelectSession(s)}
                    >
                      <Ionicons name="map-outline" size={16} color="#888" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionItemName}>{s.name}</Text>
                        {s.namingScheme ? (
                          <Text style={styles.sessionItemScheme}>Schema: {s.namingScheme}</Text>
                        ) : null}
                        {s.findCount > 0 ? (
                          <Text style={styles.sessionItemPending}>
                            {s.isLocalOnly ? `${s.findCount} lokal ausstehend` : `${s.findCount} Funde`}
                          </Text>
                        ) : null}
                      </View>
                      {s.isLocalOnly && (
                        <View style={styles.localBadge}>
                          <Ionicons name="time-outline" size={12} color="#f97316" />
                        </View>
                      )}
                      {activeSession?.id === s.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#2d2d2d" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {activeSession && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowSessionPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ── Active session: quick-find form ── */
            <View style={styles.section}>
              {/* Change session */}
              <TouchableOpacity
                style={styles.changeSessionButton}
                onPress={() => setShowSessionPicker(true)}
              >
                <Ionicons name="map-outline" size={16} color="#2d2d2d" />
                <Text style={styles.changeSessionText}>{activeSession.name}</Text>
                <Ionicons name="chevron-down" size={14} color="#888" />
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Fund erfassen</Text>

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder={autoName ?? "Fund benennen …"}
                placeholderTextColor="#999"
                value={findName}
                onChangeText={setFindName}
              />
              {autoName && !findName && (
                <Text style={styles.hint}>
                  Leer lassen für:{" "}
                  <Text style={{ fontWeight: "600", color: "#444" }}>{autoName}</Text>
                </Text>
              )}

              {/* GPS */}
              <Text style={styles.label}>Standort</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1 }, gpsLoading && styles.buttonDisabled]}
                  onPress={handleFetchGps}
                  disabled={gpsLoading}
                >
                  {gpsLoading
                    ? <ActivityIndicator color="#2d2d2d" size="small" />
                    : <Ionicons name="locate-outline" size={18} color="#2d2d2d" />}
                  <Text style={styles.secondaryButtonText}>
                    {gps ? "Aktualisieren" : "GPS abrufen"}
                  </Text>
                </TouchableOpacity>
                {gps && (
                  <View style={styles.gpsInfo}>
                    <Ionicons name="location" size={14} color="#22c55e" />
                    <Text style={styles.gpsText}>
                      {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                    </Text>
                    <Text style={styles.gpsAccuracy}>±{gps.accuracy}m</Text>
                  </View>
                )}
              </View>

              {/* Photos */}
              <Text style={styles.label}>Fotos</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, cachingPhoto && styles.buttonDisabled]}
                  onPress={handleTakePhoto}
                  disabled={cachingPhoto}
                >
                  {cachingPhoto
                    ? <ActivityIndicator color="#2d2d2d" size="small" />
                    : <Ionicons name="camera-outline" size={18} color="#2d2d2d" />}
                  <Text style={styles.secondaryButtonText}>Foto aufnehmen</Text>
                </TouchableOpacity>
                {pendingPhotos.map((photo, idx) => (
                  <View key={photo.localPath} style={styles.thumb}>
                    <Image source={{ uri: photo.thumbUri }} style={styles.thumbImg} />
                    <TouchableOpacity
                      style={styles.thumbRemove}
                      onPress={() =>
                        setPendingPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Conductivity */}
              <Text style={styles.label}>Leitfähigkeit</Text>
              <TextInput
                style={styles.input}
                placeholder="z. B. 72"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={conductivity}
                onChangeText={setConductivity}
              />

              {/* Description */}
              <Text style={styles.label}>Beschreibung</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Erste Einschätzung, Bodenbeschaffenheit, Besonderheiten …"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              {/* Last submit feedback */}
              {lastSubmitName !== null && (
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.successText}>
                    Lokal gespeichert:{" "}
                    <Text style={{ fontWeight: "600" }}>
                      {lastSubmitName || "(kein Name)"}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.submitButton,
                  (!gps || submitting) && styles.buttonDisabled,
                ]}
                onPress={handleSubmitFind}
                disabled={!gps || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryButtonText}>Fund lokal speichern</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  // Sync overlay
  syncOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  syncCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "80%",
    alignItems: "center",
    gap: 16,
  },
  syncMessage: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", textAlign: "center" },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: "#2d2d2d", borderRadius: 3 },
  syncHint: { fontSize: 12, color: "#aaa" },

  // Header
  header: {
    backgroundColor: "#2d2d2d",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" },
  trackingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  trackingText: { fontSize: 11, color: "#22c55e" },
  trackingAccuracy: { fontSize: 11, color: "#888" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  offlineText: { fontSize: 11, color: "#f97316" },
  pendingBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  pendingText: { fontSize: 11, color: "#aaa" },
  headerActions: { flexDirection: "row", gap: 6 },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnActive: { backgroundColor: "rgba(34,197,94,0.15)" },
  trackingError: { backgroundColor: "#fef2f2", paddingHorizontal: 16, paddingVertical: 6 },
  trackingErrorText: { fontSize: 12, color: "#ef4444" },

  // Scroll / section
  scroll: { padding: 16, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginTop: 4 },
  hint: { fontSize: 12, color: "#888" },

  // Inputs
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  textarea: { height: 80, textAlignVertical: "top" },

  // Buttons
  primaryButton: {
    backgroundColor: "#2d2d2d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  submitButton: { marginTop: 8 },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  secondaryButtonText: { fontSize: 14, color: "#2d2d2d", fontWeight: "500" },
  buttonDisabled: { opacity: 0.5 },
  cancelButton: { alignItems: "center", paddingVertical: 8 },
  cancelButtonText: { color: "#888", fontSize: 14 },

  // GPS
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  gpsInfo: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  gpsText: {
    fontSize: 12,
    color: "#22c55e",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  gpsAccuracy: { fontSize: 12, color: "#888" },

  // Photos
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  thumb: { position: "relative" },
  thumbImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#eee" },
  thumbRemove: { position: "absolute", top: -6, right: -6 },

  // Session picker
  changeSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 4,
  },
  changeSessionText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#2d2d2d" },
  sessionList: { gap: 6, marginTop: 8 },
  sessionListLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  sessionItemActive: { borderColor: "#2d2d2d", backgroundColor: "#f9f9f9" },
  sessionItemName: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  sessionItemScheme: { fontSize: 12, color: "#888", marginTop: 1 },
  sessionItemPending: { fontSize: 12, color: "#f97316", marginTop: 1 },
  localBadge: { padding: 2 },

  // Success feedback
  successRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  successText: { fontSize: 12, color: "#22c55e" },
});
