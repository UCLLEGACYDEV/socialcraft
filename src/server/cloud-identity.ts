/**
 * Resolves the identity of the caller for cloud storage requests and
 * enforces that every key/prefix stays inside that user's private folder.
 *
 * Identity sources (in order of trust):
 *  1. Authorization: Bearer <supabase access token>  -> verified against Supabase
 *  2. Cookie "onyx_identity" (base64 JSON)           -> works for <img src> requests
 *  3. Headers x-onyx-user-id / x-onyx-user-role
 */

export interface CloudIdentity {
  id: string;
  role: string;
  verified: boolean;
  root: string;
}

export const GUEST_ROOT = "USERCONTENT/users/guest";

export function folderForUser(id: string | null | undefined, role?: string | null): string {
  if (!id) return GUEST_ROOT;
  const safeId = String(id).replace(/[^a-zA-Z0-9-_@.]/g, "");
  if (!safeId) return GUEST_ROOT;
  return role === "admin" ? `USERCONTENT/admins/${safeId}` : `USERCONTENT/users/${safeId}`;
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function decodeIdentityCookie(value: string): { id?: string; role?: string } | null {
  try {
    const json = typeof atob !== "undefined"
      ? decodeURIComponent(escape(atob(value)))
      : Buffer.from(value, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { id?: string; role?: string };
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function supabaseEnv(): { url: string; key: string } | null {
  const env = (typeof process !== "undefined" && process.env) || {};
  const url = env["SUPABASE_URL"] || env["VITE_SUPABASE_URL"] || "";
  const key =
    env["SUPABASE_PUBLISHABLE_KEY"] ||
    env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    env["SUPABASE_ANON_KEY"] ||
    "";
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

async function verifyWithSupabase(token: string): Promise<{ id: string; role: string } | null> {
  const cfg = supabaseEnv();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: cfg.key },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    if (!user?.id) return null;

    let role = "creator";
    try {
      const profRes = await fetch(
        `${cfg.url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
        { headers: { Authorization: `Bearer ${token}`, apikey: cfg.key } },
      );
      if (profRes.ok) {
        const rows = (await profRes.json()) as Array<{ role?: string }>;
        if (rows[0]?.role) role = rows[0].role;
      }
    } catch {
      /* role stays default */
    }
    return { id: user.id, role };
  } catch {
    return null;
  }
}

export async function resolveCloudIdentity(request: Request): Promise<CloudIdentity> {
  const auth = request.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

  if (token) {
    const verified = await verifyWithSupabase(token);
    if (verified) {
      return {
        id: verified.id,
        role: verified.role,
        verified: true,
        root: folderForUser(verified.id, verified.role),
      };
    }
  }

  const cookie = readCookie(request, "onyx_identity");
  const fromCookie = cookie ? decodeIdentityCookie(cookie) : null;
  const id = fromCookie?.id || request.headers.get("x-onyx-user-id") || "";
  const role = fromCookie?.role || request.headers.get("x-onyx-user-role") || "creator";

  if (id) {
    return { id, role, verified: false, root: folderForUser(id, role) };
  }

  return { id: "guest", role: "guest", verified: false, root: GUEST_ROOT };
}

/** Normalizes a key/prefix and rejects directory traversal & injection attempts. */
export function normalizeKey(key: string): string {
  if (!key || typeof key !== "string") return "";
  let clean = key.replace(/\0/g, "").replace(/\\/g, "/");
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // ignore malformed URI components
  }
  // Strip null bytes and ASCII control characters
  clean = clean.replace(/[\x00-\x1f\x7f]/g, "");
  // Collapse duplicate slashes
  clean = clean.replace(/\/+/g, "/");
  // Remove leading slashes
  clean = clean.replace(/^\/+/, "");
  // Strictly filter out any path traversal segments: ../, ./, .., .
  const parts = clean.split("/").filter((part) => part && part !== "." && part !== "..");
  return parts.join("/");
}

/** True when the given key/prefix is inside the caller's own folder. */
export function isInOwnScope(identity: CloudIdentity, key: string): boolean {
  const clean = normalizeKey(key);
  return clean === identity.root || clean.startsWith(`${identity.root}/`);
}

/**
 * Admins may look at other folders, but only when their admin role was
 * confirmed by a verified Supabase session.
 */
export function isTrustedAdmin(identity: CloudIdentity): boolean {
  return identity.verified && identity.role === "admin";
}

/** Resolves a requested listing scope into an allowed prefix. */
export function resolveListPrefix(
  identity: CloudIdentity,
  scope: string | null,
  sub?: string | null,
): string {
  const admin = isTrustedAdmin(identity);
  let base = `${identity.root}/`;
  if (admin) {
    if (scope === "users") base = "USERCONTENT/users/";
    else if (scope === "admins") base = "USERCONTENT/admins/";
    else if (scope === "all") base = "USERCONTENT/";
  }
  if (sub) {
    const cleanSub = normalizeKey(sub).replace(/^\/+|\/+$/g, "");
    if (cleanSub) base = `${base}${cleanSub}/`;
  }
  return base;
}
