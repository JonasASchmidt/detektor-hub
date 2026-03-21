import Constants from "expo-constants";

/**
 * Base URL of the Next.js web API.
 *
 * In development: set API_URL in app.json extra or use your local machine's
 * LAN IP (e.g. http://192.168.1.x:3000). Localhost does NOT work on a physical
 * device — only on an emulator (where 10.0.2.2 maps to the host machine).
 *
 * In production: set API_URL to your deployed domain.
 */
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "http://192.168.2.52:3000";
