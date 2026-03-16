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
}

/**
 * Tracks GPS route using watchPosition. Sends batched updates to the server
 * every SYNC_INTERVAL_MS or when MIN_DISTANCE_M has been exceeded since last sync.
 */
const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const MIN_POINTS_TO_SYNC = 2;

export function useRouteTracker(sessionId: string | null) {
  const [state, setState] = useState<RouteTrackerState>({
    isTracking: false,
    points: [],
    accuracy: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const pointsRef = useRef<RoutePoint[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncToServer = useCallback(
    async (points: RoutePoint[]) => {
      if (!sessionId || points.length < MIN_POINTS_TO_SYNC) return;
      const coordinates = points.map((p) => [p.lng, p.lat] as [number, number]);
      try {
        await fetch(`/api/field-sessions/${sessionId}/route`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates }),
        });
      } catch {
        // silently fail — route will be synced on next interval
      }
    },
    [sessionId]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "GPS wird von diesem Gerät nicht unterstützt.",
      }));
      return;
    }

    pointsRef.current = [];
    setState({ isTracking: true, points: [], accuracy: null, error: null });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
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
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Periodic server sync
    syncTimerRef.current = setInterval(() => {
      syncToServer(pointsRef.current);
    }, SYNC_INTERVAL_MS);
  }, [syncToServer]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (syncTimerRef.current !== null) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    // Final sync on stop
    syncToServer(pointsRef.current);
    setState((prev) => ({ ...prev, isTracking: false }));
  }, [syncToServer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (syncTimerRef.current !== null) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, []);

  // Stop tracking if session changes
  useEffect(() => {
    if (!sessionId && state.isTracking) {
      stopTracking();
    }
  }, [sessionId, state.isTracking, stopTracking]);

  return { ...state, startTracking, stopTracking };
}
