import type { User, UserRole } from "./auth";
import { DEFAULT_API_SETTINGS } from "./defaults";
import type { ApiSettings } from "./types";

export interface S4CloudImage {
  id: string;
  key: string;              
  bucket: string;           
  endpoint: string;         
  url: string;              
  displayUrl: string;       
  filename: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  prompt: string;
  aspectRatio?: string | undefined;
  category: "carousel" | "series" | "direct-prompt" | "ai-clone" | "upload" | string;
  sizeBytes: number;
  createdAt: string;
}

export const S4_DEFAULT_ENDPOINT = "socialgrow.s3.g.megas4.com";
export const S4_DEFAULT_BUCKET = "socialgrow";

function getSettings(): ApiSettings {
  if (typeof window === "undefined") return DEFAULT_API_SETTINGS;
  try {
    const raw = localStorage.getItem("onyx.apiSettings");
    return raw ? { ...DEFAULT_API_SETTINGS, ...JSON.parse(raw) } : DEFAULT_API_SETTINGS;
  } catch {
    return DEFAULT_API_SETTINGS;
  }
}

/** Build request headers containing cloud storage credentials from local settings */
function getCloudHeaders(): Record<string, string> {
  const settings = getSettings();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (settings.s4AccessKey) headers["x-cloud-access-key"] = settings.s4AccessKey;
  if (settings.s4SecretKey) headers["x-cloud-secret-key"] = settings.s4SecretKey;
  if (settings.s4Endpoint) headers["x-cloud-endpoint"] = settings.s4Endpoint;
  if (settings.s4Bucket) headers["x-cloud-bucket"] = settings.s4Bucket;
  if (settings.s4Region) headers["x-cloud-region"] = settings.s4Region;
  return headers;
}

/** Determines the standard folder path in cloud storage for a user */
export function getUserS4Folder(user: User | null): string {
  if (!user) return "USERCONTENT/users/guest";
  if (user.role === "admin") {
    return `USERCONTENT/admins/${user.id}`;
  }
  return `USERCONTENT/users/${user.id}`;
}

/**
 * Ensures that the cloud folder hierarchy for the given user exists.
 * Especially crucial when admin is active, so the folder is ready in the cloud bucket!
 */
export async function ensureUserS4Folder(
  user: User | null
): Promise<{ success: boolean; folder: string; createdPaths?: string[] | undefined; error?: string | undefined }> {
  const folder = getUserS4Folder(user);
  try {
    const res = await fetch("/api/cloud/ensure-folder", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({
        folderPath: folder,
        user: user ? {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        } : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      console.warn("[CloudStorage] Could not ensure folder:", err.error || res.statusText);
      return { success: false, folder, error: err.error || res.statusText };
    }

    const data = await res.json() as { success: boolean; folder: string; createdPaths?: string[] };
    return { success: true, folder: data.folder, createdPaths: data.createdPaths };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Network error";
    console.warn("[CloudStorage] ensureUserS4Folder exception:", msg);
    return { success: false, folder, error: msg };
  }
}

/**
 * Tests cloud storage connection
 */
export async function testCloudConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/cloud/test", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json() as { success: boolean; message: string };
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Verbindungstest fehlgeschlagen";
    return { success: false, message: msg };
  }
}

/**
 * Lists images stored in the user's cloud folder
 */
export async function listS4Images(
  user: User | null,
  folderFilter: "my" | "users" | "admins" | "all" = "my",
): Promise<S4CloudImage[]> {
  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;
  const endpoint = settings.s4Endpoint || S4_DEFAULT_ENDPOINT;

  let prefix = "";
  if (!user) {
    prefix = "USERCONTENT/users/guest/";
  } else if (user.role !== "admin" || folderFilter === "my") {
    prefix = `${getUserS4Folder(user)}/`;
  } else if (folderFilter === "users") {
    prefix = "USERCONTENT/users/";
  } else if (folderFilter === "admins") {
    prefix = "USERCONTENT/admins/";
  } else {
    prefix = "USERCONTENT/";
  }

  try {
    const res = await fetch(`/api/cloud/list?prefix=${encodeURIComponent(prefix)}`, {
      method: "GET",
      headers: getCloudHeaders(),
    });

    if (!res.ok) {
      // If unauthorized or not configured, return empty silently
      return [];
    }

    const data = await res.json() as {
      success: boolean;
      objects?: Array<{
        key: string;
        size: number;
        lastModified: string;
        url: string;
        filename: string;
      }>;
    };

    if (!data.objects) return [];

    const images: S4CloudImage[] = data.objects.map((obj) => {
      // Parse category or default
      const keyParts = obj.key.split("/");
      const filename = obj.filename || keyParts[keyParts.length - 1] || "image.jpg";
      let category: S4CloudImage["category"] = "upload";
      if (filename.includes("_carousel_")) category = "carousel";
      else if (filename.includes("_series_")) category = "series";
      else if (filename.includes("_direct-prompt_")) category = "direct-prompt";
      else if (filename.includes("_ai-clone_")) category = "ai-clone";

      return {
        id: obj.key,
        key: obj.key,
        bucket,
        endpoint,
        url: obj.url,
        displayUrl: obj.url,
        filename,
        userId: user?.id || "unknown",
        userName: user?.name || "Benutzer",
        userRole: user?.role || "free",
        prompt: "Aus Cloud-Speicher geladen",
        category,
        sizeBytes: obj.size || 0,
        createdAt: obj.lastModified || new Date().toISOString(),
      };
    });

    return images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Fehler beim Abrufen der Cloud-Bilder:", error);
    return [];
  }
}

export interface SaveImageToS4Params {
  imageUrl: string;
  prompt?: string | undefined;
  category: S4CloudImage["category"];
  aspectRatio?: string | undefined;
  user: User | null;
  customFilename?: string | undefined;
}

/**
 * Saves an image to the user's cloud folder
 */
export async function saveImageToS4(params: SaveImageToS4Params): Promise<S4CloudImage | null> {
  const { imageUrl, prompt = "Generiertes Visual", category, aspectRatio = "4:5", user, customFilename } = params;
  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;
  const endpoint = settings.s4Endpoint || S4_DEFAULT_ENDPOINT;

  const folder = getUserS4Folder(user);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = Date.now().toString().slice(-6);
  const cleanCategory = category.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = customFilename || `${dateStr}_${cleanCategory}_${timestamp}.jpg`;
  const key = `${folder}/${filename}`;

  try {
    const res = await fetch("/api/cloud/upload", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({
        imageUrl,
        key,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      console.warn("[CloudStorage] Upload failed:", err.error || res.statusText);
      return null;
    }

    const data = await res.json() as { success: boolean; url: string; key: string; size: number };

    // Fire update event so gallery reacts immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: 1 } }));
    }

    return {
      id: data.key,
      key: data.key,
      bucket,
      endpoint,
      url: data.url,
      displayUrl: data.url,
      filename,
      userId: user?.id || "guest",
      userName: user?.name || "Gast",
      userRole: user?.role || "free",
      prompt,
      aspectRatio,
      category,
      sizeBytes: data.size || 2000000,
      createdAt: now.toISOString(),
    };
  } catch (error) {
    console.error("Fehler beim Speichern des Bildes in Cloud:", error);
    return null;
  }
}

/**
 * Deletes a single image from cloud storage
 */
export async function deleteS4Image(key: string): Promise<boolean> {
  try {
    const res = await fetch("/api/cloud/delete", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({ keys: [key] }),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: -1 } }));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Fehler beim Löschen des Cloud-Bildes:", error);
    return false;
  }
}

/**
 * Deletes multiple images from cloud storage
 */
export async function deleteBatchS4Images(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  try {
    const res = await fetch("/api/cloud/delete", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({ keys }),
    });
    if (res.ok) {
      const data = await res.json() as { deletedCount?: number };
      const count = data.deletedCount ?? keys.length;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: -count } }));
      }
      return count;
    }
    return 0;
  } catch (error) {
    console.error("Fehler beim Batch-Löschen der Cloud-Bilder:", error);
    return 0;
  }
}

export async function getS4StorageStats(user: User | null, folderFilter: "my" | "users" | "admins" | "all" = "my") {
  const images = await listS4Images(user, folderFilter);
  const totalBytes = images.reduce((acc, img) => acc + img.sizeBytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const folder = getUserS4Folder(user);
  return {
    count: images.length,
    totalBytes,
    formattedSize: `${totalMB} MB`,
    folder,
  };
}
