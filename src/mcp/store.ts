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
  const idx = store.scheduledPosts.findIndex((p) => p.id === id);
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
  const initialLength = store.scheduledPosts.length;
  store.scheduledPosts = store.scheduledPosts.filter((p) => p.id !== id);
  if (store.scheduledPosts.length !== initialLength) {
    writeStore(store);
    return true;
  }
  return false;
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
  if (store.seriesQueue.length !== initialLength) {
    writeStore(store);
    return true;
  }
  return false;
}

export function clearSeriesQueue(): void {
  const store = readStore();
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

  if (data.deletedSeriesIds && Array.isArray(data.deletedSeriesIds)) {
    current.seriesQueue = current.seriesQueue.filter((s) => !data.deletedSeriesIds!.includes(s.id));
  }
  if (data.deletedPostIds && Array.isArray(data.deletedPostIds)) {
    current.scheduledPosts = current.scheduledPosts.filter((p) => !data.deletedPostIds!.includes(p.id));
  }

  let mergedPosts = current.scheduledPosts;
  if (data.scheduledPosts && Array.isArray(data.scheduledPosts)) {
    const clientPostIds = new Set(data.scheduledPosts.map((p) => p.id));
    const now = Date.now();
    const externalNewPosts = current.scheduledPosts.filter((p) => {
      if (clientPostIds.has(p.id)) return false;
      const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      return now - createdMs < 60_000;
    });
    mergedPosts = [...data.scheduledPosts, ...externalNewPosts];
  }

  let mergedSeries = current.seriesQueue;
  if (data.seriesQueue && Array.isArray(data.seriesQueue)) {
    const clientSeriesIds = new Set(data.seriesQueue.map((s) => s.id));
    const now = Date.now();
    const externalNewSeries = current.seriesQueue.filter((s) => {
      if (clientSeriesIds.has(s.id)) return false;
      const createdMs = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      return now - createdMs < 60_000;
    });
    mergedSeries = [...data.seriesQueue, ...externalNewSeries];
  }

  const updated: SocialCraftStoreData = {
    brandProfiles: data.brandProfiles?.length ? data.brandProfiles : current.brandProfiles,
    socialChannels: data.socialChannels?.length ? data.socialChannels : current.socialChannels,
    scheduledPosts: mergedPosts,
    postingSlots: data.postingSlots || current.postingSlots,
    carousels: current.carousels,
    seriesQueue: mergedSeries,
    updatedAt: new Date().toISOString(),
  };

  writeStore(updated);
  return updated;
}
