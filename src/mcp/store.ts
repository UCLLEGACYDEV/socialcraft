import fs from "node:fs";
import path from "node:path";
import type { BrandProfile, ScheduledPost, SocialChannel, ScheduledPostStatus, SocialPlatform, SeriesJob } from "../onyx/types";
import { DEFAULT_BRAND_PROFILES, DEFAULT_SOCIAL_CHANNELS } from "../onyx/defaults";
import { DEFAULT_POSTING_SLOTS, type PostingSlotConfig } from "../onyx/scheduling";
export type { PostingSlotConfig } from "../onyx/scheduling";

export interface CarouselDraft {
  id: string;
  title: string;
  topic?: string;
  audience?: string;
  slides: Array<{
    slideNumber: number;
    role: string;
    headline: string;
    subtext: string;
    visualPrompt: string;
    imageUrl?: string;
  }>;
  profileId?: string;
  createdAt: string;
}

export interface SocialCraftStoreData {
  brandProfiles: BrandProfile[];
  socialChannels: SocialChannel[];
  scheduledPosts: ScheduledPost[];
  postingSlots: PostingSlotConfig;
  carousels: CarouselDraft[];
  seriesQueue: SeriesJob[];
  deletedPostIds?: string[];
  deletedSeriesIds?: string[];
  updatedAt: string;
}

import { fileURLToPath } from "node:url";

function resolveStorePaths(): { storeDir: string; storeFile: string } {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    let dir = currentDir;
    for (let i = 0; i < 6; i++) {
      const candidate = path.join(dir, "src", "server", "data");
      if (fs.existsSync(candidate)) {
        return { storeDir: candidate, storeFile: path.join(candidate, "socialcraft-store.json") };
      }
      const parent = path.dirname(dir);
      if (!parent || parent === dir) break;
      dir = parent;
    }
  } catch {
    // Fallback if import.meta.url is unavailable
  }
  const fallbackDir = path.resolve(process.cwd(), "src/server/data");
  return { storeDir: fallbackDir, storeFile: path.join(fallbackDir, "socialcraft-store.json") };
}

const { storeDir: STORE_DIR, storeFile: STORE_FILE } = resolveStorePaths();

function getInitialStore(): SocialCraftStoreData {
  return {
    brandProfiles: [...DEFAULT_BRAND_PROFILES],
    socialChannels: [...DEFAULT_SOCIAL_CHANNELS],
    scheduledPosts: [],
    postingSlots: { ...DEFAULT_POSTING_SLOTS },
    carousels: [],
    seriesQueue: [],
    deletedPostIds: [],
    deletedSeriesIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readStore(): SocialCraftStoreData {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      writeStore(initial);
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SocialCraftStoreData>;
    return {
      brandProfiles: parsed.brandProfiles?.length ? parsed.brandProfiles : [...DEFAULT_BRAND_PROFILES],
      socialChannels: parsed.socialChannels?.length ? parsed.socialChannels : [...DEFAULT_SOCIAL_CHANNELS],
      scheduledPosts: parsed.scheduledPosts || [],
      postingSlots: parsed.postingSlots || { ...DEFAULT_POSTING_SLOTS },
      carousels: parsed.carousels || [],
      seriesQueue: parsed.seriesQueue || [],
      deletedPostIds: parsed.deletedPostIds || [],
      deletedSeriesIds: parsed.deletedSeriesIds || [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[SocialCraft Store] Read error, using fallback:", err);
    return getInitialStore();
  }
}

export function writeStore(data: SocialCraftStoreData): void {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    const updated: SocialCraftStoreData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("[SocialCraft Store] Write error:", err);
  }
}

export const getStore = readStore;
export const saveStore = writeStore;

export function getBrandProfiles(): BrandProfile[] {
  return readStore().brandProfiles;
}

export function getSocialChannels(profileId?: string): SocialChannel[] {
  const channels = readStore().socialChannels;
  if (!profileId) return channels;
  return channels.filter((c) => !c.profileId || c.profileId === profileId);
}

/**
 * Resolves a real, valid SocialChannel for the given profile and platform.
 * NEVER returns a fake fallback like "default-channel".
 */
export function resolveChannelForPlatform(profileId?: string, platform?: string): SocialChannel {
  const store = readStore();
  const allChannels = store.socialChannels.length > 0 ? store.socialChannels : DEFAULT_SOCIAL_CHANNELS;
  const allProfiles = store.brandProfiles.length > 0 ? store.brandProfiles : DEFAULT_BRAND_PROFILES;

  // 1. Resolve normalized profile id (supports id or slug)
  let matchedProfile = allProfiles.find((p) => p.id === profileId || p.slug === profileId);
  if (!matchedProfile && profileId) {
    const lower = profileId.toLowerCase().replace(/[^a-z0-9]/g, "");
    matchedProfile = allProfiles.find(
      (p) =>
        p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === lower ||
        p.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === lower ||
        p.name.toLowerCase().includes(lower)
    );
  }
  const effectiveProfileId = matchedProfile?.id || allProfiles[0]?.id || "profile-default";

  // 2. Profile-specific channels
  const profileChannels = allChannels.filter((c) => (c.profileId || allProfiles[0]?.id) === effectiveProfileId);

  // 3. Exact platform match in profile channels
  if (platform) {
    const directMatch = profileChannels.find((c) => c.platform.toLowerCase() === platform.toLowerCase());
    if (directMatch) return directMatch;

    // 4. Any channel with matching platform across all channels
    const globalPlatformMatch = allChannels.find((c) => c.platform.toLowerCase() === platform.toLowerCase());
    if (globalPlatformMatch) return globalPlatformMatch;
  }

  // 5. Default channel of the profile
  const defaultProfileChannel = profileChannels.find((c) => c.isDefault) || profileChannels[0];
  if (defaultProfileChannel) return defaultProfileChannel;

  // 6. Global default channel or first channel
  const globalDefault = allChannels.find((c) => c.isDefault) || allChannels[0];
  if (globalDefault) return globalDefault;

  return DEFAULT_SOCIAL_CHANNELS[0];
}

export function getScheduledPosts(filter?: {
  status?: string;
  platform?: string;
  profileId?: string;
}): ScheduledPost[] {
  const store = readStore();
  let list = store.scheduledPosts;
  if (filter?.status) {
    list = list.filter((p) => p.status === filter.status);
  }
  if (filter?.platform) {
    list = list.filter((p) => p.platform === filter.platform);
  }
  if (filter?.profileId) {
    list = list.filter((p) => p.profileId === filter.profileId);
  }
  return list.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export function addScheduledPost(post: Omit<ScheduledPost, "id" | "createdAt"> & { id?: string }): ScheduledPost {
  const store = readStore();
  const newPost: ScheduledPost = {
    ...post,
    id: post.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.scheduledPosts.push(newPost);
  writeStore(store);
  return newPost;
}

export function addScheduledPostsBatch(
  posts: Array<Omit<ScheduledPost, "id" | "createdAt"> & { id?: string }>
): ScheduledPost[] {
  const store = readStore();
  const createdList: ScheduledPost[] = [];

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const newPost: ScheduledPost = {
      ...p,
      id: p.id || `post_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    store.scheduledPosts.push(newPost);
    createdList.push(newPost);
  }

  writeStore(store);
  return createdList;
}

export const batchAddScheduledPosts = addScheduledPostsBatch;

export function updateScheduledPost(
  id: string,
  patch: Partial<Omit<ScheduledPost, "id" | "createdAt">>
): ScheduledPost | null {
  const store = readStore();
  const idx = store.scheduledPosts.findIndex(
    (p) => p.id === id || p.id.endsWith(`_${id}`) || p.id.endsWith(id)
  );
  if (idx === -1) return null;

  store.scheduledPosts[idx] = {
    ...store.scheduledPosts[idx],
    ...patch,
  };
  writeStore(store);
  return store.scheduledPosts[idx];
}

export function deleteScheduledPost(id: string): boolean {
  const store = readStore();
  const toDelete = store.scheduledPosts.filter(
    (p) => p.id === id || p.id.endsWith(`_${id}`) || p.id.endsWith(id)
  );
  if (toDelete.length === 0) return false;

  const deleteIds = new Set(toDelete.map((p) => p.id));
  store.scheduledPosts = store.scheduledPosts.filter((p) => !deleteIds.has(p.id));

  if (!store.deletedPostIds) store.deletedPostIds = [];
  deleteIds.forEach((delId) => {
    if (!store.deletedPostIds!.includes(delId)) {
      store.deletedPostIds!.push(delId);
    }
  });

  if (store.deletedPostIds.length > 500) {
    store.deletedPostIds = store.deletedPostIds.slice(-500);
  }

  writeStore(store);
  return true;
}

export function addCarouselDraft(carousel: Omit<CarouselDraft, "id" | "createdAt"> & { id?: string }): CarouselDraft {
  const store = readStore();
  const draft: CarouselDraft = {
    ...carousel,
    id: carousel.id || `carousel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.carousels.push(draft);
  writeStore(store);
  return draft;
}

export function getCarousels(): CarouselDraft[] {
  return readStore().carousels;
}

export function getSeriesQueue(): SeriesJob[] {
  return readStore().seriesQueue;
}

export function addSeriesJob(job: SeriesJob): SeriesJob {
  const store = readStore();
  store.seriesQueue.push(job);
  writeStore(store);
  return job;
}

export function batchAddSeriesJobs(jobs: SeriesJob[]): SeriesJob[] {
  const store = readStore();
  for (const j of jobs) {
    store.seriesQueue.push(j);
  }
  writeStore(store);
  return jobs;
}

export function deleteSeriesJob(id: string): boolean {
  const store = readStore();
  const initialLength = store.seriesQueue.length;
  store.seriesQueue = store.seriesQueue.filter((s) => s.id !== id);
  if (!store.deletedSeriesIds) store.deletedSeriesIds = [];
  if (!store.deletedSeriesIds.includes(id)) {
    store.deletedSeriesIds.push(id);
  }
  if (store.deletedSeriesIds.length > 500) {
    store.deletedSeriesIds = store.deletedSeriesIds.slice(-500);
  }
  writeStore(store);
  return store.seriesQueue.length !== initialLength;
}

export function clearSeriesQueue(): void {
  const store = readStore();
  if (!store.deletedSeriesIds) store.deletedSeriesIds = [];
  store.seriesQueue.forEach((s) => {
    if (!store.deletedSeriesIds!.includes(s.id)) {
      store.deletedSeriesIds!.push(s.id);
    }
  });
  store.seriesQueue = [];
  writeStore(store);
}

export function getPostingSlotsConfig(): PostingSlotConfig {
  return readStore().postingSlots;
}

export const getPostingSlotConfig = getPostingSlotsConfig;

export function syncStoreWithClient(data: {
  scheduledPosts?: ScheduledPost[];
  brandProfiles?: BrandProfile[];
  socialChannels?: SocialChannel[];
  postingSlots?: PostingSlotConfig;
  seriesQueue?: SeriesJob[];
  deletedSeriesIds?: string[];
  deletedPostIds?: string[];
}): SocialCraftStoreData {
  const current = readStore();

  const deletedIds = new Set<string>([...(current.deletedPostIds || [])]);
  if (data.deletedPostIds && Array.isArray(data.deletedPostIds)) {
    data.deletedPostIds.forEach((id) => deletedIds.add(id));
  }

  const deletedSeries = new Set<string>([...(current.deletedSeriesIds || [])]);
  if (data.deletedSeriesIds && Array.isArray(data.deletedSeriesIds)) {
    data.deletedSeriesIds.forEach((id) => deletedSeries.add(id));
  }

  // Filter out any explicitly deleted posts from current server state
  current.scheduledPosts = current.scheduledPosts.filter((p) => !deletedIds.has(p.id));
  current.seriesQueue = current.seriesQueue.filter((s) => !deletedSeries.has(s.id));

  let mergedPosts = current.scheduledPosts;
  if (data.scheduledPosts && Array.isArray(data.scheduledPosts)) {
    const postMap = new Map<string, ScheduledPost>();
    // 1. Put current server posts into map (unless explicitly deleted)
    current.scheduledPosts.forEach((p) => {
      if (!deletedIds.has(p.id)) postMap.set(p.id, p);
    });
    // 2. Client posts update or add (only if not deleted)
    data.scheduledPosts.forEach((p) => {
      if (p && p.id && !deletedIds.has(p.id)) {
        postMap.set(p.id, p);
      }
    });
    mergedPosts = Array.from(postMap.values()).filter((p) => !deletedIds.has(p.id));
  }

  // Merge channels: union by id with server priority to NEVER lose system/server channels
  const channelMap = new Map<string, SocialChannel>();
  DEFAULT_SOCIAL_CHANNELS.forEach((c) => channelMap.set(c.id, c));
  current.socialChannels.forEach((c) => channelMap.set(c.id, { ...channelMap.get(c.id), ...c }));
  if (data.socialChannels && Array.isArray(data.socialChannels)) {
    data.socialChannels.forEach((c) => {
      if (c && c.id) {
        channelMap.set(c.id, { ...channelMap.get(c.id), ...c });
      }
    });
  }

  // Merge brand profiles: union by id with server priority
  const profileMap = new Map<string, BrandProfile>();
  DEFAULT_BRAND_PROFILES.forEach((p) => profileMap.set(p.id, p));
  current.brandProfiles.forEach((p) => profileMap.set(p.id, { ...profileMap.get(p.id), ...p }));
  if (data.brandProfiles && Array.isArray(data.brandProfiles)) {
    data.brandProfiles.forEach((p) => {
      if (p && p.id) {
        profileMap.set(p.id, { ...profileMap.get(p.id), ...p });
      }
    });
  }

  // Merge series queue: union by id (NO timeout purge! Server & client jobs both preserved)
  let mergedSeries = current.seriesQueue;
  if (data.seriesQueue && Array.isArray(data.seriesQueue)) {
    const seriesMap = new Map<string, SeriesJob>();
    // 1. Existing server jobs (excluding deleted)
    current.seriesQueue.forEach((s) => {
      if (s && s.id && !deletedSeries.has(s.id)) {
        seriesMap.set(s.id, s);
      }
    });
    // 2. Client jobs (excluding deleted)
    data.seriesQueue.forEach((s) => {
      if (s && s.id && !deletedSeries.has(s.id)) {
        seriesMap.set(s.id, s);
      }
    });
    mergedSeries = Array.from(seriesMap.values()).filter((s) => !deletedSeries.has(s.id));
  }

  const updated: SocialCraftStoreData = {
    brandProfiles: Array.from(profileMap.values()),
    socialChannels: Array.from(channelMap.values()),
    scheduledPosts: mergedPosts,
    postingSlots: data.postingSlots || current.postingSlots,
    carousels: current.carousels,
    seriesQueue: mergedSeries,
    deletedPostIds: Array.from(deletedIds),
    deletedSeriesIds: Array.from(deletedSeries),
    updatedAt: new Date().toISOString(),
  };

  writeStore(updated);
  return updated;
}
