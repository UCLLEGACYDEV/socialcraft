import { useCallback, useEffect, useRef } from "react";
import type { BrandProfile, ScheduledPost, SeriesJob, SocialChannel } from "@/onyx/types";

export interface UseMcpSyncOptions {
  scheduledPosts: ScheduledPost[];
  setScheduledPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
  brandProfiles: BrandProfile[];
  setBrandProfiles: React.Dispatch<React.SetStateAction<BrandProfile[]>>;
  socialChannels: SocialChannel[];
  setSocialChannels: React.Dispatch<React.SetStateAction<SocialChannel[]>>;
  queue: SeriesJob[];
  setQueue: React.Dispatch<React.SetStateAction<SeriesJob[]>>;
  deletedPostIds: string[];
  setDeletedPostIds: React.Dispatch<React.SetStateAction<string[]>>;
  deletedSeriesIds: string[];
  setDeletedSeriesIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useMcpSync({
  scheduledPosts,
  setScheduledPosts,
  brandProfiles,
  setBrandProfiles,
  socialChannels,
  setSocialChannels,
  queue,
  setQueue,
  deletedPostIds,
  setDeletedPostIds,
  deletedSeriesIds,
  setDeletedSeriesIds,
}: UseMcpSyncOptions) {
  const handleUpdateScheduledPosts = useCallback(
    (updater: ScheduledPost[] | ((prev: ScheduledPost[]) => ScheduledPost[])) => {
      setScheduledPosts((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const newIds = new Set((Array.isArray(next) ? next : []).map((p) => p.id));
        const deleted = prev.filter((p) => !newIds.has(p.id)).map((p) => p.id);
        if (deleted.length > 0) {
          setDeletedPostIds((old) => Array.from(new Set([...old, ...deleted])));
          deleted.forEach((id) => {
            fetch(`/api/mcp/posts/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
          });
        }
        return next;
      });
    },
    [setScheduledPosts, setDeletedPostIds]
  );

  const deleteSeriesJobFromMcp = useCallback(
    (id: string) => {
      setQueue((prev) => prev.filter((j) => j.id !== id));
      setDeletedSeriesIds((prev) => Array.from(new Set([...prev, id])));
      fetch(`/api/mcp/series/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    },
    [setQueue, setDeletedSeriesIds]
  );

  const clearSeriesQueueFromMcp = useCallback(() => {
    setQueue((prev) => {
      const ids = prev.map((j) => j.id);
      if (ids.length > 0) {
        setDeletedSeriesIds((old) => Array.from(new Set([...old, ...ids])));
      }
      return [];
    });
    fetch("/api/mcp/series?all=true", { method: "DELETE" }).catch(() => {});
  }, [setQueue, setDeletedSeriesIds]);

  // Master Live-Sync with SocialCraft MCP store (bidirectional, interval-polled & focus-aware)
  const syncStateRef = useRef({
    scheduledPosts,
    brandProfiles,
    socialChannels,
    queue,
    deletedPostIds,
    deletedSeriesIds,
  });

  useEffect(() => {
    syncStateRef.current = {
      scheduledPosts,
      brandProfiles,
      socialChannels,
      queue,
      deletedPostIds,
      deletedSeriesIds,
    };
  }, [scheduledPosts, brandProfiles, socialChannels, queue, deletedPostIds, deletedSeriesIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const syncWithMcpStore = async () => {
      try {
        const {
          scheduledPosts: localPosts,
          brandProfiles: localProfiles,
          socialChannels: localChannels,
          queue: localQueue,
          deletedPostIds: localDeletedPosts,
          deletedSeriesIds: localDeletedSeries,
        } = syncStateRef.current;

        const res = await fetch("/api/mcp/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledPosts: localPosts,
            brandProfiles: localProfiles,
            socialChannels: localChannels,
            seriesQueue: localQueue,
            deletedPostIds: localDeletedPosts,
            deletedSeriesIds: localDeletedSeries,
          }),
        });

        if (!cancelled && res.ok) {
          const data = await res.json();
          const store = data?.store || data;

          // 1. Scheduled Posts (filter out any deleted IDs)
          if (store?.scheduledPosts && Array.isArray(store.scheduledPosts)) {
            const serverPosts: ScheduledPost[] = store.scheduledPosts.filter(
              (p: ScheduledPost) => !localDeletedPosts.includes(p.id)
            );
            setScheduledPosts((prev) => {
              const currentValid = prev.filter((p) => !localDeletedPosts.includes(p.id));
              const map = new Map<string, ScheduledPost>(currentValid.map((p) => [p.id, p]));
              let changed = currentValid.length !== prev.length;
              for (const sp of serverPosts) {
                if (!map.has(sp.id)) {
                  map.set(sp.id, sp);
                  changed = true;
                }
              }
              return changed ? Array.from(map.values()) : prev;
            });
          }

          // 2. Series Queue (filter out any deleted IDs)
          if (store?.seriesQueue && Array.isArray(store.seriesQueue)) {
            const serverSeries: SeriesJob[] = store.seriesQueue.filter(
              (s: SeriesJob) => !localDeletedSeries.includes(s.id)
            );
            setQueue((prev) => {
              const currentValid = prev.filter((s) => !localDeletedSeries.includes(s.id));
              const map = new Map<string, SeriesJob>(currentValid.map((s) => [s.id, s]));
              let changed = currentValid.length !== prev.length;
              for (const ss of serverSeries) {
                if (!map.has(ss.id)) {
                  map.set(ss.id, ss);
                  changed = true;
                }
              }
              return changed ? Array.from(map.values()) : prev;
            });
          }

          // 3. Social Channels
          if (store?.socialChannels && Array.isArray(store.socialChannels)) {
            const serverChannels: SocialChannel[] = store.socialChannels;
            if (
              serverChannels.length !== localChannels.length ||
              serverChannels.some((sc) => !localChannels.some((lc) => lc.id === sc.id))
            ) {
              setSocialChannels(serverChannels);
            }
          }

          // 4. Brand Profiles
          if (store?.brandProfiles && Array.isArray(store.brandProfiles)) {
            const serverProfiles: BrandProfile[] = store.brandProfiles;
            if (
              serverProfiles.length !== localProfiles.length ||
              serverProfiles.some((sp) => !localProfiles.some((lp) => lp.id === sp.id))
            ) {
              setBrandProfiles(serverProfiles);
            }
          }
        }
      } catch {
        // Local network / offline fallback
      }
    };

    // Initial sync
    const initialTimer = setTimeout(syncWithMcpStore, 300);

    // Periodic live-sync every 4 seconds
    const interval = setInterval(syncWithMcpStore, 4000);

    // Sync on window focus or tab visibility change
    const onFocusOrVisible = () => {
      void syncWithMcpStore();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [setScheduledPosts, setQueue, setSocialChannels, setBrandProfiles]);

  return {
    handleUpdateScheduledPosts,
    deleteSeriesJobFromMcp,
    clearSeriesQueueFromMcp,
  };
}
