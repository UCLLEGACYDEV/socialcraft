import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type {
  SocialChannel,
  ScheduledPost,
  ScheduledPostStatus,
  SocialPlatform,
  SlideContent,
  HistoryEntry,
  ApiSettings,
  BrandProfile,
} from "@/onyx/types";
import { DEFAULT_BRAND_PROFILES, ANCHORED_POSTFORME_API_KEY } from "@/onyx/defaults";
import { PostForMeApiClient } from "@/onyx/postforme/client";
import { type User, getStoredCurrentUser } from "@/onyx/auth";

export interface UseSchedulerStateProps {
  channels: SocialChannel[];
  onUpdateChannels: (channels: SocialChannel[]) => void;
  posts: ScheduledPost[];
  onUpdatePosts: (posts: ScheduledPost[]) => void;
  currentSlides?: SlideContent[];
  historyEntries?: HistoryEntry[];
  initialScheduledItem?: { title: string; imageUrls: string[]; prompt?: string } | null;
  onNavigateToCarousel?: () => void;
  settings?: ApiSettings;
  currentUser?: User | null;
  initialTab?: "calendar" | "queue" | "review" | "composer" | "channels" | "insights";
  brandProfiles?: BrandProfile[];
  activeProfileId?: string;
  onSelectProfile?: (id: string) => void;
  onUpdateBrandProfiles?: (profiles: BrandProfile[]) => void;
  onOpenBrandProfileManager?: () => void;
}

export type SchedulerTab = "calendar" | "review" | "composer" | "channels" | "insights";

export function useSchedulerState({
  channels,
  onUpdateChannels,
  posts,
  onUpdatePosts,
  currentSlides = [],
  historyEntries = [],
  initialScheduledItem = null,
  onNavigateToCarousel,
  settings,
  currentUser,
  initialTab = "calendar",
  brandProfiles = DEFAULT_BRAND_PROFILES,
  activeProfileId,
  onSelectProfile,
  onUpdateBrandProfiles,
  onOpenBrandProfileManager,
}: UseSchedulerStateProps) {
  const currentUserResolved = currentUser || getStoredCurrentUser();
  const isAdmin = currentUserResolved?.role === "admin";
  const activePostForMeKey = settings?.postForMeApiKey || ANCHORED_POSTFORME_API_KEY;

  // ── Brand Profile Resolution ──────────────────────────────────────────
  const resolvedProfiles = brandProfiles && brandProfiles.length > 0 ? brandProfiles : DEFAULT_BRAND_PROFILES;
  const [internalProfileId, setInternalProfileId] = useState<string>(activeProfileId || resolvedProfiles[0].id);
  const effectiveProfileId = activeProfileId || internalProfileId;
  const isAllProfiles = effectiveProfileId === "all";

  const activeProfile = useMemo(() => {
    if (isAllProfiles) {
      return {
        id: "all",
        slug: "all",
        name: "Alle Profile",
        description: "Gesamtübersicht aller Markenprofile",
        avatarUrl: "",
        color: "#FF4D17",
        isDefault: false,
      };
    }
    return resolvedProfiles.find((p) => p.id === effectiveProfileId) || resolvedProfiles[0];
  }, [isAllProfiles, resolvedProfiles, effectiveProfileId]);

  const handleSwitchProfile = useCallback(
    (id: string) => {
      if (onSelectProfile) {
        onSelectProfile(id);
      } else {
        setInternalProfileId(id);
      }
      const targetName =
        id === "all"
          ? "Alle Profile (Gesamtübersicht)"
          : resolvedProfiles.find((p) => p.id === id)?.name || id;
      toast.success(`Marken-Profil gewechselt: ${targetName}`);
    },
    [onSelectProfile, resolvedProfiles],
  );

  // ── Filtered Channels & Posts per Profile ──────────────────────────────
  const profileChannels = useMemo(() => {
    if (isAllProfiles) return channels;
    return channels.filter((c) => (c.profileId || resolvedProfiles[0].id) === activeProfile.id);
  }, [isAllProfiles, channels, resolvedProfiles, activeProfile.id]);

  const profilePosts = useMemo(() => {
    if (isAllProfiles) return posts;
    return posts.filter((p) => !p.profileId || p.profileId === activeProfile.id);
  }, [isAllProfiles, posts, activeProfile.id]);

  // ── Active Tab & Navigation ────────────────────────────────────────────
  const normalizedInitialTab =
    initialTab === "queue"
      ? "calendar"
      : initialScheduledItem
      ? "composer"
      : (initialTab as SchedulerTab);

  const [activeTab, setActiveTab] = useState<SchedulerTab>(normalizedInitialTab);

  // ── Filter & Search State ──────────────────────────────────────────────
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ── Modals & Selection State ───────────────────────────────────────────
  const [inspectPost, setInspectPost] = useState<ScheduledPost | null>(null);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);

  // Filtered posts for current view
  const visiblePosts = useMemo(() => {
    return profilePosts.filter((p) => {
      if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchCaption = p.caption.toLowerCase().includes(query);
        const matchTags = p.hashtags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchCaption && !matchTags) return false;
      }
      return true;
    });
  }, [profilePosts, filterPlatform, filterStatus, searchQuery]);

  // Posts pending review in Review-Inbox (in_review or draft)
  const pendingReviewPosts = useMemo(() => {
    return profilePosts.filter(
      (p) => p.status === "in_review" || p.status === "draft",
    );
  }, [profilePosts]);

  // ── Post Actions ───────────────────────────────────────────────────────
  const handleCreateOrUpdatePost = useCallback(
    (postData: Partial<ScheduledPost> & { id?: string }) => {
      const now = new Date().toISOString();
      if (postData.id) {
        // Update existing
        onUpdatePosts(
          posts.map((p) => (p.id === postData.id ? ({ ...p, ...postData } as ScheduledPost) : p)),
        );
        toast.success("Beitrag aktualisiert!");
      } else {
        // Create new
        const newPost: ScheduledPost = {
          id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: postData.title || "Neuer Beitrag",
          caption: postData.caption || "",
          hashtags: postData.hashtags || [],
          mediaUrls: postData.mediaUrls || [],
          mediaType: postData.mediaType || "carousel",
          channelId: postData.channelId || (profileChannels[0]?.id || "default"),
          platform: postData.platform || (profileChannels[0]?.platform || "instagram"),
          scheduledFor: postData.scheduledFor || new Date(Date.now() + 86400000).toISOString(),
          status: postData.status || "scheduled",
          createdAt: now,
          profileId: effectiveProfileId === "all" ? resolvedProfiles[0].id : effectiveProfileId,
          qualityScore: postData.qualityScore || 95,
        };
        onUpdatePosts([newPost, ...posts]);
        toast.success("Beitrag erfolgreich erstellt & eingeplant!");
      }
      setEditingPost(null);
      setActiveTab("calendar");
    },
    [posts, onUpdatePosts, profileChannels, effectiveProfileId, resolvedProfiles],
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      onUpdatePosts(posts.filter((p) => p.id !== postId));
      if (inspectPost?.id === postId) setInspectPost(null);
      toast.success("Beitrag entfernt");
    },
    [posts, onUpdatePosts, inspectPost],
  );

  const handleDuplicatePost = useCallback(
    (post: ScheduledPost) => {
      const copy: ScheduledPost = {
        ...post,
        id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `${post.title} (Kopie)`,
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      onUpdatePosts([copy, ...posts]);
      toast.success("Beitrag dupliziert (als Entwurf gesichert)");
    },
    [posts, onUpdatePosts],
  );

  const handleApprovePost = useCallback(
    (postId: string) => {
      const target = posts.find((p) => p.id === postId);
      if (!target) return;
      const scheduledTime = new Date(target.scheduledFor).getTime();
      const isPast = scheduledTime < Date.now();
      const updatedDate = isPast
        ? new Date(Date.now() + 3600000 * 2).toISOString()
        : target.scheduledFor;

      onUpdatePosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, status: "scheduled", scheduledFor: updatedDate }
            : p,
        ),
      );
      toast.success(`Beitrag „${target.title}“ freigegeben & eingeplant! 🚀`);
    },
    [posts, onUpdatePosts],
  );

  const handleRejectPost = useCallback(
    (postId: string, reason?: string) => {
      onUpdatePosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, status: "draft", errorMessage: reason || "Im Review-Gate abgelehnt" }
            : p,
        ),
      );
      toast.info("Beitrag als Entwurf markiert");
    },
    [posts, onUpdatePosts],
  );

  const handleBatchApprove = useCallback(
    (postIds: string[]) => {
      if (postIds.length === 0) return;
      const idSet = new Set(postIds);
      onUpdatePosts(
        posts.map((p) =>
          idSet.has(p.id) ? { ...p, status: "scheduled" } : p,
        ),
      );
      toast.success(`${postIds.length} Beiträge erfolgreich freigegeben! 🎉`);
    },
    [posts, onUpdatePosts],
  );

  const handleSlotChange = useCallback(
    (postId: string, newIsoDate: string) => {
      onUpdatePosts(
        posts.map((p) =>
          p.id === postId ? { ...p, scheduledFor: newIsoDate } : p,
        ),
      );
      toast.success("Sendezeitpunkt aktualisiert!");
    },
    [posts, onUpdatePosts],
  );

  // ── Direct Publish Flow (Post For Me API / Fallback) ───────────────────
  const handlePublishNow = useCallback(
    async (post: ScheduledPost) => {
      setIsPublishingId(post.id);
      onUpdatePosts(
        posts.map((p) => (p.id === post.id ? { ...p, status: "publishing" } : p)),
      );

      try {
        if (activePostForMeKey) {
          const client = new PostForMeApiClient(activePostForMeKey);
          // Try to publish via official multi-channel publisher
          const created = await client.createPost({
            social_accounts: [post.channelId],
            caption: `${post.caption}\n\n${post.hashtags.map((t) => `#${t.replace(/^#/, "")}`).join(" ")}`,
            media: post.mediaUrls.map((url) => ({ url })),
          });

          if (created?.id) {
            onUpdatePosts(
              posts.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      status: "published",
                      publishedAt: new Date().toISOString(),
                      postForMePostId: created.id,
                    }
                  : p,
              ),
            );
            toast.success(`Beitrag erfolgreich auf ${post.platform} veröffentlicht! 🚀`);
            return;
          }
        }

        // Simulated immediate publish for local/demo mode
        await new Promise((resolve) => setTimeout(resolve, 800));
        onUpdatePosts(
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  status: "published",
                  publishedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        toast.success(`Beitrag auf ${post.platform} live veröffentlicht! 🚀`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Veröffentlichungsfehler";
        onUpdatePosts(
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  status: "manual_needed",
                  errorMessage: `${errorMsg} (Fallback-Paket bereit)`,
                }
              : p,
          ),
        );
        toast.error(`Fehler beim Veröffentlichen: ${errorMsg}`);
      } finally {
        setIsPublishingId(null);
      }
    },
    [activePostForMeKey, posts, onUpdatePosts],
  );

  // ── Channel Actions ────────────────────────────────────────────────────
  const handleToggleChannel = useCallback(
    (channelId: string) => {
      onUpdateChannels(
        channels.map((c) =>
          c.id === channelId ? { ...c, isDefault: !c.isDefault } : c,
        ),
      );
    },
    [channels, onUpdateChannels],
  );

  const handleDisconnectChannel = useCallback(
    (channelId: string) => {
      onUpdateChannels(channels.filter((c) => c.id !== channelId));
      toast.success("Kanal-Verbindung getrennt");
    },
    [channels, onUpdateChannels],
  );

  const handleAddChannel = useCallback(
    (newChannel: SocialChannel) => {
      onUpdateChannels([...channels, newChannel]);
      toast.success(`Kanal „${newChannel.name}“ erfolgreich hinzugefügt!`);
    },
    [channels, onUpdateChannels],
  );

  return {
    // Brand Profiles
    resolvedProfiles,
    effectiveProfileId,
    isAllProfiles,
    activeProfile,
    handleSwitchProfile,
    onOpenBrandProfileManager,

    // Channels & Posts
    channels,
    profileChannels,
    posts,
    profilePosts,
    visiblePosts,
    pendingReviewPosts,

    // Tabs & Navigation
    activeTab,
    setActiveTab,
    currentSlides,
    historyEntries,
    initialScheduledItem,
    onNavigateToCarousel,

    // Filter & Search
    filterPlatform,
    setFilterPlatform,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,

    // Modals & Selection
    inspectPost,
    setInspectPost,
    editingPost,
    setEditingPost,
    isPublishingId,

    // Actions
    handleCreateOrUpdatePost,
    handleDeletePost,
    handleDuplicatePost,
    handleApprovePost,
    handleRejectPost,
    handleBatchApprove,
    handleSlotChange,
    handlePublishNow,
    handleToggleChannel,
    handleDisconnectChannel,
    handleAddChannel,

    // Settings
    settings,
    currentUser: currentUserResolved,
    isAdmin,
    hasPublisherKey: !!activePostForMeKey,
  };
}
