/**
 * Centralized, typed runtime configuration for Socialcraft ONYX Studio.
 * Handles both Vite client-side (import.meta.env) and Node/Nitro server-side (process.env)
 * runtime contexts gracefully with fallback safety.
 */

function readEnv(key: string, viteKey?: string): string {
  // 1. Client-side Vite environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (viteKey && typeof import.meta.env[viteKey] === "string" && import.meta.env[viteKey].trim()) {
      return import.meta.env[viteKey].trim();
    }
    if (typeof import.meta.env[key] === "string" && import.meta.env[key].trim()) {
      return import.meta.env[key].trim();
    }
  }

  // 2. Server-side Node / Nitro environment
  if (typeof process !== "undefined" && process.env) {
    if (key && typeof process.env[key] === "string" && process.env[key].trim()) {
      return process.env[key].trim();
    }
    if (viteKey && typeof process.env[viteKey] === "string" && process.env[viteKey].trim()) {
      return process.env[viteKey].trim();
    }
  }

  return "";
}

export interface AppConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  api: {
    kieApiKey: string;
    postForMeApiKey: string;
    zernioWebhookSecret: string;
  };
  s4: {
    accessKey: string;
    secretKey: string;
    endpoint: string;
    bucket: string;
    region: string;
  };
  supabase: {
    url: string;
    publishableKey: string;
    serviceRoleKey: string;
  };
}

export const config: AppConfig = {
  isProduction: readEnv("NODE_ENV") === "production",
  isDevelopment: readEnv("NODE_ENV") !== "production",
  port: Number(readEnv("PORT") || 3005),
  api: {
    kieApiKey: readEnv("KIE_API_KEY", "VITE_KIE_API_KEY"),
    postForMeApiKey: readEnv("POSTFORME_API_KEY", "VITE_POSTFORME_API_KEY"),
    zernioWebhookSecret: readEnv("ZERNIO_WEBHOOK_SECRET", "VITE_ZERNIO_WEBHOOK_SECRET"),
  },
  s4: {
    accessKey: readEnv("S4_ACCESS_KEY", "VITE_S4_ACCESS_KEY"),
    secretKey: readEnv("S4_SECRET_KEY", "VITE_S4_SECRET_KEY"),
    endpoint: readEnv("S4_ENDPOINT", "VITE_S4_ENDPOINT") || "https://s3.eu-central-003.backblazeb2.com",
    bucket: readEnv("S4_BUCKET", "VITE_S4_BUCKET") || "socialcraft-storage",
    region: readEnv("S4_REGION", "VITE_S4_REGION") || "eu-central-003",
  },
  supabase: {
    url: readEnv("SUPABASE_URL", "VITE_SUPABASE_URL"),
    publishableKey: readEnv("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"),
    serviceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
};

/**
 * Helper to safely extract error message from unknown catch blocks
 */
export function getErrorMessage(error: unknown, fallback = "Ein unbekannter Fehler ist aufgetreten."): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const candidate = (error as Record<string, unknown>)["message"] || (error as Record<string, unknown>)["error"];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return fallback;
}
