/**
 * Sync engine — pushes locally-buffered sessions, finds, and images to the server.
 *
 * Two entry points:
 *   syncLocalSession(localId)   — new session created offline (local_ ID)
 *   syncOrphanFinds(serverId)   — finds added while resuming an already-synced session
 *
 * Both are called from FieldMode when the user presses "Begehung beenden".
 * The caller passes an onProgress callback to drive the progress overlay.
 */
import { apiFetch, apiPost, apiUpload } from "./api";
import {
  getLocalSession,
  getPendingFinds,
  getPendingImages,
  saveSessionServerId,
  markSessionSynced,
  markFindSynced,
  markImageUploaded,
} from "./db";

// ─── Progress reporting ───────────────────────────────────────────────────────

export interface SyncProgress {
  /** Human-readable status line shown in the overlay. */
  message: string;
  /** 0–1 fraction for the progress bar. */
  fraction: number;
}

// ─── Image upload helper ──────────────────────────────────────────────────────

/**
 * Upload a single cached image and return the server image ID.
 *
 * Uses the { uri, name, type } object approach — React Native's native way
 * to attach local files to a multipart request. Blobs created from fetch()
 * don't serialize correctly in RN's FormData implementation.
 * This works reliably because localPath is always a file:// URI we control.
 */
async function uploadImage(localPath: string): Promise<string> {
  console.log("[sync] uploadImage — uploading:", localPath);
  const formData = new FormData();
  formData.append("file", { uri: localPath, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);
  const res = await apiUpload("/api/mobile/images", formData);
  console.log("[sync] uploadImage — server response status:", res.status);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Bild-Upload fehlgeschlagen (HTTP ${res.status})`);
  }
  const { id } = await res.json();
  return id as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sync a session that was created locally (id starts with 'local_').
 *
 * Steps:
 *   1. POST the session → get server ID
 *   2. For each pending find: upload images → POST find
 *   3. PATCH GPS route if recorded
 *   4. PATCH session dateTo (marks it as ended on the server)
 *   5. Mark session synced in SQLite
 *
 * @param localSessionId   The 'local_xxx' ID from SQLite.
 * @param routePoints      GPS points collected during the session.
 * @param dateTo           ISO string for when the session ended.
 * @param onProgress       Optional callback for UI updates.
 * @returns                The server-assigned session ID.
 */
export async function syncLocalSession(
  localSessionId: string,
  routePoints: { lat: number; lng: number }[],
  dateTo: string,
  onProgress?: (p: SyncProgress) => void
): Promise<string> {
  const session = await getLocalSession(localSessionId);
  if (!session) throw new Error("Begehung nicht gefunden.");

  const report = (message: string, fraction: number) =>
    onProgress?.({ message, fraction });

  // ── 1. Create session on server ──────────────────────────────────────────
  let serverId = session.serverId;
  if (!serverId) {
    report("Begehung synchronisieren …", 0.05);
    console.log("[sync] Creating session on server:", session.name);
    const res = await apiPost("/api/mobile/sessions", {
      name: session.name,
      namingScheme: session.namingScheme,
      dateFrom: session.dateFrom,
      // dateTo will be PATCHed after finds are uploaded
    });
    console.log("[sync] POST /api/mobile/sessions →", res.status);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.errors ? JSON.stringify(body.errors) : "Begehung konnte nicht erstellt werden.");
    }
    const { fieldSession } = await res.json();
    serverId = fieldSession.id as string;
    console.log("[sync] Session created, serverId:", serverId);
    // Persist immediately — if sync fails later, the next retry skips creation
    await saveSessionServerId(localSessionId, serverId);
  }

  // ── 2. Sync finds + their images ─────────────────────────────────────────
  const finds = await getPendingFinds(localSessionId);
  const total = finds.length;

  for (let i = 0; i < finds.length; i++) {
    const find = finds[i];
    const baseFraction = 0.1 + (i / Math.max(total, 1)) * 0.7;
    report(`Fund ${i + 1} / ${total} synchronisieren …`, baseFraction);

    // Upload images for this find
    const images = await getPendingImages(find.id);
    const serverImageIds: string[] = [];
    for (let j = 0; j < images.length; j++) {
      report(
        `Fund ${i + 1} / ${total} — Bild ${j + 1} / ${images.length} hochladen …`,
        baseFraction + (j / Math.max(images.length, 1)) * 0.05
      );
      const imgServerId = await uploadImage(images[j].localPath);
      await markImageUploaded(images[j].id, imgServerId);
      serverImageIds.push(imgServerId);
    }

    // POST the find
    console.log("[sync] POST find:", find.name ?? "(kein Name)", "images:", serverImageIds.length);
    const res = await apiPost("/api/mobile/findings/draft", {
      name: find.name ?? undefined,
      location: { lat: find.lat, lng: find.lng },
      description: find.description ?? undefined,
      conductivity: find.conductivity ?? undefined,
      foundAt: find.foundAt,
      images: serverImageIds,
      fieldSessionId: serverId,
    });
    console.log("[sync] POST /api/mobile/findings/draft →", res.status);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Fund "${find.name ?? "(kein Name)"}" konnte nicht gespeichert werden: ${JSON.stringify(body)}`);
    }
    await markFindSynced(find.id);
  }

  // ── 3. Save GPS route ────────────────────────────────────────────────────
  if (routePoints.length >= 2) {
    report("Route speichern …", 0.88);
    const coordinates = routePoints.map((p) => [p.lng, p.lat] as [number, number]);
    await apiFetch(`/api/mobile/sessions/${serverId}/route`, {
      method: "PATCH",
      body: JSON.stringify({ coordinates }),
    });
  }

  // ── 4. Mark session as ended on the server ───────────────────────────────
  report("Begehung abschließen …", 0.94);
  const patchRes = await apiFetch(`/api/mobile/sessions/${serverId}`, {
    method: "PATCH",
    body: JSON.stringify({ dateTo }),
  });
  if (!patchRes.ok) {
    // Non-critical — session is still created; just the end date is missing.
    console.warn("Failed to PATCH session dateTo:", await patchRes.text());
  }

  // ── 5. Mark local session synced ─────────────────────────────────────────
  await markSessionSynced(localSessionId, serverId, dateTo);
  report("Fertig!", 1);
  return serverId;
}

/**
 * Sync finds that were added while resuming an already-synced server session.
 * The session itself already exists on the server; only finds + images need uploading.
 *
 * @param serverSessionId  The real server UUID (not a local_ ID).
 * @param onProgress       Optional callback for UI updates.
 */
export async function syncOrphanFinds(
  serverSessionId: string,
  onProgress?: (p: SyncProgress) => void
): Promise<void> {
  const report = (message: string, fraction: number) =>
    onProgress?.({ message, fraction });

  const finds = await getPendingFinds(serverSessionId);
  const total = finds.length;

  for (let i = 0; i < finds.length; i++) {
    const find = finds[i];
    const baseFraction = i / Math.max(total, 1);
    report(`Fund ${i + 1} / ${total} synchronisieren …`, baseFraction);

    const images = await getPendingImages(find.id);
    const serverImageIds: string[] = [];
    for (let j = 0; j < images.length; j++) {
      report(
        `Fund ${i + 1} / ${total} — Bild ${j + 1} / ${images.length} hochladen …`,
        baseFraction + (j / Math.max(images.length, 1)) * 0.05
      );
      const imgServerId = await uploadImage(images[j].localPath);
      await markImageUploaded(images[j].id, imgServerId);
      serverImageIds.push(imgServerId);
    }

    const res = await apiPost("/api/mobile/findings/draft", {
      name: find.name ?? undefined,
      location: { lat: find.lat, lng: find.lng },
      description: find.description ?? undefined,
      conductivity: find.conductivity ?? undefined,
      foundAt: find.foundAt,
      images: serverImageIds,
      fieldSessionId: serverSessionId,
    });
    if (!res.ok) {
      throw new Error(`Fund "${find.name ?? "(kein Name)"}" konnte nicht gespeichert werden.`);
    }
    await markFindSynced(find.id);
  }

  report("Fertig!", 1);
}
