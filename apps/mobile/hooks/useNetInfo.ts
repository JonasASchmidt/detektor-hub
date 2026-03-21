/**
 * useNetInfo — thin wrapper around @react-native-community/netinfo.
 *
 * Returns:
 *   isOnline: true | false | null (null = not yet determined)
 *
 * "isInternetReachable === false" catches cases where the device has a WiFi
 * connection but no actual internet (captive portal, etc.).
 */
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetInfo(): { isOnline: boolean | null } {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch current state once immediately
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    // Then subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
