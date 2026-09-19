import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CalendarDays, Cloud, Compass, Image as ImageIcon, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  AdminDashboard,
  AuthModal,
  CreditUpgradeModal,
  CryptoxLandingPage,
  DatenschutzModal,
  SlideEditModal,
  StudioRoot,
  ThirtyDayBatchModal,
  UserProfileModal,
} from "@/onyx/components";
import { PostForMeApiClient } from "@/onyx/postforme/client";
import { saveImageToS4, saveCarouselToS4, ensureUserS4Folder, saveHistoryToS4, loadHistoryFromS4, makeProjectFolderName, syncCloudIdentityCookie } from "@/onyx/s4-storage";
import { type User, getStoredCurrentUser, getStoredUsers, saveStoredCurrentUser } from "@/onyx/auth";

import {
  DEFAULT_API_SETTINGS,
  DEFAULT_BRAND_KIT,
  DEFAULT_BRIEF,
  DEFAULT_CLONE_PROFILES,
  DEFAULT_SOCIAL_CHANNELS,
  DEFAULT_BRAND_PROFILES,
  ANCHORED_POSTFORME_API_KEY,
  assembleClonePrompt,
} from "@/onyx/defaults";
import type { BrandProfile } from "@/onyx/types";
import { LS, usePersistentState } from "@/onyx/storage";
import {
  generateImageUnified,
  getLiveCredits,
  makeId,
  mockGenerateCarousel,
  mockGenerateImage,
} from "@/onyx/mock-api";
import { downloadSlide, exportCarouselAsZip } from "@/onyx/export-zip";
import type {
  AiCloneProfile,
  ApiSettings,
  BrandKit,
  BriefValues,
  CreditStatus,
  HistoryEntry,
  ParsedCarousel,
  ScheduledPost,
  SeriesJob,
  SlideContent,
  SocialChannel,
  SocialPlatform,
  TabKey,
} from "@/onyx/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONYX Studio — Instagram Karussell Generator" },
      {
        name: "description",
        content:
          "ONYX Studio erzeugt komplette Instagram-Karussells aus Thema und Zielgruppe — Slides, Prompts, Visuals und ZIP-Export, alles lokal im Browser.",
      },
      { property: "og:title", content: "ONYX Studio — Instagram Karussell Generator" },
      {
        property: "og:description",
        content:
          "Von Thema zu fertiger Slide-Serie: Prompts, Visuals, Serienproduktion und ZIP-Export in einem dunklen Studio-Interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: OnyxStudio,
});

export { TAB_ROUTE_MAP, ROUTE_TAB_MAP } from "@/onyx/hooks/useStudioNavigation";
import {
  useStudioNavigation,
  type UseStudioNavigationOptions,
} from "@/onyx/hooks/useStudioNavigation";
import { useStudioModals } from "@/onyx/hooks/useStudioModals";
import { useMcpSync } from "@/onyx/hooks/useMcpSync";

export type OnyxStudioProps = UseStudioNavigationOptions;

export function OnyxStudio({ routeTab, initialView }: OnyxStudioProps = {}) {
  const {
    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    activeTab,
    setActiveTab,
    handleTabChange,
    handleLogout,
    handleAuthSuccess,
    handleOpenAdmin,
  } = useStudioNavigation({ routeTab, initialView });

  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    showProfileModal,
    setShowProfileModal,
    showDatenschutz,
    setShowDatenschutz,
    showCreditUpgrade,
    setShowCreditUpgrade,
    showBrandProfileManager,
    setShowBrandProfileManager,
    showBrandKit,
    setShowBrandKit,
    showSettings,
    setShowSettings,
    showPostForMeSetup,
    setShowPostForMeSetup,
    show30DayBatch,
    setShow30DayBatch,
    showMcp,
    setShowMcp,
    editing,
    setEditing,
    schedulerInitialItem,
    setSchedulerInitialItem,
    schedulerSubTab,
    setSchedulerSubTab,
  } = useStudioModals();

  // Ensure the cloud storage folder exists in the background (also for guests!)
  useEffect(() => {
    syncCloudIdentityCookie(currentUser);
    void ensureUserS4Folder(currentUser).then((res) => {
      if (res.success) {
        console.log(`[CloudStorage] User folder verified/created: ${res.folder}`);
      } else {
        console.warn(`[CloudStorage] Folder could not be created: ${res.error}`);
      }
    });
  }, [currentUser]);

  const [collapsed, setCollapsed] = usePersistentState<boolean>(LS.sidebarCollapsed, false);
  const [brandKit, setBrandKit] = usePersistentState<BrandKit>(LS.brandKit, DEFAULT_BRAND_KIT, true);
  const [settings, setSettings] = usePersistentState<ApiSettings>(
    LS.apiSettings,
    DEFAULT_API_SETTINGS,
    true,
  );

  const [slides, setSlides] = usePersistentState<SlideContent[]>(LS.activeSlides, []);
  const [topic, setTopic] = usePersistentState<string>(LS.currentTopic, "");
  const [queue, setQueue] = usePersistentState<SeriesJob[]>(LS.seriesQueue, []);
  const [motifs, setMotifs] = usePersistentState<string[]>(LS.motifHistory, []);
  const [history, setHistory] = usePersistentState<HistoryEntry[]>(LS.history, []);
  const [brief, setBrief] = usePersistentState<BriefValues>(LS.brief, DEFAULT_BRIEF);
  const [directPrompt, setDirectPrompt] = usePersistentState<string>("onyx.directPrompt", "");
  const [cloneProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeCloneId] = usePersistentState<string>(
    LS.activeCloneId,
    DEFAULT_CLONE_PROFILES[0]?.id ?? "",
  );
  const [socialChannels, setSocialChannels] = usePersistentState<SocialChannel[]>(
    LS.socialChannels,
    DEFAULT_SOCIAL_CHANNELS,
    true,
  );
  const [brandProfiles, setBrandProfiles] = usePersistentState<BrandProfile[]>(
    LS.brandProfiles,
    DEFAULT_BRAND_PROFILES,
    true,
  );
  const [activeBrandProfileId, setActiveBrandProfileId] = usePersistentState<string>(
    LS.activeBrandProfileId,
    DEFAULT_BRAND_PROFILES[0]?.id ?? "profile-default",
  );

  const [scheduledPosts, setScheduledPosts] = usePersistentState<ScheduledPost[]>(
    LS.scheduledPosts,
    [],
  );
  const [deletedPostIds, setDeletedPostIds] = usePersistentState<string[]>(
    LS.deletedPostIds,
    [],
  );
  const [deletedSeriesIds, setDeletedSeriesIds] = usePersistentState<string[]>(
    LS.deletedSeriesIds,
    [],
  );

  const { handleUpdateScheduledPosts } = useMcpSync({
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
  });

  // Ensure Post for Me is active as the dedicated publishing service
  useEffect(() => {
    if (!settings.postForMeApiKey) {
      setSettings((prev) => ({ ...prev, postForMeApiKey: ANCHORED_POSTFORME_API_KEY }));
    }
  }, [settings.postForMeApiKey, setSettings]);

  // Listen for Post for Me OAuth completion (via popup or redirect)
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === "POSTFORME_AUTH_SUCCESS") {
        try {
          const client = new PostForMeApiClient(settings.postForMeApiKey || ANCHORED_POSTFORME_API_KEY);
          const accounts = await client.getSocialAccounts();
          if (accounts.length > 0) {
            const platformMapping: Record<string, SocialPlatform> = {
              tiktok: "tiktok",
              instagram: "instagram",
              facebook: "facebook",
              linkedin: "linkedin",
              x: "twitter",
              twitter: "twitter",
              youtube: "youtube",
              threads: "threads",
              pinterest: "pinterest",
              bluesky: "bluesky",
            };

            const imported: SocialChannel[] = accounts.map((acc) => ({
              id: `pfm-${acc.id}`,
              platform: platformMapping[acc.platform.toLowerCase()] || "facebook",
              name: acc.display_name || acc.username || `${acc.platform} Account`,
              channelId: acc.id,
              postForMeAccountId: acc.id,
              handle: acc.username ? (acc.username.startsWith("@") ? acc.username : `@${acc.username}`) : undefined,
              avatarUrl: acc.profile_picture_url || "/images/socialcraft-logo.png",
              isDefault: false,
              profileId: activeBrandProfileId,
            }));

            setSocialChannels((prev) => {
              const existingIds = new Set(prev.map((c) => c.channelId));
              const newOnes = imported
                .filter((c) => !existingIds.has(c.channelId))
                .map((c) => ({ ...c, profileId: activeBrandProfileId }));
              const updatedExisting = prev.map((old) => {
                const fresh = imported.find((i) => i.channelId === old.channelId);
                return fresh ? { ...old, ...fresh, profileId: old.profileId || activeBrandProfileId } : old;
              });
              return [...updatedExisting, ...newOnes];
            });
          }
        } catch {}

        setActiveTab("scheduler");
        toast.success("Social-Media-Kanal erfolgreich verbunden! 🎉", {
          description: "Dein Account ist jetzt im Beitrags-Planer verfügbar.",
        });
      }
    };

    window.addEventListener("message", handleAuthMessage);

    // Also check URL params if redirected to root directly
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "scheduler" || params.get("connected") === "true") {
        setActiveTab("scheduler");
      }
    }

    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [settings.postForMeApiKey, socialChannels, setSocialChannels, setActiveTab]);

  // Restore history from the user's private cloud folder when local history is empty
  useEffect(() => {
    if (history.length > 0) return;
    let cancelled = false;
    void loadHistoryFromS4<HistoryEntry>(currentUser).then((cloudHistory) => {
      if (!cancelled && cloudHistory && cloudHistory.length > 0) {
        setHistory(cloudHistory);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Sync history into the user's private cloud folder (debounced)
  useEffect(() => {
    if (!settings.s4AutoSave || history.length === 0) return;
    const timer = setTimeout(() => {
      void saveHistoryToS4(history, currentUser);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, currentUser, settings.s4AutoSave]);



  const activeClone = useMemo(() => {
    return cloneProfiles.find((p) => p.id === activeCloneId) ?? cloneProfiles[0];
  }, [cloneProfiles, activeCloneId]);

  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRunningQueue, setIsRunningQueue] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);
  const queueAbortRef = useRef(false);
  const slideAbortControllers = useRef<Map<string, AbortController>>(new Map());

  const refreshCredits = useCallback(async () => {
    setCreditStatus((prev) =>
      prev ? { ...prev, loading: true } : { loading: true, kie: empty(), ai33: empty() },
    );
    setCreditStatus(await getLiveCredits(settings));
  }, [settings]);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  const patchBrief = (patch: Partial<BriefValues>) => setBrief((b) => ({ ...b, ...patch }));
  const patchSettings = (patch: Partial<ApiSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const patchBrandKit = (patch: Partial<BrandKit>) => setBrandKit((b) => ({ ...b, ...patch }));

  const rememberMotifs = useCallback(
    (list: SlideContent[]) => {
      setMotifs((prev) => Array.from(new Set([...prev, ...list.map((s) => s.coreMetaphor)])));
    },
    [setMotifs],
  );

  // ── Carousel ───────────────────────────────────────────────────────────
  const generateCarousel = async () => {
    setIsGeneratingCarousel(true);
    try {
      const clonePrefix =
        brief.useClone && activeClone ? assembleClonePrompt(activeClone) : "";
      const clonePlacement = activeClone?.placement ?? "hook_closing";
      const next = await mockGenerateCarousel(
        brief.slideCount,
        brief.topic,
        brief.audience,
        clonePrefix,
        clonePlacement,
        {
          apiKey: settings.geminiApiKey || brief.apiKey,
          styleId: brief.designId,
          customInstructions: brief.ctaText ? `CTA-Wunsch: ${brief.ctaText}` : undefined,
        }
      );
      setSlides(next);
      setTopic(brief.topic);
      rememberMotifs(next);
      toast.success(`${next.length} Story-Slides erzeugt${brief.useClone ? " (mit KI Clone)" : ""}`);
    } finally {
      setIsGeneratingCarousel(false);
    }
  };

  const setSlideFlag = (id: string, patch: Partial<SlideContent>) =>
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const generateAllImages = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGeneratingImages(true);
    let realNanoCount = 0;
    const carouselFolder = makeProjectFolderName(brief.topic || "karussell");
    // Keep an up-to-date copy of the slides including the freshly rendered images
    const renderedSlides: SlideContent[] = slides.map((s) => ({ ...s }));
    try {
      for (const slide of slides) {
        if (controller.signal.aborted) break;
        setSlideFlag(slide.id, { isGeneratingImage: true, renderProgress: 5, renderStatus: "rendering" });
        try {
          const res = await generateImageUnified({
            slideNumber: slide.slideNumber,
            prompt: slide.visualPrompt,
            settings,
            ...(brief.useClone && activeClone?.referenceImages && activeClone.referenceImages.length > 0
              ? { referenceImages: activeClone.referenceImages }
              : {}),
            aspectRatio: brandKit.aspectRatio,
            signal: controller.signal,
            onProgress: (info) => {
              if (info.percent !== undefined) {
                setSlideFlag(slide.id, { renderProgress: info.percent });
              }
            },
          });
          setSlideFlag(slide.id, { imageUrl: res.imageUrl, isGeneratingImage: false, renderProgress: 100, renderStatus: "done" });
          const idx = renderedSlides.findIndex((s) => s.id === slide.id);
          if (idx !== -1 && renderedSlides[idx]) renderedSlides[idx].imageUrl = res.imageUrl;
          if (settings.s4AutoSave) {
            const effectiveUser = currentUser || getStoredCurrentUser();

            void saveImageToS4({
              imageUrl: res.imageUrl,
              prompt: slide.visualPrompt,
              category: "carousel",
              aspectRatio: brandKit.aspectRatio,
              user: effectiveUser,
              customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
              subfolder: `carousels/${carouselFolder}`,
              projectName: carouselFolder,
              onError: (msg) => toast.error(`Slide ${slide.slideNumber} nicht in Cloud gesichert: ${msg}`),
            }).then((cloudImg) => {
              if (cloudImg) {
                toast.success(`Slide ${slide.slideNumber} in Cloud gesichert ☁️`, { duration: 2500 });
              }
            });
          }
          if (res.fromRealApi) realNanoCount++;
        } catch (err: unknown) {
          setSlideFlag(slide.id, { isGeneratingImage: false, renderProgress: 0, renderStatus: "error" });
          if (controller.signal.aborted) break;
          const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
          toast.error(`Slide ${slide.slideNumber}: ${msg}`);
          if (msg.includes("401") || msg.includes("API-Key") || msg.includes("402")) {
            setShowSettings(true);
            break;
          }
        }
      }
      if (!controller.signal.aborted) {
        if (settings.s4AutoSave) {
          const effectiveUser = currentUser || getStoredCurrentUser();
          void saveCarouselToS4({
            user: effectiveUser,
            carouselId: `car_${Date.now()}`,
            topic: brief.topic || "Instagram Karussell",
            folderName: carouselFolder,
            skipImages: true,
            slides: renderedSlides.map((s) => ({
              id: s.id,
              slideNumber: s.slideNumber,
              headline: s.headline,
              subtext: s.subtext,
              imageUrl: s.imageUrl,
              visualPrompt: s.visualPrompt,
            })),
          });
        }

        if (realNanoCount > 0) {
          toast.success(`${realNanoCount} Visuals erfolgreich in hoher Qualität gerendert! ✨`);
          void refreshCredits();
        } else {
          toast.success("Alle Visuals geladen & in Cloud-Ordner gesichert ☁️");
        }
      }
    } finally {
      setIsGeneratingImages(false);
      abortRef.current = null;
    }
  };

  const rerollImage = async (slideId: string) => {
    setSlideFlag(slideId, { isGeneratingImage: true, renderProgress: 5, renderStatus: "rendering" });
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) return;
    try {
      const res = await generateImageUnified({
        slideNumber: slide.slideNumber,
        prompt: slide.visualPrompt,
        settings,
        ...(brief.useClone && activeClone?.referenceImages && activeClone.referenceImages.length > 0
              ? { referenceImages: activeClone.referenceImages }
              : {}),
        aspectRatio: brandKit.aspectRatio,
        onProgress: (info) => {
          if (info.percent !== undefined) {
            setSlideFlag(slideId, { renderProgress: info.percent });
          }
        },
      });
      setSlideFlag(slideId, { imageUrl: res.imageUrl, isGeneratingImage: false, renderProgress: 100, renderStatus: "done" });
      if (settings.s4AutoSave) {
        const effectiveUser = currentUser || getStoredCurrentUser();
        const carouselFolder = makeProjectFolderName(brief.topic || "karussell");
        void saveImageToS4({
          imageUrl: res.imageUrl,
          prompt: slide.visualPrompt,
          category: "carousel",
          aspectRatio: brandKit.aspectRatio,
          user: effectiveUser,
          customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
          subfolder: `carousels/${carouselFolder}`,
          projectName: carouselFolder,
          onError: (msg) => toast.error(`Slide ${slide.slideNumber} nicht in Cloud gesichert: ${msg}`),
        }).then((cloudImg) => {
          if (cloudImg) {
            toast.success(`Slide ${slide.slideNumber} in Cloud aktualisiert ☁️`, { duration: 2500 });
          }
        });
      }
      if (res.fromRealApi) {
        toast.success(`Folie ${slide.slideNumber} erfolgreich in hoher Qualität gerendert! ✨`);
        void refreshCredits();
      } else {
        toast.success(`Folie ${slide.slideNumber} neu gerendert`);
      }
    } catch (err: unknown) {
      setSlideFlag(slideId, { isGeneratingImage: false, renderProgress: 0, renderStatus: "error" });
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
      if (msg.includes("401") || msg.includes("API-Key") || msg.includes("402")) {
        setShowSettings(true);
      }
    }
  };

  const resetCarousel = () => {
    if (slides.length > 0) {
      const entry: HistoryEntry = {
        id: makeId(),
        topic: topic || "Ohne Titel",
        slides,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [entry, ...prev].slice(0, 40));
    }
    setSlides([]);
    setTopic("");
  };

  const exportZip = async (withOverlay = true) => {
    const count = await exportCarouselAsZip(slides, topic, { brandKit, withOverlay });
    if (count) toast.success(`${count} Bilder ${withOverlay ? "mit Branding " : ""}als ZIP exportiert`);
  };

  const handleAddSlide = () => {
    const nextNum = slides.length + 1;
    const newSlide: SlideContent = {
      id: makeId(),
      slideNumber: nextNum,
      role: "expansion",
      roleLabel: `Slide ${nextNum}`,
      headline: `${topic || "Thema"} — Schritt ${nextNum}`,
      subtext: "Vertiefende Information für deine Zielgruppe.",
      coreMetaphor: "Visual",
      primaryProps: ["Minimalistisch", "Dunkles Licht"],
      visualPrompt: `High quality cinematic 3D portrait, dark background, 85mm portrait, slide ${nextNum} of ${nextNum} — ${topic || "Visual Story"}`,
    };
    setSlides([...slides, newSlide]);
    toast.success(`Slide ${nextNum} hinzugefügt`);
  };

  // ── Series queue ───────────────────────────────────────────────────────
  const addJobs = (carousels: ParsedCarousel[]) => {
    const jobs: SeriesJob[] = carousels.map((c) => ({
      id: makeId(),
      topic: c.title,
      audience: brief.audience,
      status: "queued",
      slidesTotal: c.slides.length,
      slidesDone: 0,
      slides: c.slides.map((s) => ({
        id: makeId(),
        slideNumber: s.slideNumber,
        role: s.slideNumber === 1 ? "hook" : s.slideNumber === c.slides.length ? "closing" : "concept",
        roleLabel: s.title,
        headline: s.headline || s.title,
        subtext: s.subtext || "",
        coreMetaphor: c.title,
        primaryProps: [],
        visualPrompt: s.prompt,
      })),
      createdAt: new Date().toISOString(),
    }));
    setQueue((prev) => [...prev, ...jobs]);
    toast.success(`${jobs.length} Jobs hinzugefügt`);
  };

  const updateJob = (id: string, patch: Partial<SeriesJob>) =>
    setQueue((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const updateJobSlide = (jobId: string, slideId: string, patch: Partial<SlideContent>) =>
    setQueue((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              slides: (j.slides ?? []).map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
            }
          : j,
      ),
    );

  const cancelJobSlide = (jobId: string, slideId: string) => {
    const key = `${jobId}:${slideId}`;
    const controller = slideAbortControllers.current.get(key);
    if (controller) {
      controller.abort();
      slideAbortControllers.current.delete(key);
    }
    updateJobSlide(jobId, slideId, {
      isGeneratingImage: false,
      renderProgress: 0,
      renderStatus: "cancelled",
    });
    toast.info("Slide-Generierung abgebrochen");
  };

  const cancelJobSlides = (jobId: string) => {
    const prefix = `${jobId}:`;
    slideAbortControllers.current.forEach((ctrl, key) => {
      if (key.startsWith(prefix)) {
        ctrl.abort();
        slideAbortControllers.current.delete(key);
      }
    });

    setQueue((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "cancelled",
              slides: (j.slides ?? []).map((s) =>
                s.isGeneratingImage
                  ? { ...s, isGeneratingImage: false, renderProgress: 0, renderStatus: "cancelled" as const }
                  : s,
              ),
            }
          : j,
      ),
    );
    toast.info("Job-Generierung abgebrochen");
  };

  const cancelAllQueue = () => {
    queueAbortRef.current = true;
    slideAbortControllers.current.forEach((ctrl) => ctrl.abort());
    slideAbortControllers.current.clear();
    setQueue((prev) =>
      prev.map((j) =>
        j.status === "rendering"
          ? {
              ...j,
              status: "cancelled",
              slides: (j.slides ?? []).map((s) =>
                s.isGeneratingImage
                  ? { ...s, isGeneratingImage: false, renderProgress: 0, renderStatus: "cancelled" as const }
                  : s,
              ),
            }
          : j,
      ),
    );
    setIsRunningQueue(false);
    toast.info("Queue und alle aktiven Slides abgebrochen");
  };

  /** Lädt alle fertigen Karussell-Slides in den privaten Cloud-Ordner */
  const saveCarouselToCloud = async () => {
    const rendered = slides.filter((s) => Boolean(s.imageUrl));
    if (rendered.length === 0) {
      toast.error("Keine fertigen Slides zum Speichern gefunden");
      return;
    }
    const folder = makeProjectFolderName(brief.topic || "karussell");
    const effectiveUser = currentUser || getStoredCurrentUser();
    toast.info(`Speichere ${rendered.length} Slides in die Cloud ...`);
    let ok = 0;
    for (const slide of rendered) {
      const saved = await saveImageToS4({
        imageUrl: slide.imageUrl as string,
        prompt: slide.visualPrompt,
        category: "carousel",
        aspectRatio: brandKit.aspectRatio,
        user: effectiveUser,
        customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
        subfolder: `carousels/${folder}`,
        projectName: folder,
        onError: (msg) => toast.error(`Slide ${slide.slideNumber}: ${msg}`),
      });
      if (saved) ok++;
    }
    await saveCarouselToS4({
      user: effectiveUser,
      carouselId: `car_${Date.now()}`,
      topic: brief.topic || "Instagram Karussell",
      folderName: folder,
      skipImages: true,
      slides: rendered.map((s) => ({
        id: s.id,
        slideNumber: s.slideNumber,
        headline: s.headline,
        subtext: s.subtext,
        imageUrl: s.imageUrl,
        visualPrompt: s.visualPrompt,
      })),
    });
    if (ok > 0) toast.success(`${ok} von ${rendered.length} Slides gespeichert: carousels/${folder}`);
  };

  /** Lädt alle bereits gerenderten Slides einer Serie in den privaten Cloud-Ordner */
  const saveJobToCloud = async (jobId: string) => {
    const job = queue.find((j) => j.id === jobId);
    const rendered = (job?.slides ?? []).filter((s) => Boolean(s.imageUrl));
    if (!job || rendered.length === 0) {
      toast.error("Keine gerenderten Slides zum Speichern gefunden");
      return;
    }
    const folder = makeProjectFolderName(job.topic ?? "series", job.id);
    const effectiveUser = currentUser || getStoredCurrentUser();
    toast.info(`Speichere ${rendered.length} Slides in die Cloud ...`);
    let ok = 0;
    for (const slide of rendered) {
      const saved = await saveImageToS4({
        imageUrl: slide.imageUrl as string,
        prompt: slide.visualPrompt,
        category: "series",
        user: effectiveUser,
        customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
        subfolder: `series/${folder}`,
        projectName: folder,
        onError: (msg) => toast.error(`Slide ${slide.slideNumber}: ${msg}`),
      });
      if (saved) ok++;
    }
    if (ok > 0) {
      toast.success(`${ok} von ${rendered.length} Slides gespeichert: series/${folder}`);
    }
  };

  const runSingleJobSlide = async (jobId: string, slideId: string) => {
    const job = queue.find((j) => j.id === jobId);
    const slide = job?.slides?.find((s) => s.id === slideId);
    if (!slide) return;

    const key = `${jobId}:${slideId}`;
    const controller = new AbortController();
    slideAbortControllers.current.set(key, controller);

    updateJobSlide(jobId, slideId, {
      isGeneratingImage: true,
      renderProgress: 5,
      renderStatus: "rendering",
    });

    try {
      const res = await generateImageUnified({
        slideNumber: slide.slideNumber,
        prompt: slide.visualPrompt,
        settings,
        signal: controller.signal,
        onProgress: (info) => {
          if (info.percent !== undefined) {
            updateJobSlide(jobId, slideId, { renderProgress: info.percent });
          }
        },
      });

      updateJobSlide(jobId, slideId, {
        imageUrl: res.imageUrl,
        isGeneratingImage: false,
        renderProgress: 100,
        renderStatus: "done",
      });

      if (settings.s4AutoSave) {
        const _seriesFolder = makeProjectFolderName(job?.topic ?? "series", jobId);
              void saveImageToS4({
                imageUrl: res.imageUrl,
                prompt: slide.visualPrompt,
                category: "series",
                user: currentUser || getStoredCurrentUser(),
                customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
                subfolder: `series/${_seriesFolder}`,
                projectName: _seriesFolder,
                onError: (msg) => toast.error(`Slide ${slide.slideNumber} nicht in Cloud gesichert: ${msg}`),
              });
      }

      setQueue((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const doneCount = (j.slides ?? []).filter((s) => s.id === slideId || Boolean(s.imageUrl)).length;
          return {
            ...j,
            slidesDone: doneCount,
            ...(doneCount === j.slidesTotal ? { status: "done" } : {}),
          };
        }),
      );

      if (res.fromRealApi) {
        toast.success(`Slide ${slide.slideNumber} via ONYX Ultra gerendert!`);
        void refreshCredits();
      } else {
        toast.success(`Slide ${slide.slideNumber} gerendert`);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        updateJobSlide(jobId, slideId, { isGeneratingImage: false, renderProgress: 0, renderStatus: "cancelled" });
        return;
      }
      updateJobSlide(jobId, slideId, { isGeneratingImage: false, renderProgress: 0, renderStatus: "error" });
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(`Slide ${slide.slideNumber}: ${msg}`);
      if (msg.includes("401") || msg.includes("API-Key") || msg.includes("402")) {
        setShowSettings(true);
      }
    } finally {
      slideAbortControllers.current.delete(key);
    }
  };

  const runSelectedJobSlides = async (jobId: string, slideIds: string[]) => {
    if (slideIds.length === 0) return;
    const job = queue.find((j) => j.id === jobId);
    if (!job?.slides) return;

    updateJob(jobId, { status: "rendering" });

    for (const slideId of slideIds) {
      const currentJob = queue.find((j) => j.id === jobId);
      if (currentJob?.status === "cancelled" || queueAbortRef.current) break;
      await runSingleJobSlide(jobId, slideId);
    }
  };

  const runQueue = async () => {
    queueAbortRef.current = false;
    setIsRunningQueue(true);
    try {
      const ids = queue.filter((j) => j.status === "queued" || j.status === "rendering").map((j) => j.id);
      for (const id of ids) {
        if (queueAbortRef.current) break;
        const job = queue.find((j) => j.id === id);
        if (!job?.slides) continue;
        updateJob(id, { status: "rendering" });

        for (const slide of job.slides) {
          if (queueAbortRef.current) break;
          // Skip if already rendered
          if (slide.imageUrl && !slide.isGeneratingImage) continue;

          const key = `${id}:${slide.id}`;
          const controller = new AbortController();
          slideAbortControllers.current.set(key, controller);

          updateJobSlide(id, slide.id, {
            isGeneratingImage: true,
            renderProgress: 5,
            renderStatus: "rendering",
          });

          try {
            const res = await generateImageUnified({
              slideNumber: slide.slideNumber,
              prompt: slide.visualPrompt,
              settings,
              signal: controller.signal,
              onProgress: (info) => {
                if (info.percent !== undefined) {
                  updateJobSlide(id, slide.id, { renderProgress: info.percent });
                }
              },
            });

            updateJobSlide(id, slide.id, {
              imageUrl: res.imageUrl,
              isGeneratingImage: false,
              renderProgress: 100,
              renderStatus: "done",
            });

            if (settings.s4AutoSave) {
              const _qSeriesFolder = makeProjectFolderName(job?.topic ?? "series", id);
              void saveImageToS4({
                imageUrl: res.imageUrl,
                prompt: slide.visualPrompt,
                category: "series",
                user: currentUser || getStoredCurrentUser(),
                customFilename: `slide_${String(slide.slideNumber).padStart(2, "0")}.jpg`,
                subfolder: `series/${_qSeriesFolder}`,
                projectName: _qSeriesFolder,
                onError: (msg) => toast.error(`Slide ${slide.slideNumber} nicht in Cloud gesichert: ${msg}`),
              });
            }

            setQueue((prev) =>
              prev.map((j) => {
                if (j.id !== id) return j;
                const count = (j.slides ?? []).filter((s) => s.id === slide.id || Boolean(s.imageUrl)).length;
                return { ...j, slidesDone: count };
              }),
            );
          } catch (err: unknown) {
            if (controller.signal.aborted || queueAbortRef.current) {
              updateJobSlide(id, slide.id, { isGeneratingImage: false, renderProgress: 0, renderStatus: "cancelled" });
              break;
            }
            updateJobSlide(id, slide.id, { isGeneratingImage: false, renderProgress: 0, renderStatus: "error" });
            const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
            toast.error(`Slide ${slide.slideNumber}: ${msg}`);
            if (msg.includes("401") || msg.includes("API-Key") || msg.includes("402")) {
              setShowSettings(true);
              break;
            }
          } finally {
            slideAbortControllers.current.delete(key);
          }
        }

        const freshJob = queue.find((j) => j.id === id);
        const finalDone = (freshJob?.slides ?? []).filter((s) => Boolean(s.imageUrl)).length;
        updateJob(id, {
          status: queueAbortRef.current ? "cancelled" : finalDone >= job.slidesTotal ? "done" : "queued",
          slidesDone: finalDone,
        });
      }
    } finally {
      setIsRunningQueue(false);
    }
  };

  const heroChips = useMemo(
    () => [
      { label: "Slides", value: String(brief.slideCount), side: "left" as const, top: "6rem" },
      { label: "Engine", value: "ONYX Ultra", side: "right" as const, top: "6rem" },
      { label: "Motive", value: `${motifs.length} gemerkt`, side: "left" as const, top: "11rem" },
      {
        label: "Format",
        value: brandKit.aspectRatio,
        side: "right" as const,
        top: "11rem",
      },
    ],
    [brief.slideCount, motifs.length, brandKit.aspectRatio],
  );

  const seriesProgress = useMemo(() => {
    if (!isRunningQueue) return null;
    const total = queue.length;
    const done = queue.filter((j) => j.status === "done").length;
    return { done, total };
  }, [isRunningQueue, queue]);

  // ── Editing ────────────────────────────────────────────────────────────
  const editingSlide = useMemo(() => {
    if (!editing) return null;
    if (editing.jobId) {
      const job = queue.find((j) => j.id === editing.jobId);
      return job?.slides?.find((s) => s.id === editing.slideId) ?? null;
    }
    return slides.find((s) => s.id === editing.slideId) ?? null;
  }, [editing, queue, slides]);

  const applyEdit = (
    patch: { headline: string; subtext: string; visualPrompt: string },
    regenerate: boolean,
  ) => {
    if (!editing) return;
    const { jobId, slideId } = editing;
    if (jobId) updateJobSlide(jobId, slideId, patch);
    else setSlideFlag(slideId, patch);
    setEditing(null);

    if (regenerate) {
      if (jobId) {
        void runSingleJobSlide(jobId, slideId);
      } else {
        void rerollImage(slideId);
      }
    }
  };

  const downloadFromJob = async (jobId: string, slideId: string) => {
    const slide = queue.find((j) => j.id === jobId)?.slides?.find((s) => s.id === slideId);
    if (slide) await downloadSlide(slide);
  };

  if (currentView === "landing") {
    return (
      <div className="min-h-screen bg-[#07050A] text-white">
        <CryptoxLandingPage
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
          onNavigateStudio={() => {
            setCurrentView("studio");
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
              window.history.pushState(null, "", "/");
            }
          }}
          onNavigateAdmin={handleOpenAdmin}
          onOpenCreditsUpgrade={() => setShowCreditUpgrade(true)}
          onLogout={handleLogout}
          onOpenDatenschutz={() => setShowDatenschutz(true)}
        />
        {showAuthModal && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
        {showCreditUpgrade && (
          <CreditUpgradeModal
            currentUser={currentUser}
            onClose={() => setShowCreditUpgrade(false)}
            onCreditsUpdated={(newTotal) => {
              if (currentUser) {
                setCurrentUser((prev) => (prev ? { ...prev, credits: newTotal } : null));
              }
              void refreshCredits();
            }}
            onNavigateAdmin={handleOpenAdmin}
            settings={settings}
            onChangeSettings={patchSettings}
            creditStatus={creditStatus}
            onRefreshCredits={() => void refreshCredits()}
          />
        )}
        {showDatenschutz && (
          <DatenschutzModal
            onClose={() => setShowDatenschutz(false)}
            onClearAllData={() => {
              setCurrentUser(null);
              setSlides([]);
              setHistory([]);
            }}
          />
        )}
        <Toaster />
      </div>
    );
  }

  if (currentView === "admin") {
    return (
      <div className="min-h-screen bg-[#0A080E] text-white">
        <AdminDashboard
          currentUser={currentUser}
          onNavigateLanding={() => {
            setCurrentView("landing");
            if (typeof window !== "undefined" && window.location.pathname !== "/willkommen") {
              window.history.pushState(null, "", "/willkommen");
            }
          }}
          onNavigateStudio={() => {
            setCurrentView("studio");
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
              window.history.pushState(null, "", "/");
            }
          }}
          onLogout={handleLogout}
        />
        {showAuthModal && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
        {showDatenschutz && (
          <DatenschutzModal
            onClose={() => setShowDatenschutz(false)}
            onClearAllData={() => {
              setCurrentUser(null);
              setSlides([]);
              setHistory([]);
            }}
          />
        )}
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <StudioRoot
        currentTab={activeTab}
        onNavigateTab={handleTabChange}
        onNavigateLanding={() => {
          setCurrentView("landing");
          if (typeof window !== "undefined" && window.location.pathname !== "/willkommen") {
            window.history.pushState(null, "", "/willkommen");
          }
        }}
        onNavigateAdmin={handleOpenAdmin}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        creditStatus={creditStatus}
        onRefreshCredits={() => void refreshCredits()}
        onOpenCreditsUpgrade={() => setShowCreditUpgrade(true)}
        brandKit={brandKit}
        onChangeBrandKit={patchBrandKit}
        settings={settings}
        onChangeSettings={patchSettings}
        activeClone={activeClone}
        brandProfiles={brandProfiles}
        activeBrandProfileId={activeBrandProfileId}
        onSelectBrandProfile={setActiveBrandProfileId}
        onUpdateBrandProfiles={setBrandProfiles}
        brief={brief}
        onChangeBrief={patchBrief}
        slides={slides}
        onUpdateSlide={setSlideFlag}
        onGenerateStoryboard={() => generateCarousel()}
        isGeneratingStoryboard={isGeneratingCarousel}
        onRenderImages={() => generateAllImages()}
        isRenderingImages={isGeneratingImages}
        onResetCarousel={resetCarousel}
        onExportZip={(withOverlay) => exportZip(withOverlay)}
        onRerollImage={(id) => rerollImage(id)}
        queue={queue}
        isRunningQueue={isRunningQueue}
        onAddJobs={addJobs}
        onRunQueue={() => runQueue()}
        onStopQueue={cancelAllQueue}
        onDeleteJob={(id) => {
          setQueue((prev) => prev.filter((j) => j.id !== id));
          setDeletedSeriesIds((prev) => Array.from(new Set([...prev, id])));
          fetch(`/api/mcp/series/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        }}
        onClearQueue={() => {
          setQueue((prev) => {
            const ids = prev.map((j) => j.id);
            if (ids.length > 0) {
              setDeletedSeriesIds((old) => Array.from(new Set([...old, ...ids])));
            }
            return [];
          });
          fetch("/api/mcp/series?all=true", { method: "DELETE" }).catch(() => {});
        }}
        onRenameJob={(id, value) => updateJob(id, { topic: value })}
        onEditJobSlide={(jobId, slideId) => setEditing({ jobId, slideId })}
        onRerollJobSlide={(jobId, slideId) => runSingleJobSlide(jobId, slideId)}
        onDownloadJobSlide={(jobId, slideId) => downloadFromJob(jobId, slideId)}
        onStartJobSlide={(jobId, slideId) => runSingleJobSlide(jobId, slideId)}
        onCancelJobSlide={(jobId, slideId) => cancelJobSlide(jobId, slideId)}
        onRunSelectedJobSlides={(jobId, slideIds) => runSelectedJobSlides(jobId, slideIds)}
        onCancelJobSlides={(jobId) => cancelJobSlides(jobId)}
        onSaveJobToCloud={(jobId) => saveJobToCloud(jobId)}
        onOpen30DayBatch={() => setShow30DayBatch(true)}
        scheduledPosts={scheduledPosts}
        onUpdateScheduledPosts={handleUpdateScheduledPosts}
        socialChannels={socialChannels}
        onUpdateSocialChannels={setSocialChannels}
        schedulerSubTab={schedulerSubTab}
        history={history}
        onSelectHistoryEntry={(entry) => {
          setSlides(entry.slides);
          setTopic(entry.topic);
        }}
      />

      <ThirtyDayBatchModal
        isOpen={show30DayBatch}
        onClose={() => setShow30DayBatch(false)}
        settings={settings}
        onChangeSettings={patchSettings}
        channels={socialChannels}
        onUpdatePosts={handleUpdateScheduledPosts}
        existingPosts={scheduledPosts}
      />
      {editingSlide && (
        <SlideEditModal
          slide={editingSlide}
          onClose={() => setEditing(null)}
          onSave={(patch) => applyEdit(patch, false)}
          onRegenerate={(patch) => applyEdit(patch, true)}
        />
      )}
      {showAuthModal && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
      {showCreditUpgrade && (
        <CreditUpgradeModal
          currentUser={currentUser}
          onClose={() => setShowCreditUpgrade(false)}
          onCreditsUpdated={(newTotal) => {
            if (currentUser) {
              setCurrentUser((prev) => (prev ? { ...prev, credits: newTotal } : null));
            }
            void refreshCredits();
          }}
          onNavigateAdmin={handleOpenAdmin}
          settings={settings}
          onChangeSettings={patchSettings}
          creditStatus={creditStatus}
          onRefreshCredits={() => void refreshCredits()}
        />
      )}
      {showProfileModal && currentUser && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={(u) => setCurrentUser(u)}
          onLogout={handleLogout}
        />
      )}
      {showDatenschutz && (
        <DatenschutzModal
          onClose={() => setShowDatenschutz(false)}
          onClearAllData={() => {
            setCurrentUser(null);
            setSlides([]);
            setHistory([]);
          }}
        />
      )}
      <Toaster />
    </>
  );
}

function empty() {
  return { credits: 0, formatted: "n/a", success: false };
}
