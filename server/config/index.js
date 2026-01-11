import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server directory (not config directory)
const envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Debug: Check if .env was loaded
console.log("🔧 Environment loaded from:", envPath);
console.log(
  "🔧 ENABLE_EMAIL_NOTIFICATIONS:",
  process.env.ENABLE_EMAIL_NOTIFICATIONS
);
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);

/**
 * Database Configuration
 */
export const DB_CONFIG = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sell-db",
  // Redis configuration (optional)
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
};

/**
 * Server Configuration
 */
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || "4000"),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Single frontend URL configuration
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  PRODUCTION_URL: process.env.PRODUCTION_URL,

  // Get allowed origins for CORS
  getAllowedOrigins: () => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const origins = clientUrl.split(",").map((url) => url.trim());

    // Add production URL if available
    if (process.env.PRODUCTION_URL) {
      origins.push(process.env.PRODUCTION_URL);
    }

    return origins;
  },
};

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  REFRESH_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

/**
 * Google OAuth Configuration
 */
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
};

/**
 * Email Configuration
 */
export const EMAIL_CONFIG = {
  HOST: process.env.SMTP_HOST,
  PORT: parseInt(process.env.SMTP_PORT || "587"),
  MAIL: process.env.SMTP_MAIL,
  PASSWORD: process.env.SMTP_PASSWORD,
  ENABLED: process.env.ENABLE_EMAIL_NOTIFICATIONS === "true",

  // Get frontend URL for email links - using single CLIENT_URL
  getFrontendUrl: () => {
    return process.env.CLIENT_URL || "http://localhost:5173";
  },
};

/**
 * Cloudinary Configuration
 */
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

/**
 * Payment Configuration - Stripe Only
 */
export const PAYMENT_CONFIG = {
  GATEWAY: "stripe", // Fixed to stripe only

  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Get callback URL for payments - using single CLIENT_URL
  getCallbackUrl: () => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return (
      process.env.PRODUCTION_URL || clientUrl.split(",")[0]?.trim() || clientUrl
    );
  },
};

/**
 * SMS Configuration (Twilio)
 */
export const SMS_CONFIG = {
  ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};

/**
 * Site Configuration
 */
export const SITE_CONFIG = {
  NAME: process.env.SITE_NAME || "Sello",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@sello.com",
};

/**
 * Feature Flags
 */
export const FEATURE_CONFIG = {
  ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS === "true",
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === "true",
  ENABLE_IMAGE_QUALITY_VALIDATION:
    process.env.ENABLE_IMAGE_QUALITY_VALIDATION === "true",
};

/**
 * Logging Configuration
 */
export const LOG_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || "info",
  DEBUG_AUTH: process.env.DEBUG_AUTH === "true",
};

/**
 * Validation Helper
 */
export const validateRequiredConfig = () => {
  const required = [JWT_CONFIG.SECRET];

  const missing = required.filter((config) => !config);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }
};

/**
 * Export all configurations
 */
export default {
  DB: DB_CONFIG,
  SERVER: SERVER_CONFIG,
  JWT: JWT_CONFIG,
  GOOGLE: GOOGLE_CONFIG,
  EMAIL: EMAIL_CONFIG,
  CLOUDINARY: CLOUDINARY_CONFIG,
  PAYMENT: PAYMENT_CONFIG,
  SITE: SITE_CONFIG,
  FEATURES: FEATURE_CONFIG,
  LOG: LOG_CONFIG,
  validateRequiredConfig,
};
