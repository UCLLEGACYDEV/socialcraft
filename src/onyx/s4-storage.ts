import { type User, type UserRole, getStoredCurrentUser } from "./auth";
import {
  DEFAULT_API_SETTINGS,
  ANCHORED_S4_ACCESS_KEY,
  ANCHORED_S4_SECRET_KEY,
  ANCHORED_S4_ENDPOINT,
  ANCHORED_S4_BUCKET,
  ANCHORED_S4_REGION,
} from "./defaults";
import type { ApiSettings } from "./types";

export interface S4CloudImage {
  id: string;
  key: string;              
  bucket: string;           
  endpoint: string;         
  url: string;              
  displayUrl: string;       
  proxyUrl?: string;
  filename: string;
  subfolder?: string;
  projectName?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  prompt: string;
  aspectRatio?: string | undefined;
  category: "carousel" | "series" | "direct-prompt" | "ai-clone" | "upload" | string;
  sizeBytes: number;
  createdAt: string;
}

export const S4_DEFAULT_ENDPOINT = ANCHORED_S4_ENDPOINT;
export const S4_DEFAULT_BUCKET = ANCHORED_S4_BUCKET;

import { LS } from "./storage";

function getSettings(): ApiSettings {
  if (typeof window === "undefined") return DEFAULT_API_SETTINGS;
  try {
    const raw = localStorage.getItem(LS.apiSettings) || localStorage.getItem("onyx.apiSettings");
    return raw ? { ...DEFAULT_API_SETTINGS, ...JSON.parse(raw) } : DEFAULT_API_SETTINGS;
  } catch {
    return DEFAULT_API_SETTINGS;
  }
}

/** Build request headers containing cloud storage credentials from local settings or master anchored fallback */
export function getCloudHeaders(): Record<string, string> {
  const settings = getSettings();
  const accessKey = (settings.s4AccessKey?.trim() || ANCHORED_S4_ACCESS_KEY).trim();
  const secretKey = (settings.s4SecretKey?.trim() || ANCHORED_S4_SECRET_KEY).trim();
  const endpoint = (settings.s4Endpoint?.trim() || ANCHORED_S4_ENDPOINT).trim();
  const bucket = (settings.s4Bucket?.trim() || ANCHORED_S4_BUCKET).trim();
  const region = (settings.s4Region?.trim() || ANCHORED_S4_REGION).trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessKey) headers["x-cloud-access-key"] = accessKey;
  if (secretKey) headers["x-cloud-secret-key"] = secretKey;
  if (endpoint) headers["x-cloud-endpoint"] = endpoint;
  if (bucket) headers["x-cloud-bucket"] = bucket;
  if (region) headers["x-cloud-region"] = region;
  return headers;
}

/** Determines the standard folder path in cloud storage for a user */
export function getUserS4Folder(user?: User | null): string {
  const effectiveUser = user || getStoredCurrentUser();
  if (!effectiveUser) return "USERCONTENT/users/guest";
  if (effectiveUser.role === "admin") {
    return `USERCONTENT/admins/${effectiveUser.id}`;
  }
  return `USERCONTENT/users/${effectiveUser.id}`;
}

/**
 * Ensures that the cloud folder hierarchy for the given user exists.
 * Especially crucial when admin is active, so the folder is ready in the cloud bucket!
 */
export async function ensureUserS4Folder(
  user?: User | null
): Promise<{ success: boolean; folder: string; createdPaths?: string[] | undefined; error?: string | undefined }> {
  const effectiveUser = user || getStoredCurrentUser();
  const folder = getUserS4Folder(effectiveUser);
  try {
    const res = await fetch("/api/cloud/ensure-folder", {
      method: "POST",
      headers: getCloudHeaders(),
      body: JSON.stringify({
        folderPath: folder,
        user: effectiveUser ? {
          id: effectiveUser.id,
          name: effectiveUser.name,
          role: effectiveUser.role,
          email: effectiveUser.email,
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
  user?: User | null,
  folderFilter: "my" | "users" | "admins" | "all" = "my",
): Promise<S4CloudImage[]> {
  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;
  const endpoint = settings.s4Endpoint || S4_DEFAULT_ENDPOINT;

  const effectiveUser = user || getStoredCurrentUser();

  let prefix = "";
  if (!effectiveUser) {
    prefix = "USERCONTENT/users/guest/";
  } else if (effectiveUser.role !== "admin" || folderFilter === "my") {
    prefix = `${getUserS4Folder(effectiveUser)}/`;
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
      // Parse category and subfolders
      const keyParts = obj.key.split("/").filter(Boolean);
      const filename = obj.filename || keyParts[keyParts.length - 1] || "image.jpg";
      
      let category: S4CloudImage["category"] = "upload";
      let subfolder: string | undefined = undefined;
      let projectName: string | undefined = undefined;

      if (obj.key.includes("/carousels/")) {
        category = "carousel";
        subfolder = "carousels";
        const cIndex = keyParts.indexOf("carousels");
        if (cIndex !== -1 && keyParts[cIndex + 1] && keyParts[cIndex + 1] !== filename) {
          projectName = keyParts[cIndex + 1];
        }
      } else if (obj.key.includes("/series/")) {
        category = "series";
        subfolder = "series";
        const sIndex = keyParts.indexOf("series");
        if (sIndex !== -1 && keyParts[sIndex + 1] && keyParts[sIndex + 1] !== filename) {
          projectName = keyParts[sIndex + 1];
        }
      } else if (obj.key.includes("/clones/")) {
        category = "ai-clone";
        subfolder = "clones";
        const clIndex = keyParts.indexOf("clones");
        if (clIndex !== -1 && keyParts[clIndex + 1] && keyParts[clIndex + 1] !== filename) {
          projectName = keyParts[clIndex + 1];
        }
      } else if (obj.key.includes("/gallery/")) {
        category = "direct-prompt";
        subfolder = "gallery";
      } else if (filename.includes("_carousel_")) {
        category = "carousel";
      } else if (filename.includes("_series_")) {
        category = "series";
      } else if (filename.includes("_direct-prompt_")) {
        category = "direct-prompt";
      } else if (filename.includes("_ai-clone_")) {
        category = "ai-clone";
      }

      return {
        id: obj.key,
        key: obj.key,
        bucket,
        endpoint,
        url: obj.url,
        displayUrl: obj.url,
        proxyUrl: (obj as any).proxyUrl,
        filename,
        subfolder,
        projectName,
        userId: effectiveUser?.id || "unknown",
        userName: effectiveUser?.name || "Benutzer",
        userRole: effectiveUser?.role || "free",
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
  user?: User | null;
  customFilename?: string | undefined;
  subfolder?: string | undefined;
  projectName?: string | undefined;
  onError?: ((message: string) => void) | undefined;
}

/**
 * Saves an image to the user's cloud folder hierarchy
 */
export async function saveImageToS4(params: SaveImageToS4Params): Promise<S4CloudImage | null> {
  const { imageUrl, prompt = "Generiertes Visual", category, aspectRatio = "4:5", user, customFilename, subfolder, projectName, onError } = params;

  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;
  const endpoint = settings.s4Endpoint || S4_DEFAULT_ENDPOINT;

  const effectiveUser = user || getStoredCurrentUser();
  const userRoot = getUserS4Folder(effectiveUser);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = Date.now().toString().slice(-6);
  const cleanCategory = category.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = customFilename || `${dateStr}_${cleanCategory}_${timestamp}.jpg`;

  // Determine structured target folder
  let targetFolder = `${userRoot}/gallery`;
  if (subfolder) {
    targetFolder = `${userRoot}/${subfolder.replace(/^\/+|\/+$/g, "")}`;
  } else if (category === "series") {
    const cleanProject = (projectName || "current_series")
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 45);
    targetFolder = `${userRoot}/series/${cleanProject}`;
  } else if (category === "carousel") {
    const cleanProject = (projectName || "current_carousel")
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 45);
    targetFolder = `${userRoot}/carousels/${cleanProject}`;
  } else if (category === "ai-clone") {
    const cleanClone = (projectName || "mein_klon")
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 45);
    targetFolder = `${userRoot}/clones/${cleanClone}/styles`;
  }

  const key = `${targetFolder}/${filename}`;

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
      const message = err.error || res.statusText || `HTTP ${res.status}`;
      console.warn("[CloudStorage] Upload failed:", message);
      onError?.(message);
      return null;
    }


    const data = await res.json() as { success: boolean; url: string; key: string; size: number };

    // Fire update event so gallery reacts immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: 1 } }));
    }

    // Record in Supabase (socialcraft_cloud_images) if Supabase is connected
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      if (supabase && user?.id) {
        await supabase.from("socialcraft_cloud_images" as any).upsert({
          id: data.key,
          user_id: user.id.startsWith("usr-") ? undefined : user.id,
          s4_key: data.key,
          url: data.url,
          prompt,
          aspect_ratio: aspectRatio,
          category,
          size_bytes: data.size,
          created_at: now.toISOString(),
        });
      }
    } catch {
      // Offline fallback
    }

    return {
      id: data.key,
      key: data.key,
      bucket,
      endpoint,
      url: data.url,
      displayUrl: data.url,
      proxyUrl: `/api/cloud/file?key=${encodeURIComponent(data.key)}`,
      filename,
      subfolder: subfolder || category,
      projectName,
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
    onError?.(error instanceof Error ? error.message : "Unbekannter Fehler");
    return null;
  }

}

export interface SaveCarouselToS4Params {
  user?: User | null;
  carouselId: string;
  topic: string;
  /** Use an existing project folder name instead of generating a new one */
  folderName?: string | undefined;
  /** Skip re-uploading the slide images (when they were already uploaded individually) */
  skipImages?: boolean | undefined;
  slides: Array<{
    id: string;
    slideNumber: number;
    headline: string;
    subtext: string;
    imageUrl?: string;
    visualPrompt?: string;
  }>;
}

/**
 * Saves an entire carousel project with its slides and a manifest file into Mega S4 Cloud and Supabase
 */
export async function saveCarouselToS4(params: SaveCarouselToS4Params): Promise<{
  success: boolean;
  folder: string;
  manifestUrl?: string;
  uploadedSlides: number;
}> {
  const { user, carouselId, topic, slides, folderName, skipImages } = params;
  const effectiveUser = user || getStoredCurrentUser();
  const userRoot = getUserS4Folder(effectiveUser);
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanTopic = (topic || "Karussell")
    .replace(/[^a-zA-Z0-9-_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const projectFolderName = folderName || `${dateStr}_${cleanTopic}_${carouselId.slice(0, 6)}`;
  const subfolderPath = `carousels/${projectFolderName}`;
  const fullFolderPath = `${userRoot}/${subfolderPath}`;

  let uploadedCount = 0;

  // 1. Upload slides with images
  if (!skipImages) {
    for (const s of slides) {
      if (s.imageUrl) {
        const res = await saveImageToS4({
          imageUrl: s.imageUrl,
          prompt: s.visualPrompt || s.headline,
          category: "carousel",
          user,
          customFilename: `slide_${String(s.slideNumber).padStart(2, "0")}.jpg`,
          subfolder: subfolderPath,
          projectName: projectFolderName,
        });
        if (res) uploadedCount++;
      }
    }
  } else {
    uploadedCount = slides.filter((s) => s.imageUrl).length;
  }


  // 2. Upload manifest JSON as data URL
  const manifestData = JSON.stringify(
    {
      id: carouselId,
      topic,
      slideCount: slides.length,
      createdAt: new Date().toISOString(),
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      slides: slides.map((s) => ({
        slideNumber: s.slideNumber,
        headline: s.headline,
        subtext: s.subtext,
        imageUrl: s.imageUrl,
      })),
    },
    null,
    2,
  );

  const manifestDataUrl = `data:application/json;base64,${typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(manifestData))) : Buffer.from(manifestData).toString("base64")}`;

  const manifestUpload = await saveImageToS4({
    imageUrl: manifestDataUrl,
    prompt: `Manifest für Karussell ${topic}`,
    category: "carousel",
    user,
    customFilename: `carousel_data.json`,
    subfolder: subfolderPath,
    projectName: projectFolderName,
  });

  // 3. Sync to Supabase socialcraft_carousels
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    if (supabase && user?.id) {
      await supabase.from("socialcraft_carousels" as any).upsert({
        id: carouselId.length === 36 ? carouselId : undefined,
        title: topic || "Karussell",
        topic,
        slide_count: slides.length,
        slides,
        raw_data: {
          s4_folder: fullFolderPath,
          manifest_url: manifestUpload?.url,
          user_id: user.id,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (supaErr) {
    console.info("[Supabase] Carousel record notice:", supaErr);
  }

  return {
    success: true,
    folder: fullFolderPath,
    manifestUrl: manifestUpload?.url,
    uploadedSlides: uploadedCount,
  };
}

/**
 * Saves the user's generation history as history.json into their private cloud folder
 */
export async function saveHistoryToS4(
  entries: unknown[],
  user?: User | null,
): Promise<boolean> {
  const effectiveUser = user || getStoredCurrentUser();
  const userRoot = getUserS4Folder(effectiveUser);
  try {
    const json = JSON.stringify(
      { updatedAt: new Date().toISOString(), entries },
      null,
      2,
    );
    const dataUrl = `data:application/json;base64,${typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json).toString("base64")}`;
    const res = await saveImageToS4({
      imageUrl: dataUrl,
      prompt: "Verlauf (history.json)",
      category: "history",
      user: effectiveUser,
      customFilename: "history.json",
      subfolder: "history",
      projectName: "history",
    });
    return !!res;
  } catch (error) {
    console.warn("[CloudStorage] Verlauf konnte nicht gespeichert werden:", error);
    return false;
  }
}

/**
 * Loads the user's generation history from their private cloud folder
 */
export async function loadHistoryFromS4<T = unknown>(
  user?: User | null,
): Promise<T[] | null> {
  const effectiveUser = user || getStoredCurrentUser();
  const userRoot = getUserS4Folder(effectiveUser);
  try {
    const res = await fetch(
      `/api/cloud/file?key=${encodeURIComponent(`${userRoot}/history/history.json`)}`,
      { headers: getCloudHeaders() },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { entries?: T[] };
    return Array.isArray(data.entries) ? data.entries : null;
  } catch {
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

export async function getS4StorageStats(user?: User | null, folderFilter: "my" | "users" | "admins" | "all" = "my") {
  const effectiveUser = user || getStoredCurrentUser();
  const images = await listS4Images(effectiveUser, folderFilter);
  const totalBytes = images.reduce((acc, img) => acc + img.sizeBytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const folder = getUserS4Folder(effectiveUser);
  return {
    count: images.length,
    totalBytes,
    formattedSize: `${totalMB} MB`,
    folder,
  };
}
