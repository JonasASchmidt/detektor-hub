import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { apiFetch } from "@/lib/api";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface LocationTrackerState {
  isTracking: boolean;
  points: RoutePoint[];
  accuracy: number | null;
  error: string | null;
}

/** Minimum metres moved before recording a new point (filters GPS jitter). */
const MIN_DISTANCE_M = 10;
/** Discard readings worse than this accuracy. */
const MAX_ACCURACY_M = 30;

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
 * GPS route tracker using expo-location.
 * Works in Expo Go (foreground only). Background tracking requires a dev build.
 * On stop, PATCHes the collected route to /api/mobile/sessions/[id]/route.
 */
export function useLocationTracker(sessionId: string | null) {
  const [state, setState] = useState<LocationTrackerState>({
    isTracking: false,
    points: [],
    accuracy: null,
    error: null,
  });

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const pointsRef = useRef<RoutePoint[]>([]);

  const syncToServer = useCallback(
    async (points: RoutePoint[]) => {
      if (!sessionId || points.length < 2) return;
      const coordinates = points.map((p) => [p.lng, p.lat] as [number, number]);
      try {
        await apiFetch(`/api/mobile/sessions/${sessionId}/route`, {
          method: "PATCH",
          body: JSON.stringify({ coordinates }),
        });
      } catch {
        // Non-critical — route stays in memory if this fails
      }
    },
    [sessionId]
  );

  const startTracking = useCallback(async () => {
    // Request foreground permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setState((prev) => ({
        ...prev,
        error: "GPS-Berechtigung verweigert.",
      }));
      return;
    }

    pointsRef.current = [];
    setState({ isTracking: true, points: [], accuracy: null, error: null });

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // call at every 5m movement minimum
      },
      (location) => {
        const { latitude, longitude, accuracy } = location.coords;

        // Discard low-accuracy readings
        if (accuracy !== null && accuracy > MAX_ACCURACY_M) {
          setState((prev) => ({ ...prev, accuracy: Math.round(accuracy) }));
          return;
        }

        const point: RoutePoint = { lat: latitude, lng: longitude };
        const last = pointsRef.current[pointsRef.current.length - 1];

        // Only record if moved far enough
        if (last && haversineDistance(last, point) < MIN_DISTANCE_M) {
          setState((prev) => ({
            ...prev,
            accuracy: accuracy !== null ? Math.round(accuracy) : prev.accuracy,
          }));
          return;
        }

        pointsRef.current = [...pointsRef.current, point];
        setState((prev) => ({
          ...prev,
          points: pointsRef.current,
          accuracy: accuracy !== null ? Math.round(accuracy) : prev.accuracy,
          error: null,
        }));
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    syncToServer(pointsRef.current);
    setState((prev) => ({ ...prev, isTracking: false }));
  }, [syncToServer]);

  // Stop when sessionId is cleared
  useEffect(() => {
    if (!sessionId && state.isTracking) stopTracking();
  }, [sessionId, state.isTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}
