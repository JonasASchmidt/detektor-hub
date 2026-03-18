"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RoutePoint {
  lng: number;
  lat: number;
}

interface RouteTrackerState {
  isTracking: boolean;
  points: RoutePoint[];
  accuracy: number | null;
  error: string | null;
  wakeLockActive: boolean;
}

/** Minimum metres walked before a new point is recorded. Filters GPS jitter. */
const MIN_DISTANCE_M = 10;

/** Points with accuracy worse than this are discarded. */
const MAX_ACCURACY_M = 30;

/** Haversine distance between two GPS coordinates in metres. */
function haversineDistance(a: RoutePoint, b: RoutePoint): number {
  const R = 6_371_000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Tracks a GPS route using watchPosition.
 *
 * - Only records a new point when the user has moved ≥ MIN_DISTANCE_M metres
 *   (eliminates duplicate points while standing still).
 * - Discards readings with poor accuracy (> MAX_ACCURACY_M metres).
 * - Requests a Screen Wake Lock while tracking to prevent the browser from
 *   being suspended when the screen dims on mobile.
 * - On stop, sends ONE PATCH request to the server with all collected points
 *   merged with any previously stored route (continue-tracking support).
 */
export function useRouteTracker(sessionId: string | null) {
  const [state, setState] = useState<RouteTrackerState>({
    isTracking: false,
    points: [],
    accuracy: null,
    error: null,
    wakeLockActive: false,
  });

  const watchIdRef = useRef<number | null>(null);
  /** Points collected in the CURRENT tracking run (new GPS data only). */
  const pointsRef = useRef<RoutePoint[]>([]);
  /**
   * Points loaded from the server at tracking start — the previously stored
   * route for this session. Merged with new points on stop so the full route
   * is preserved when the user resumes tracking.
   */
  const existingPointsRef = useRef<RoutePoint[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ─── Wake Lock helpers ────────────────────────────────────────────────────

  const acquireWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setState((prev) => ({ ...prev, wakeLockActive: true }));
      wakeLockRef.current.addEventListener("release", () => {
        setState((prev) => ({ ...prev, wakeLockActive: false }));
      });
    } catch {
      // Wake Lock refused (e.g. low battery) — non-critical, tracking still works
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setState((prev) => ({ ...prev, wakeLockActive: false }));
  }, []);

  // Re-acquire wake lock when the tab regains visibility (screen was turned
  // back on after briefly turning off).
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        state.isTracking &&
        !wakeLockRef.current
      ) {
        await acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isTracking, acquireWakeLock]);

  // ─── Server sync ──────────────────────────────────────────────────────────

  const syncToServer = useCallback(
    async (newPoints: RoutePoint[], existing: RoutePoint[]) => {
      if (!sessionId) return;
      const allPoints = [...existing, ...newPoints];
      if (allPoints.length < 2) return;
      const coordinates = allPoints.map((p) => [p.lng, p.lat] as [number, number]);
      try {
        await fetch(`/api/field-sessions/${sessionId}/route`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates }),
        });
      } catch {
        // Non-critical — the route data stays in memory if this fails
      }
    },
    [sessionId]
  );

  // ─── Start tracking ───────────────────────────────────────────────────────

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "GPS wird von diesem Gerät nicht unterstützt.",
      }));
      return;
    }

    // Load any previously stored route so we can append to it on stop
    existingPointsRef.current = [];
    if (sessionId) {
      try {
        const res = await fetch(`/api/field-sessions/${sessionId}`);
        if (res.ok) {
          const { fieldSession } = await res.json();
          if (fieldSession.routeGeoJson) {
            const geojson = JSON.parse(fieldSession.routeGeoJson) as {
              coordinates: [number, number][];
            };
            existingPointsRef.current = geojson.coordinates.map(
              ([lng, lat]) => ({ lng, lat })
            );
          }
        }
      } catch {
        // Non-critical — tracking will start fresh
      }
    }

    pointsRef.current = [];
    setState({
      isTracking: true,
      points: [],
      accuracy: null,
      error: null,
      wakeLockActive: false,
    });

    await acquireWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Discard low-accuracy readings
        if (pos.coords.accuracy > MAX_ACCURACY_M) return;

        const point: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // Only accept the point if the user has moved far enough from the last one
        const last = pointsRef.current[pointsRef.current.length - 1];
        if (last && haversineDistance(last, point) < MIN_DISTANCE_M) {
          // Still update accuracy display even if point is skipped
          setState((prev) => ({
            ...prev,
            accuracy: Math.round(pos.coords.accuracy),
          }));
          return;
        }

        pointsRef.current = [...pointsRef.current, point];
        setState((prev) => ({
          ...prev,
          points: pointsRef.current,
          accuracy: Math.round(pos.coords.accuracy),
          error: null,
        }));
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: `GPS-Fehler: ${err.message}`,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [sessionId, acquireWakeLock]);

  // ─── Stop tracking ────────────────────────────────────────────────────────

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    // Single server write with full route (existing + new points)
    syncToServer(pointsRef.current, existingPointsRef.current);
    setState((prev) => ({ ...prev, isTracking: false }));
  }, [syncToServer, releaseWakeLock]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Stop tracking automatically when the session is deactivated
  useEffect(() => {
    if (!sessionId && state.isTracking) {
      stopTracking();
    }
  }, [sessionId, state.isTracking, stopTracking]);

  return { ...state, startTracking, stopTracking };
}
