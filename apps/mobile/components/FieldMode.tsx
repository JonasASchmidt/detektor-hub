/**
 * FieldMode — the core mobile field experience.
 *
 * Equivalent to apps/web/app/field — combines:
 *  - Session selector / creator
 *  - GPS route tracking
 *  - Quick find form (name, GPS, photo, conductivity, description)
 *
 * Used by both session/new.tsx (create new) and session/[id].tsx (resume existing).
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { apiFetch, apiPost, apiUpload } from "@/lib/api";
import { applyNamingScheme } from "@/lib/namingScheme";
import { useLocationTracker } from "@/hooks/useLocationTracker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenSession {
  id: string;
  name: string;
  namingScheme: string | null;
}

interface ActiveSession extends OpenSession {}

interface UploadedImage {
  id: string;
  url: string;
}

interface Props {
  /** Pre-select an existing session on mount (used by session/[id].tsx). */
  initialSession?: ActiveSession;
}

// ─── GPS single-point fetch ───────────────────────────────────────────────────

interface GpsPoint {
  lat: number;
  lng: number;
  accuracy: number;
}

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

  // Session state
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    initialSession ?? null
  );
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionScheme, setNewSessionScheme] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  // Route tracking
  const { isTracking, points, accuracy: trackAccuracy, error: trackError, startTracking, stopTracking } =
    useLocationTracker(activeSession?.id ?? null);

  // Find form state
  const [findName, setFindName] = useState("");
  const [description, setDescription] = useState("");
  const [conductivity, setConductivity] = useState("");
  const [gps, setGps] = useState<GpsPoint | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitName, setLastSubmitName] = useState<string | null>(null);
  const [sessionFindCount, setSessionFindCount] = useState(0);

  // Auto-name from naming scheme
  const autoName = useMemo(() => {
    if (!activeSession?.namingScheme) return null;
    return applyNamingScheme(activeSession.namingScheme, activeSession.name, sessionFindCount + 1);
  }, [activeSession, sessionFindCount]);

  // ─── Load open sessions ──────────────────────────────────────────────────

  const loadOpenSessions = useCallback(async () => {
    try {
      const res = await apiFetch("/api/mobile/sessions?open=true");
      if (!res.ok) return;
      const { fieldSessions } = await res.json();
      setOpenSessions(fieldSessions);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadOpenSessions();
  }, [loadOpenSessions]);

  // ─── Session management ──────────────────────────────────────────────────

  async function handleCreateSession() {
    if (!newSessionName.trim()) {
      Alert.alert("Fehler", "Bitte einen Namen eingeben.");
      return;
    }
    setCreatingSession(true);
    try {
      const res = await apiPost("/api/mobile/sessions", {
        name: newSessionName.trim(),
        namingScheme: newSessionScheme.trim() || null,
        dateFrom: new Date().toISOString(),
      });
      if (!res.ok) throw new Error();
      const { fieldSession } = await res.json();
      setActiveSession({ id: fieldSession.id, name: fieldSession.name, namingScheme: fieldSession.namingScheme });
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
    setActiveSession(s);
    setShowSessionPicker(false);
    setSessionFindCount(0);
  }

  function handleEndSession() {
    Alert.alert("Begehung beenden", "Möchtest du die aktive Begehung beenden?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Beenden",
        style: "destructive",
        onPress: () => {
          if (isTracking) stopTracking();
          setActiveSession(null);
          setGps(null);
          setImages([]);
          setLastSubmitName(null);
          // Navigate back to the sessions list
          router.replace("/(app)/sessions" as never);
        },
      },
    ]);
  }

  // ─── GPS ─────────────────────────────────────────────────────────────────

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

  // ─── Photos ──────────────────────────────────────────────────────────────

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
    setUploadingImage(true);
    try {
      // Fetch the local file as a blob — more reliable than the { uri, name, type } trick
      // across different Expo/RN versions and Android content URIs.
      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();

      const formData = new FormData();
      formData.append("file", blob, asset.fileName ?? "photo.jpg");

      const res = await apiUpload("/api/mobile/images", formData);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const img = await res.json();
      setImages((prev) => [...prev, { id: img.id, url: img.url }]);
    } catch (err) {
      Alert.alert("Fehler", `Foto konnte nicht hochgeladen werden: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`);
    } finally {
      setUploadingImage(false);
    }
  }

  // ─── Submit find ─────────────────────────────────────────────────────────

  async function handleSubmitFind() {
    if (!gps) {
      Alert.alert("Fehler", "Bitte zuerst GPS-Koordinaten abrufen.");
      return;
    }
    setSubmitting(true);
    try {
      const resolvedName = findName.trim() || autoName || undefined;
      console.log("[FieldMode] submit — autoName:", autoName, "resolvedName:", resolvedName);
      const res = await apiPost("/api/mobile/findings/draft", {
        // Prefer explicit name → then auto-name from naming scheme → then undefined (no name)
        name: resolvedName,
        location: { lat: gps.lat, lng: gps.lng },
        description: description.trim() || undefined,
        conductivity: conductivity ? parseInt(conductivity, 10) : undefined,
        foundAt: new Date().toISOString(),
        images: images.map((i) => i.id),
        fieldSessionId: activeSession?.id ?? null,
      });
      if (!res.ok) throw new Error();
      const { finding } = await res.json();

      setLastSubmitName(finding.name ?? "");
      setSessionFindCount((c) => c + 1);
      // Reset form but keep GPS for rapid successive finds
      setFindName("");
      setDescription("");
      setConductivity("");
      setImages([]);
    } catch {
      Alert.alert("Fehler", "Fund konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeSession ? activeSession.name : "Felderfassung"}
          </Text>
          {isTracking && (
            <View style={styles.trackingBadge}>
              <Ionicons name="radio" size={10} color="#22c55e" />
              <Text style={styles.trackingText}>{points.length} Pkt</Text>
              {trackAccuracy !== null && (
                <Text style={styles.trackingAccuracy}>±{trackAccuracy}m</Text>
              )}
            </View>
          )}
        </View>
        {activeSession ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, isTracking && styles.headerBtnActive]}
              onPress={isTracking ? stopTracking : startTracking}
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
                      style={[styles.sessionItem, activeSession?.id === s.id && styles.sessionItemActive]}
                      onPress={() => handleSelectSession(s)}
                    >
                      <Ionicons name="map-outline" size={16} color="#888" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionItemName}>{s.name}</Text>
                        {s.namingScheme && (
                          <Text style={styles.sessionItemScheme}>Schema: {s.namingScheme}</Text>
                        )}
                      </View>
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

              {/* ── Find form ── */}
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
                  Leer lassen für: <Text style={{ fontWeight: "600", color: "#444" }}>{autoName}</Text>
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
                  style={[styles.secondaryButton, uploadingImage && styles.buttonDisabled]}
                  onPress={handleTakePhoto}
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? <ActivityIndicator color="#2d2d2d" size="small" />
                    : <Ionicons name="camera-outline" size={18} color="#2d2d2d" />}
                  <Text style={styles.secondaryButtonText}>Foto aufnehmen</Text>
                </TouchableOpacity>
                {images.map((img) => (
                  <View key={img.id} style={styles.thumb}>
                    <Image source={{ uri: img.url }} style={styles.thumbImg} />
                    <TouchableOpacity
                      style={styles.thumbRemove}
                      onPress={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
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
                    Zuletzt: <Text style={{ fontWeight: "600" }}>{lastSubmitName || "(kein Name)"}</Text>
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryButton, styles.submitButton, (!gps || submitting) && styles.buttonDisabled]}
                onPress={handleSubmitFind}
                disabled={!gps || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryButtonText}>Fund loggen</Text>}
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
  trackingBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  trackingText: { fontSize: 11, color: "#22c55e" },
  trackingAccuracy: { fontSize: 11, color: "#888" },
  headerActions: { flexDirection: "row", gap: 6 },
  headerBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
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
  gpsText: { fontSize: 12, color: "#22c55e", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
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
  sessionListLabel: { fontSize: 11, fontWeight: "600", color: "#999", textTransform: "uppercase", letterSpacing: 0.5 },
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

  // Success feedback
  successRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  successText: { fontSize: 12, color: "#22c55e" },
});
