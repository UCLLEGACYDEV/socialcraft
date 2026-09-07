import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { CryptoxNavbar } from "@/onyx/components/CryptoxNavbar";
import { StudioCarouselWorkspace } from "@/onyx/components/StudioCarouselWorkspace";
import { CarouselViewer } from "@/onyx/components/CarouselViewer";
import { SeriesQueue } from "@/onyx/components/SeriesQueue";
import { SettingsModal } from "@/onyx/components/SettingsModal";
import { BrandKitModal } from "@/onyx/components/BrandKitModal";
import { SlideEditModal, ModalShell } from "@/onyx/components/SlideEditModal";
import {
  AiCloneView,
  DirectPromptView,
  HistoryView,
  McpModalContent,
  PromptGallery,
} from "@/onyx/components/SimpleViews";
import { CloudGalleryView } from "@/onyx/components/CloudGalleryView";
import { PostSchedulerView } from "@/onyx/components/PostSchedulerView";
import { PostForMeSetupModal } from "@/onyx/components/PostForMeSetupModal";
import { PostForMeApiClient } from "@/onyx/postforme/client";
import { ThirtyDayBatchModal } from "@/onyx/components/ThirtyDayBatchModal";
import { saveImageToS4, saveCarouselToS4, ensureUserS4Folder, saveHistoryToS4, loadHistoryFromS4, makeProjectFolderName, syncCloudIdentityCookie } from "@/onyx/s4-storage";
import { CryptoxLandingPage } from "@/onyx/components/CryptoxLandingPage";
import { AdminDashboard } from "@/onyx/components/AdminDashboard";
import { AuthModal } from "@/onyx/components/AuthModal";
import { UserProfileModal } from "@/onyx/components/UserProfileModal";
import { CreditUpgradeModal } from "@/onyx/components/CreditUpgradeModal";
import { DatenschutzModal } from "@/onyx/components/DatenschutzModal";
import { type User, getStoredCurrentUser, getStoredUsers, saveStoredCurrentUser } from "@/onyx/auth";

import {
  DEFAULT_API_SETTINGS,
  DEFAULT_BRAND_KIT,
  DEFAULT_BRIEF,
  DEFAULT_CLONE_PROFILES,
  DEFAULT_SOCIAL_CHANNELS,
  ANCHORED_POSTFORME_API_KEY,
  assembleClonePrompt,
} from "@/onyx/defaults";
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

function OnyxStudio() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());
  const [currentView, setCurrentView] = usePersistentState<"landing" | "studio" | "admin">(
    "onyx.currentView",
    currentUser ? "studio" : "landing",
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // SaaS rule: Authenticated users stay in the Studio workspace; never bounced to marketing landing page
  useEffect(() => {
    if (currentUser && currentView === "landing") {
      setCurrentView("studio");
    }
  }, [currentUser, currentView, setCurrentView]);

  const handleLogout = () => {
    saveStoredCurrentUser(null);
    setCurrentUser(null);
    setCurrentView("landing");
    toast.info("Erfolgreich abgemeldet.");
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView("studio");
    toast.success(`Willkommen im Studio, ${user.name}! 🚀`, {
      description: "Deine 500 Erstellungs-Credits sind sofort einsatzbereit.",
    });
  };

  const [showCreditUpgrade, setShowCreditUpgrade] = useState(false);

  // 1-Click Universal Admin Switcher
  const handleOpenAdmin = () => {
    if (currentUser?.role !== "admin") {
      const users = getStoredUsers();
      const adminUser = users.find((u) => u.role === "admin") ?? {
        id: "usr-admin-01",
        name: "Daniel (Socialcraft AI Admin)",
        email: "admin@socialcraft.ai",
        role: "admin" as const,
        credits: 99999,
        createdAt: new Date().toISOString(),
        avatarUrl: "/images/socialcraft-admin-logo.jpg",
        status: "active" as const,
      };
      saveStoredCurrentUser(adminUser);
      setCurrentUser(adminUser);
      toast.success("Als Administrator angemeldet! 🛡️", {
        description: "Willkommen im Admin Control Center mit 99.999 Credits.",
      });
    }
    setCurrentView("admin");
  };

  // Prevent automatic downward scroll on reload and tab switch
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentView]);

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

  const [activeTab, setActiveTab] = usePersistentState<TabKey>(LS.activeTab, "carousel");
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
  const [scheduledPosts, setScheduledPosts] = usePersistentState<ScheduledPost[]>(
    LS.scheduledPosts,
    [],
  );
  const [schedulerInitialItem, setSchedulerInitialItem] = useState<{
    title: string;
    imageUrls: string[];
    prompt?: string;
  } | null>(null);

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
            }));

            const existingIds = new Set(socialChannels.map((c) => c.channelId));
            const newOnes = imported.filter((c) => !existingIds.has(c.channelId));
            if (newOnes.length > 0) {
              setSocialChannels([...socialChannels, ...newOnes]);
            }
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
  const [showSettings, setShowSettings] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showPostForMeSetup, setShowPostForMeSetup] = useState(false);
  const [show30DayBatch, setShow30DayBatch] = useState(false);
  const [showMcp, setShowMcp] = useState(false);
  const [editing, setEditing] = useState<{ jobId?: string; slideId: string } | null>(null);

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
      );
      setSlides(next);
      setTopic(brief.topic);
      rememberMotifs(next);
      toast.success(`${next.length} Prompts erzeugt${brief.useClone ? " (mit KI Clone)" : ""}`);
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
          toast.success(`${realNanoCount} Visuals via Nano-Banana 2 gerendert! 🍌`);
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
        toast.success(`Slide ${slide.slideNumber} via Nano-Banana 2 gerendert!`);
        void refreshCredits();
      } else {
        toast.success(`Slide ${slide.slideNumber} neu gerendert`);
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
          onNavigateStudio={() => setCurrentView("studio")}
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
          onNavigateLanding={() => setCurrentView("landing")}
          onNavigateStudio={() => setCurrentView("studio")}
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
    <div className="min-h-screen bg-[#060509] text-foreground relative overflow-x-hidden selection:bg-[#FF4D17] selection:text-white">
      {/* Subtle modern dark workspace background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[70rem] h-[35rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,77,23,0.08)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-[50%] -right-40 w-[35rem] h-[35rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,90,20,0.04)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Floating Top Navbar */}
        <CryptoxNavbar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onNavigateAdmin={handleOpenAdmin}
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={handleLogout}
          creditStatus={creditStatus}
          onRefreshCredits={() => void refreshCredits()}
          onOpenCreditsUpgrade={() => setShowCreditUpgrade(true)}
          onOpenBrandKit={() => setShowBrandKit(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMcp={() => setShowMcp(true)}
          onOpenDatenschutz={() => setShowDatenschutz(true)}
          onOpenPostForMeSetup={() => setShowPostForMeSetup(true)}
          onOpenZernioSetup={() => setShowPostForMeSetup(true)}
          onOpen30DayBatch={() => setShow30DayBatch(true)}
        />

        <main className="mx-auto w-full flex-1 p-4 sm:p-6 max-w-[1600px]">
          {activeTab === "carousel" &&
            (slides.length === 0 ? (
              <StudioCarouselWorkspace
                brief={brief}
                onChangeBrief={patchBrief}
                onSubmit={() => void generateCarousel()}
                isGenerating={isGeneratingCarousel}
                settings={settings}
                onChangeSettings={patchSettings}
                brandKit={brandKit}
                onChangeBrandKit={patchBrandKit}
                activeClone={activeClone}
                onOpenCloneStudio={() => setActiveTab("ai-clone")}
                onOpenPromptHub={() => setActiveTab("prompt-gallery")}
                onOpenBrandKit={() => setShowBrandKit(true)}
                onOpenSettings={() => setShowSettings(true)}
                currentUser={currentUser}
              />
            ) : (
              <div className="pt-4">
                <CarouselViewer
                  slides={slides}
                  topic={topic}
                  isGeneratingImages={isGeneratingImages}
                  onGenerateImages={() => void generateAllImages()}
                  onCancelGeneration={() => abortRef.current?.abort()}
                  onRerollImage={(id) => void rerollImage(id)}
                  onEditSlide={(id) => setEditing({ slideId: id })}
                  onDownloadSingle={(id, withOverlay) => {
                    const slide = slides.find((s) => s.id === id);
                    if (slide) void downloadSlide(slide, brandKit, withOverlay);
                  }}
                  onExportZip={(withOverlay) => void exportZip(withOverlay)}
                  onSaveToCloud={() => void saveCarouselToCloud()}
                  onSchedulePost={() => setActiveTab("scheduler")}
                  onReset={resetCarousel}
                  settings={settings}
                  brandKit={brandKit}
                  onUpdateSlides={setSlides}
                  onAddSlide={handleAddSlide}
                />
              </div>
            ))}

          {activeTab === "bulk" && (
            <SeriesQueue
              queue={queue}
              isRunning={isRunningQueue}
              onAddJobs={addJobs}
              onRunQueue={() => void runQueue()}
              onStopQueue={cancelAllQueue}
              onDeleteJob={(id) => setQueue((prev) => prev.filter((j) => j.id !== id))}
              onRenameJob={(id, value) => updateJob(id, { topic: value })}
              onEditSlide={(jobId, slideId) => setEditing({ jobId, slideId })}
              onRerollSlide={(jobId, slideId) => void runSingleJobSlide(jobId, slideId)}
              onDownloadSlide={(jobId, slideId) => void downloadFromJob(jobId, slideId)}
              onStartSlide={(jobId, slideId) => void runSingleJobSlide(jobId, slideId)}
              onCancelSlide={(jobId, slideId) => cancelJobSlide(jobId, slideId)}
              onRunSelectedSlides={(jobId, slideIds) => void runSelectedJobSlides(jobId, slideIds)}
              onCancelJobSlides={(jobId) => cancelJobSlides(jobId)}
              onSaveJobToCloud={(jobId) => void saveJobToCloud(jobId)}
              onOpen30DayBatch={() => setShow30DayBatch(true)}
              settings={settings}
              onChangeSettings={patchSettings}
            />
          )}

          {activeTab === "direct-prompt" && (
            <DirectPromptView
              initialPrompt={directPrompt}
              currentUser={currentUser}
              onNavigateToClone={() => setActiveTab("ai-clone")}
              onUseInCarousel={(imageUrl, promptText) => {
                patchBrief({ topic: promptText });
                setActiveTab("carousel");
                toast.success("Einzelbild ins Karussell übertragen!");
              }}
              onDeductCredits={(amt) => {
                if (currentUser) {
                  const updated = Math.max(0, (currentUser.credits ?? 0) - amt);
                  setCurrentUser((prev) => (prev ? { ...prev, credits: updated } : null));
                }
                void refreshCredits();
              }}
            />
          )}
          {activeTab === "scheduler" && (
            <PostSchedulerView
              channels={socialChannels}
              onUpdateChannels={setSocialChannels}
              posts={scheduledPosts}
              onUpdatePosts={setScheduledPosts}
              currentSlides={slides}
              historyEntries={history}
              initialScheduledItem={schedulerInitialItem}
              onNavigateToCarousel={() => setActiveTab("carousel")}
              settings={settings}
              onOpenPostForMeSetup={() => setShowPostForMeSetup(true)}
              onOpenZernioSetup={() => setShowPostForMeSetup(true)}
              onOpen30DayBatch={() => setShow30DayBatch(true)}
            />
          )}
          {activeTab === "ai-clone" && (
            <AiCloneView
              currentUser={currentUser}
              onDeductCredits={(amt) => {
                if (currentUser) {
                  const updated = Math.max(0, (currentUser.credits ?? 0) - amt);
                  setCurrentUser((prev) => (prev ? { ...prev, credits: updated } : null));
                }
                void refreshCredits();
              }}
              onUseInCarousel={() => {
                patchBrief({ useClone: true });
                setActiveTab("carousel");
                toast.success("KI Clone für Karussell aktiviert!");
              }}
              onUseInDirectPrompt={(clonePrompt) => {
                setDirectPrompt(clonePrompt);
                setActiveTab("direct-prompt");
                toast.success("KI Clone ins Einzelbild übertragen!");
              }}
            />
          )}
          {activeTab === "prompt-gallery" && (
            <PromptGallery
              onUseInCarousel={(promptText, title) => {
                patchBrief({ topic: `${title}: ${promptText}` });
                setActiveTab("carousel");
                toast.success("Prompt ins Karussell übertragen!");
              }}
              onUseInDirectPrompt={(promptText) => {
                setDirectPrompt(promptText);
                setActiveTab("direct-prompt");
                toast.success("Prompt ins Einzelbild übertragen!");
              }}
            />
          )}
          {activeTab === "history" && (
            <CloudGalleryView
              currentUser={currentUser}
              historyEntries={history}
              onOpenHistory={(entry) => {
                setSlides(entry.slides);
                setTopic(entry.topic);
                setActiveTab("carousel");
              }}
              onDeleteHistory={(id) => setHistory((prev) => prev.filter((e) => e.id !== id))}
              onUseInCarousel={(imageUrl, prompt) => {
                patchBrief({ topic: prompt });
                setActiveTab("carousel");
                toast.success("Bild ins Karussell geladen!");
              }}
              onUseInDirectPrompt={(prompt) => {
                setDirectPrompt(prompt);
                setActiveTab("direct-prompt");
                toast.success("Prompt ins Einzelbild übernommen!");
              }}
              onScheduleItem={(item) => {
                setSchedulerInitialItem(item);
                setActiveTab("scheduler");
                toast.success(`Projekt „${item.title}“ im Planer geöffnet! 📅`);
              }}
            />
          )}
        </main>

        {/* Studio Security & Privacy Footer */}
        <footer className="mt-auto border-t border-white/[0.06] bg-black/40 backdrop-blur-md px-6 py-4">
          <div className="mx-auto flex max-w-[1550px] flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-zinc-400">Socialcraft Security Shield v2.4 • TLS 256-Bit verschlüsselt</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowDatenschutz(true)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Datenschutz & Sicherheit (DSGVO)
              </button>
              <span>•</span>
              <span className="text-zinc-500">Zero-Tracking & Anti-Hacking Hardening</span>
            </div>
          </div>
        </footer>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={patchSettings}
          onClose={() => setShowSettings(false)}
          motifCount={motifs.length}
          onClearMotifs={() => {
            setMotifs([]);
            toast.success("Motiv-Cache geleert");
          }}
        />
      )}
      {showBrandKit && (
        <BrandKitModal
          brandKit={brandKit}
          onChange={patchBrandKit}
          onClose={() => setShowBrandKit(false)}
        />
      )}
      <PostForMeSetupModal
        isOpen={showPostForMeSetup}
        onClose={() => setShowPostForMeSetup(false)}
        settings={settings}
        onChangeSettings={patchSettings}
        channels={socialChannels}
        onUpdateChannels={setSocialChannels}
        onComplete={() => setActiveTab("scheduler")}
      />
      <ThirtyDayBatchModal
        isOpen={show30DayBatch}
        onClose={() => setShow30DayBatch(false)}
        settings={settings}
        onChangeSettings={patchSettings}
        channels={socialChannels}
        onUpdatePosts={setScheduledPosts}
        existingPosts={scheduledPosts}
      />
      {showMcp && (
        <ModalShell title="Claude Desktop MCP" onClose={() => setShowMcp(false)} maxHeight="70vh">
          <McpModalContent />
        </ModalShell>
      )}
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
    </div>
  );
}

function empty() {
  return { credits: 0, formatted: "n/a", success: false };
}
