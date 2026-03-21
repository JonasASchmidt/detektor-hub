/**
 * GPS route tracker using expo-location.
 * Works in Expo Go (foreground only). Background tracking requires a dev build.
 *
 * Changes from the previous version:
 *   - stopTracking() no longer calls the server API. It returns the collected
 *     RoutePoints so the caller (FieldMode) can persist them to SQLite and
 *     include them in the session sync at the end.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export interface RoutePoint {
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

export function useLocationTracker() {
  const [state, setState] = useState<LocationTrackerState>({
    isTracking: false,
    points: [],
    accuracy: null,
    error: null,
  });

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  // pointsRef mirrors state.points but is always current (no React batching lag)
  const pointsRef = useRef<RoutePoint[]>([]);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setState((prev) => ({ ...prev, error: "GPS-Berechtigung verweigert." }));
      return;
    }

    pointsRef.current = [];
    setState({ isTracking: true, points: [], accuracy: null, error: null });

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // fire at every 5 m of movement (minimum)
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

        // Only record if the device has actually moved far enough
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

  /**
   * Stop GPS tracking and return the collected route points.
   * The caller is responsible for persisting the route (e.g. via saveSessionRoute).
   */
  const stopTracking = useCallback((): RoutePoint[] => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setState((prev) => ({ ...prev, isTracking: false }));
    return pointsRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}
