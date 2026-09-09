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

const STORE_DIR = path.resolve(process.cwd(), "src/server/data");
const STORE_FILE = path.join(STORE_DIR, "socialcraft-store.json");

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
    const tmpFile = `${STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
    fs.renameSync(tmpFile, STORE_FILE);
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
}): SocialCraftStoreData {
  const current = readStore();

  let mergedPosts = [...current.scheduledPosts];
  if (data.scheduledPosts && Array.isArray(data.scheduledPosts)) {
    const postMap = new Map<string, ScheduledPost>();
    for (const p of current.scheduledPosts) {
      postMap.set(p.id, p);
    }
    for (const p of data.scheduledPosts) {
      postMap.set(p.id, p);
    }
    mergedPosts = Array.from(postMap.values());
  }

  let mergedSeries = [...current.seriesQueue];
  if (data.seriesQueue && Array.isArray(data.seriesQueue)) {
    const seriesMap = new Map<string, SeriesJob>();
    for (const s of current.seriesQueue) {
      seriesMap.set(s.id, s);
    }
    for (const s of data.seriesQueue) {
      seriesMap.set(s.id, s);
    }
    mergedSeries = Array.from(seriesMap.values());
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
