/**
 * Client Configuration - Centralized Environment Variables
 * This file serves as single source of truth for all client configuration
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base API URL (must include /api in your backend)
  // Priority:
  // 1. VITE_API_URL from environment (REQUIRED in production)
  // 2. localhost API for dev only
  BASE_URL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? "http://localhost:4003/api"
      : (() => {
          console.error("VITE_API_URL is required in production!");
          return ""; // Fail fast in production if not configured
        })()),

  // Socket base URL (same host as API but without /api)
  SOCKET_URL: (() => {
    const baseUrl =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? "http://localhost:4003/api" : "");
    return baseUrl.endsWith("/api") ? baseUrl.replace("/api", "") : baseUrl;
  })(),

  // Admin API route prefixes
  ADMIN_PREFIX: "/admin",
};

/**
 * Google OAuth Configuration
 */
export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

/**
 * Frontend URLs
 */
export const FRONTEND_CONFIG = {
  // Used for generating invite links, redirects, etc.
  URL:
    import.meta.env.VITE_FRONTEND_URL ||
    import.meta.env.VITE_SITE_URL ||
    "http://localhost:5173",
  SITE_URL: import.meta.env.VITE_SITE_URL || "http://localhost:5173",
};

/**
 * Support & Contact
 */
export const SUPPORT_CONFIG = {
  EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || "support@sello.com",
};

/**
 * Development/Production Detection
 */
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
};

/**
 * Asset Configuration
 */
export const ASSET_CONFIG = {
  // Placeholder image URLs
  PLACEHOLDER_IMAGE: "https://via.placeholder.com/400x300?text=No+Image",

  // External service URLs
  OPENSTREETMAP_NOMINATIM: "https://nominatim.openstreetmap.org/reverse",
  FONTS_GOOGLE: "https://fonts.googleapis.com/css2",
  FONTS_GSTATIC: "https://fonts.gstatic.com",
};

/**
 * Validation Helper
 */
export const validateRequiredConfig = () => {
  const required = [];

  if (ENV_CONFIG.IS_PRODUCTION && !API_CONFIG.BASE_URL) {
    required.push("VITE_API_URL is required in production");
  }

  if (required.length > 0) {
    throw new Error(`Missing required configuration: ${required.join(", ")}`);
  }
};

/**
 * Export all configurations
 */
export default {
  API: API_CONFIG,
  GOOGLE: GOOGLE_CONFIG,
  FRONTEND: FRONTEND_CONFIG,
  SUPPORT: SUPPORT_CONFIG,
  ENV: ENV_CONFIG,
  ASSETS: ASSET_CONFIG,
  validateRequiredConfig,
};
