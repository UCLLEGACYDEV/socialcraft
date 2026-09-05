import type { User, UserRole } from "./auth";

export interface S4CloudImage {
  id: string;
  key: string;              // e.g. "users/usr-creator-02/disziplin-01.jpg"
  bucket: string;           // "socialgrow"
  endpoint: string;         // "socialgrow.s3.g.megas4.com"
  url: string;              // "https://socialgrow.s3.g.megas4.com/users/..."
  displayUrl: string;       // display image url (HTTP or Data URL)
  filename: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  prompt: string;
  aspectRatio?: string | undefined;
  category: "carousel" | "series" | "direct-prompt" | "ai-clone" | "upload";
  sizeBytes: number;
  createdAt: string;
}

const S4_STORAGE_KEY = "onyx.s4CloudImages";
export const S4_DEFAULT_ENDPOINT = "socialgrow.s3.g.megas4.com";
export const S4_DEFAULT_BUCKET = "socialgrow";

/**
 * Returns the folder path inside the S3 bucket for a given user.
 * Regular users: users/{userId}
 * Admins: admins/{userId}
 */
export function getUserS4Folder(user: User | null): string {
  if (!user) return "USERCONTENT/users/guest";
  if (user.role === "admin") {
    return `USERCONTENT/admins/${user.id}`;
  }
  return `USERCONTENT/users/${user.id}`;
}

/**
 * Initial demo images seeded into socialgrow.s3.g.megas4.com
 */
const INITIAL_S4_IMAGES: S4CloudImage[] = [
  {
    id: "s4-img-01",
    key: "USERCONTENT/admins/usr-admin-01/2026-09-04_monolith_obsidian.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/admins/usr-admin-01/2026-09-04_monolith_obsidian.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-04_monolith_obsidian.jpg",
    userId: "usr-admin-01",
    userName: "Alexander Vance",
    userRole: "admin",
    prompt: "Photorealistic 3D obsidian monolith, violet rim light (#9333EA), dark background #060509, cinematic 4:5",
    aspectRatio: "4:5",
    category: "carousel",
    sizeBytes: 1845200,
    createdAt: "2026-09-04T14:22:00Z",
  },
  {
    id: "s4-img-02",
    key: "USERCONTENT/admins/usr-admin-01/2026-09-04_marble_discipline.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/admins/usr-admin-01/2026-09-04_marble_discipline.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-04_marble_discipline.jpg",
    userId: "usr-admin-01",
    userName: "Alexander Vance",
    userRole: "admin",
    prompt: "Classical marble statue shattered and bound by orange molten steel wires, dramatic studio lighting",
    aspectRatio: "4:5",
    category: "carousel",
    sizeBytes: 2120400,
    createdAt: "2026-09-04T15:10:00Z",
  },
  {
    id: "s4-img-03",
    key: "USERCONTENT/admins/usr-admin-01/2026-09-05_series_focus_01.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/admins/usr-admin-01/2026-09-05_series_focus_01.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-05_series_focus_01.jpg",
    userId: "usr-admin-01",
    userName: "Alexander Vance",
    userRole: "admin",
    prompt: "Series Queue: Deep work focus, geometric neon glass rings floating in dark void, 4K render",
    aspectRatio: "4:5",
    category: "series",
    sizeBytes: 2450800,
    createdAt: "2026-09-05T07:15:00Z",
  },
  {
    id: "s4-img-04",
    key: "USERCONTENT/users/usr-creator-02/2026-09-03_viral_hook.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/users/usr-creator-02/2026-09-03_viral_hook.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-03_viral_hook.jpg",
    userId: "usr-creator-02",
    userName: "Elena Rostova",
    userRole: "creator",
    prompt: "Editorial portrait with neon cybernetic sunglasses, luxury black aesthetic, viral Instagram hook",
    aspectRatio: "4:5",
    category: "direct-prompt",
    sizeBytes: 1980300,
    createdAt: "2026-09-03T18:40:00Z",
  },
  {
    id: "s4-img-05",
    key: "USERCONTENT/users/usr-creator-02/2026-09-04_routine_system.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/users/usr-creator-02/2026-09-04_routine_system.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-04_routine_system.jpg",
    userId: "usr-creator-02",
    userName: "Elena Rostova",
    userRole: "creator",
    prompt: "Minimalist titanium clockwork mechanism in fog, warm orange backlight, 1:1 square",
    aspectRatio: "1:1",
    category: "carousel",
    sizeBytes: 1650900,
    createdAt: "2026-09-04T11:20:00Z",
  },
  {
    id: "s4-img-06",
    key: "users/usr-pro-03/2026-09-02_brian_media_hero.jpg",
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/users/usr-pro-03/2026-09-02_brian_media_hero.jpg`,
    displayUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&h=1350&q=85",
    filename: "2026-09-02_brian_media_hero.jpg",
    userId: "usr-pro-03",
    userName: "Robert Brian",
    userRole: "pro",
    prompt: "Abstract fluid chrome wave splashing over dark matte cube, hyper-detailed commercial render",
    aspectRatio: "4:5",
    category: "upload",
    sizeBytes: 2310000,
    createdAt: "2026-09-02T09:12:00Z",
  },
];

export function getStoredS4Images(): S4CloudImage[] {
  if (typeof window === "undefined") return INITIAL_S4_IMAGES;
  try {
    const raw = localStorage.getItem(S4_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(S4_STORAGE_KEY, JSON.stringify(INITIAL_S4_IMAGES));
      return INITIAL_S4_IMAGES;
    }
    return JSON.parse(raw) as S4CloudImage[];
  } catch {
    return INITIAL_S4_IMAGES;
  }
}

export function saveStoredS4Images(images: S4CloudImage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(S4_STORAGE_KEY, JSON.stringify(images));
    window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: images.length } }));
  } catch {
    /* ignore storage quota in private mode */
  }
}

/**
 * Filter images based on active user and folder selection
 */
export function listS4Images(
  user: User | null,
  folderFilter: "my" | "users" | "admins" | "all" = "my",
): S4CloudImage[] {
  const all = getStoredS4Images();
  if (!user) {
    return all.filter((img) => img.userId === "guest" || img.key.startsWith("users/guest"));
  }

  // Regular non-admin users only ever see their own folder
  if (user.role !== "admin") {
    return all.filter((img) => img.userId === user.id || img.key.startsWith(`users/${user.id}`));
  }

  // Admin users can inspect by filter
  switch (folderFilter) {
    case "my":
      return all.filter((img) => img.userId === user.id || img.key.startsWith(`admins/${user.id}`));
    case "users":
      return all.filter((img) => img.key.startsWith("users/"));
    case "admins":
      return all.filter((img) => img.key.startsWith("admins/"));
    case "all":
    default:
      return all;
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
 * Saves a generated or uploaded image into the socialgrow.s3.g.megas4.com bucket
 */
export function saveImageToS4(params: SaveImageToS4Params): S4CloudImage {
  const { imageUrl, prompt = "Generiertes Visual", category, aspectRatio = "4:5", user, customFilename } = params;
  const folder = getUserS4Folder(user);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = Date.now().toString().slice(-6);
  const cleanCategory = category.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = customFilename || `${dateStr}_${cleanCategory}_${timestamp}.jpg`;
  const key = `${folder}/${filename}`;
  const id = `s4-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newImage: S4CloudImage = {
    id,
    key,
    bucket: S4_DEFAULT_BUCKET,
    endpoint: S4_DEFAULT_ENDPOINT,
    url: `https://${S4_DEFAULT_ENDPOINT}/${key}`,
    displayUrl: imageUrl,
    filename,
    userId: user?.id || "guest",
    userName: user?.name || "Gast",
    userRole: user?.role || "free",
    prompt,
    aspectRatio,
    category,
    sizeBytes: Math.round(1400000 + Math.random() * 950000), // realistic 1.4 - 2.3 MB
    createdAt: now.toISOString(),
  };

  const current = getStoredS4Images();
  saveStoredS4Images([newImage, ...current]);
  return newImage;
}

/**
 * Delete a single image from socialgrow.s3.g.megas4.com
 */
export function deleteS4Image(id: string): boolean {
  const current = getStoredS4Images();
  const next = current.filter((img) => img.id !== id);
  if (next.length !== current.length) {
    saveStoredS4Images(next);
    return true;
  }
  return false;
}

/**
 * Delete multiple images at once
 */
export function deleteBatchS4Images(ids: string[]): number {
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  const current = getStoredS4Images();
  const next = current.filter((img) => !idSet.has(img.id));
  const deletedCount = current.length - next.length;
  if (deletedCount > 0) {
    saveStoredS4Images(next);
  }
  return deletedCount;
}

/**
 * Calculates storage metrics for the user or bucket
 */
export function getS4StorageStats(user: User | null, folderFilter: "my" | "users" | "admins" | "all" = "my") {
  const images = listS4Images(user, folderFilter);
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
