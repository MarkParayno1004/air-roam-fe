import { createClient } from "@air-roam/api";
import { API_URL } from "./config";

/** Traveler API client: access token in memory, refresh token in the HttpOnly `ar_refresh` cookie. */
export const api = createClient({ baseUrl: API_URL, refreshPath: "auth/web/refresh" });
